require('dotenv').config(); // 1. เรียกใช้ dotenv
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors()); // อนุญาตให้ Frontend ยิงเข้ามาได้
app.use(bodyParser.json());

// --- ส่วนการเชื่อมต่อ Database (แก้เพื่อ Cloud) ---
// เราจะไม่ใส่ Link ตรงๆ ในโค้ด แต่จะให้ไปอ่านจาก Environment Variable ชื่อ DATABASE_URL แทน
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false, // **สำคัญมาก** สำหรับ Neon ต้องใส่บรรทัดนี้
  },
});

// --- ทดสอบว่าเชื่อมติดไหม (Optional) ---
pool.connect()
  .then(() => console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว!'))
  .catch(err => console.error('❌ เชื่อมต่อไม่ได้! ตรวจสอบ Environment Variable:', err.message));


// --- API 1: สำหรับบันทึกข้อมูล ---
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

// --- API 2: สำหรับ Dashboard (รองรับการกรองเดือน) ---
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { month, year } = req.query; // รับค่าจาก Frontend เช่น ?month=11&year=2025

    // สร้างเงื่อนไข WHERE (ถ้ามีการเลือกเดือน/ปี)
    let dateFilter = "";
    let queryParams = [];

    if (month && year) {
      dateFilter = `WHERE EXTRACT(MONTH FROM exam_date) = $1 AND EXTRACT(YEAR FROM exam_date) = $2`;
      queryParams = [month, year];
    }

    // 1. SQL นับสถิติ
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
    
    // 2. SQL ดึงรายการล่าสุด
    const recentQuery = `
      SELECT id, hn, exam_date, left_ear_result, right_ear_result
      FROM chackear_hearing_screenings
      ${dateFilter}
      ORDER BY exam_date DESC, id DESC LIMIT 5;
    `;

    const [statsRes, recentRes] = await Promise.all([
      pool.query(statsQuery, queryParams),
      pool.query(recentQuery, queryParams)
    ]);

    // จัดรูปแบบข้อมูล
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

// --- Start Server (สำคัญสำหรับ Render) ---
const PORT = process.env.PORT || 3001; // ให้ Render กำหนด Port ถ้าไม่มีให้ใช้ 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});