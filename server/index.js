require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ส่วนการเชื่อมต่อ Database ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // สำหรับ Neon หรือ Cloud DB
  },
});

// --- ทดสอบเชื่อมต่อ ---
pool.connect()
  .then(() => console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว!'))
  .catch(err => console.error('❌ เชื่อมต่อไม่ได้:', err.message));

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this';

// --- Demo Users ---
const demoUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' }
];

// --- Middleware: ตรวจสอบ Token ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'ไม่พบ token' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token ไม่ถูกต้อง' });
    req.user = user;
    next();
  });
};

// --- Middleware: ตรวจสอบ Admin ---
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ (เฉพาะ Admin)' });
  }
  next();
};

// --- API 1: บันทึกข้อมูล (เหมือนเดิม ไม่ต้องแก้) ---
app.post('/api/save-screening', async (req, res) => {
  const { hn, birthDate, examDate, leftResult, rightResult } = req.body;

  try {
    // 1. Insert คนไข้ (ถ้ามี HN นี้แล้วให้ข้าม)
    await pool.query(
      `INSERT INTO chackear (hn, birth_date) 
       VALUES ($1, $2) 
       ON CONFLICT (hn) DO NOTHING`,
      [hn, birthDate]
    );

    // 2. บันทึกผลตรวจ
    const result = await pool.query(
      `INSERT INTO chackear_hearing_screenings 
       (hn, exam_date, left_ear_result, right_ear_result) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [hn, examDate, leftResult, rightResult]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API 2: Dashboard (🔴 แก้ไขให้รองรับ startDate / endDate) ---
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // 1. รับค่า startDate และ endDate แทน month/year
    const { startDate, endDate } = req.query; 

    // สร้างเงื่อนไข WHERE สำหรับช่วงเวลา
    let dateFilter = "";
    let queryParams = [];

    // ถ้ามีค่าส่งมา ให้กรองตามช่วงวันที่
    if (startDate && endDate) {
      dateFilter = `WHERE exam_date >= $1 AND exam_date <= $2`;
      queryParams = [startDate, endDate];
    }

    // 2. SQL นับสถิติ (Count)
    const statsQuery = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE left_ear_result = 'PASS' AND right_ear_result = 'PASS') AS both_pass,
        COUNT(*) - COUNT(*) FILTER (WHERE left_ear_result = 'PASS' AND right_ear_result = 'PASS') AS at_least_one_fail,
        COUNT(*) FILTER (WHERE left_ear_result = 'PASS') AS left_pass,
        COUNT(*) FILTER (WHERE left_ear_result = 'FAIL') AS left_fail,
        COUNT(*) FILTER (WHERE right_ear_result = 'PASS') AS right_pass,
        COUNT(*) FILTER (WHERE right_ear_result = 'FAIL') AS right_fail
      FROM chackear_hearing_screenings
      ${dateFilter}; 
    `;
    
    // 3. SQL ดึงรายการล่าสุด (List)
    // เอา LIMIT 5 ออก เพื่อให้เห็นครบทุกรายการในช่วงเวลานั้น
    const recentQuery = `
      SELECT id, hn, exam_date, left_ear_result, right_ear_result
      FROM chackear_hearing_screenings
      ${dateFilter}
      ORDER BY exam_date DESC, id DESC; 
    `;

    // รัน Query พร้อมกัน
    const [statsRes, recentRes] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(recentQuery, queryParams)
    ]);

    // จัดรูปแบบข้อมูลส่งกลับ Frontend
    const s = statsRes.rows[0];
    const dashboardData = {
      summary: {
        total: parseInt(s.total || 0),
        pass: parseInt(s.both_pass || 0),
        fail: parseInt(s.at_least_one_fail || 0)
      },
      earStats: {
        left: { pass: parseInt(s.left_pass || 0), fail: parseInt(s.left_fail || 0) },
        right: { pass: parseInt(s.right_pass || 0), fail: parseInt(s.right_fail || 0) }
      },
      recentActivity: recentRes.rows
    };

    res.json({ success: true, data: dashboardData });

  } catch (err) {
    console.error("Dashboard API Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API 3: ดึงข้อมูลการตรวจ 1 รายการ (GET) ---
app.get('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, hn, exam_date, left_ear_result, right_ear_result 
       FROM chackear_hearing_screenings 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'ไม่พบข้อมูล' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API 4: อัปเดตการตรวจ (PUT) ---
app.put('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const { exam_date, left_ear_result, right_ear_result } = req.body;

  try {
    const result = await pool.query(
      `UPDATE chackear_hearing_screenings 
       SET exam_date = $1, left_ear_result = $2, right_ear_result = $3
       WHERE id = $4 
       RETURNING *`,
      [exam_date, left_ear_result, right_ear_result, id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'ไม่พบข้อมูล' });
    }

    res.json({ success: true, data: result.rows[0], message: 'บันทึกสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API ใหม่: ค้นหาการตรวจจาก HN (รองรับ partial match) ---
app.get('/api/exams-by-hn/:hn', async (req, res) => {
  const { hn } = req.params;
  try {
    const q = `
      SELECT id, hn, exam_date, left_ear_result, right_ear_result
      FROM chackear_hearing_screenings
      WHERE hn ILIKE $1
      ORDER BY exam_date DESC, id DESC
    `;
    const result = await pool.query(q, [`%${hn}%`]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Search by HN error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API: Login ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = demoUsers.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
});

// --- API: ลบการตรวจ (DELETE) - เฉพาะ Admin ---
app.delete('/api/exams/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM chackear_hearing_screenings WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'ไม่พบข้อมูล' });
    }

    res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- API: Export CSV - เฉพาะ Admin ---
app.get('/api/export-csv', authenticateToken, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT 
        chs.id,
        chs.hn,
        c.birth_date,
        chs.exam_date,
        chs.left_ear_result,
        chs.right_ear_result
      FROM chackear_hearing_screenings chs
      LEFT JOIN chackear c ON chs.hn = c.hn
    `;
    let params = [];

    if (startDate && endDate) {
      query += ` WHERE chs.exam_date >= $1 AND chs.exam_date <= $2`;
      params = [startDate, endDate];
    }

    query += ` ORDER BY chs.exam_date DESC`;

    const result = await pool.query(query, params);
    const data = result.rows;

    // สร้าง CSV
    let csv = 'HN,วันเกิด,วันที่ตรวจ,หูซ้าย,หูขวา\n';
    data.forEach(row => {
      const birthDate = row.birth_date ? new Date(row.birth_date).toLocaleDateString('th-TH') : '-';
      const examDate = new Date(row.exam_date).toLocaleDateString('th-TH');
      csv += `"${row.hn}","${birthDate}","${examDate}","${row.left_ear_result}","${row.right_ear_result}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8-sig');
    res.setHeader('Content-Disposition', 'attachment; filename=eare-data.csv');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});