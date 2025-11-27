import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickHn, setQuickHn] = useState('');
  const [quickResults, setQuickResults] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  
  const getLocalISOString = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(getLocalISOString(firstDay));
  const [endDate, setEndDate] = useState(getLocalISOString(today));

  // --- ดึงข้อมูล (แยกเป็นฟังก์ชันเพื่อเรียกใหม่หลังลบ) ---
  const fetchStats = async (s = startDate, e = endDate) => {
    if (!s || !e) return;
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = `${apiUrl}/api/dashboard-stats?startDate=${s}&endDate=${e}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (err) {
      console.error('fetchStats error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(startDate, endDate);
  }, [startDate, endDate]);

  // --- ฟังก์ชัน Quick Search (ค้นหา HN แล้วแสดงผลเป็นตัวเลือกให้แก้ไขได้ทันที) ---
  const handleQuickSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setQuickError('');
    setQuickResults([]);
    if (!quickHn.trim()) {
      setQuickError('กรุณากรอก HN');
      return;
    }
    setQuickLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/exams-by-hn/${encodeURIComponent(quickHn.trim())}`);
      const json = await res.json();
      if (json.success) {
        setQuickResults(json.data);
      } else {
        setQuickError(json.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      setQuickError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setQuickLoading(false);
    }
  };

  // ฟังก์ชันแปลงวันที่สำหรับแสดงผล (31 ต.ค. 68)
  const formatDateDisplay = (dateString) => {
    if(!dateString) return "";
    return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  // track current user + token so Dashboard updates right after login/logout
  const [currentUser, setCurrentUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const onStorage = () => {
      const u = localStorage.getItem('user');
      setCurrentUser(u ? JSON.parse(u) : null);
      setToken(localStorage.getItem('token') || '');
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('storage-update', onStorage); // custom event dispatched from Login

    // small debug log to verify values
    onStorage();
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('storage-update', onStorage);
    };
  }, []);

  // DEBUG: ลองเปิดคอนโซลเพื่อตรวจ isAdmin หลัง render
  useEffect(() => {
    console.log('Dashboard currentUser:', currentUser, 'isAdmin:', isAdmin);
  }, [currentUser, isAdmin]);

  // ฟังก์ชันลบข้อมูล (ใช้ fetchStats รีเฟรชแทน reload)
  const handleDeleteExam = async (id) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบข้อมูลนี้?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('ลบข้อมูลสำเร็จ!');
        // รีเฟรชข้อมูลจาก API (ไม่ต้อง reload หน้าทั้งหมด)
        fetchStats(startDate, endDate);
      } else {
        alert(data.message || 'ไม่สามารถลบได้');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // --- ฟังก์ชัน Export จากช่วงเวลาที่เลือก ---
  const handleExportFromDashboard = async () => {
    if (!startDate || !endDate) {
      alert('กรุณาเลือกช่วงเวลา');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(
        `${apiUrl}/api/export-csv?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert('สิทธิ์ไม่พอ กรุณาเข้าสู่ระบบใหม่');
          return;
        }
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eare-data-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert('ดาวน์โหลดสำเร็จ!');
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถดาวน์โหลดได้ ลองอีกครั้ง');
    }
  };

  // --- ฟัง event export-requested จาก Navbar ---
  useEffect(() => {
    const handleExportRequest = () => {
      handleExportFromDashboard();
    };

    window.addEventListener('export-requested', handleExportRequest);
    return () => window.removeEventListener('export-requested', handleExportRequest);
  }, [startDate, endDate, token]);

  if (loading) return (
    <div className="dashboard-container">
      <div className="loading-state">
         <p>⏳ กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (!stats) return <div className="dashboard-container"><div className="error-state">ไม่พบข้อมูล</div></div>;

  // --- Config กราฟ (เหมือนเดิม) ---
  const overviewPieData = {
    labels: ['ผ่าน (Pass)', 'ต้องส่งต่อ (Fail)'],
    datasets: [{
      data: [stats.summary.pass, stats.summary.fail],
      backgroundColor: ['#00C851', '#FF4444'],
      borderWidth: 0,
    }],
  };

  const earBarData = {
    labels: ['หูซ้าย (Left)', 'หูขวา (Right)'],
    datasets: [
      { label: 'Pass', data: [stats.earStats.left.pass, stats.earStats.right.pass], backgroundColor: '#00C851', borderRadius: 5 },
      { label: 'Fail', data: [stats.earStats.left.fail, stats.earStats.right.fail], backgroundColor: '#FF4444', borderRadius: 5 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' }, beginAtZero: true } }
  };

  return (
    <div className="dashboard-container">
      
      {/* --- HEADER --- */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">สรุปผลการตรวจ</h1>
        <span className="date-display">
          🗓 {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
        </span>
      </div>

      {/* --- FILTER (เลือกวันที่) --- */}
      <div className="filter-container">
        <div className="filter-label">เลือกช่วงเวลา</div>
        <div className="date-inputs">
          <input type="date" className="custom-date-input" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="date-arrow">➜</span>
          <input type="date" className="custom-date-input" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

       {/* --- Quick Search: ค้นหา HN เพื่อแก้ไขตรงนี้เลย --- */}
       <div className="quick-search">
         <form className="quick-search-form" onSubmit={handleQuickSearch}>
           <input
             type="text"
             className="quick-input"
             placeholder="ค้นหา HN เพื่อแก้ไข (เช่น 12345)"
             value={quickHn}
             onChange={(e) => setQuickHn(e.target.value)}
           />
           <button className="quick-btn" disabled={quickLoading}>{quickLoading ? 'กำลังค้นหา...' : 'ค้นหา'}</button>
           <Link to="/search" className="quick-advanced">ค้นหาขั้นสูง</Link>
         </form>

         {quickError && <div className="quick-error">{quickError}</div>}

         {quickResults.length > 0 && (
           <div className="quick-results">
             {quickResults.map(item => (
               <div className="quick-item" key={item.id}>
                 <div className="qi-left">
                   <div className="qi-hn">HN: <strong>{item.hn}</strong></div>
                   <div className="qi-date">{formatDateDisplay(item.exam_date)}</div>
                 </div>
                 <div className="qi-right">
                   <span className={`status-pill ${item.left_ear_result === 'PASS' ? 'pass' : 'fail'}`}>{item.left_ear_result}</span>
                   <span className={`status-pill ${item.right_ear_result === 'PASS' ? 'pass' : 'fail'}`} style={{marginLeft:8}}>{item.right_ear_result}</span>
                   <Link to={`/edit-exam/${item.id}`} className="btn-edit-link" style={{marginLeft:12}}>✏️ แก้ไข</Link>
                  {isAdmin && (
                    <button className="btn-delete-link" style={{marginLeft:8}} onClick={() => handleDeleteExam(item.id)}>🗑️ ลบ</button>
                  )}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-title">ตรวจทั้งหมด</div>
          <div className="stat-value">{stats.summary.total}</div>
          <div className="stat-title">ราย</div>
        </div>
        <div className="stat-card pass">
          <div className="stat-title">ผ่าน (Pass)</div>
          <div className="stat-value">{stats.summary.pass}</div>
          <div className="stat-percent">{stats.summary.total > 0 ? ((stats.summary.pass/stats.summary.total)*100).toFixed(1) : 0}%</div>
        </div>
        <div className="stat-card fail">
          <div className="stat-title">ไม่ผ่าน (Fail)</div>
          <div className="stat-value">{stats.summary.fail}</div>
          <div className="stat-percent">{stats.summary.total > 0 ? ((stats.summary.fail/stats.summary.total)*100).toFixed(1) : 0}%</div>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div className="charts-grid">
        <div className="chart-box">
          <div className="chart-title">🍩 สัดส่วนผลการตรวจ</div>
          <div className="chart-container">
             {stats.summary.total === 0 ? <p style={{marginTop: '100px', color:'#ccc'}}>ไม่มีข้อมูล</p> : <Pie data={overviewPieData} options={chartOptions} />}
          </div>
        </div>
        <div className="chart-box">
          <div className="chart-title">📊 แยกตามข้าง (ซ้าย/ขวา)</div>
          <div className="chart-container">
            <Bar data={earBarData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* --- RECENT ACTIVITY (Mobile: List Card, Desktop: Table) --- */}
      <div className="recent-activity-container">
        <div className="section-title">🕒 รายการตรวจล่าสุด</div>
        
        {/* Desktop Table */}
        <table className="desktop-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>HN</th>
              <th>หูซ้าย</th>
              <th>หูขวา</th>
              <th>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentActivity.map((item) => (
              <tr key={item.id}>
                <td>{formatDateDisplay(item.exam_date)}</td>
                <td style={{fontWeight:'bold'}}>{item.hn}</td>
                <td><span className={`status-pill ${item.left_ear_result === 'PASS' ? 'pass' : 'fail'}`}>{item.left_ear_result}</span></td>
                <td><span className={`status-pill ${item.right_ear_result === 'PASS' ? 'pass' : 'fail'}`}>{item.right_ear_result}</span></td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/edit-exam/${item.id}`} className="btn-edit-link">✏️ แก้ไข</Link>
                    {isAdmin && (
                      <button className="btn-delete-link" onClick={() => handleDeleteExam(item.id)}>
                        🗑️ ลบ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
             {stats.recentActivity.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>ไม่มีข้อมูล</td></tr>}
          </tbody>
        </table>

        {/* Mobile List Cards (นี่คือส่วนที่ทำให้มือถือดูสวย) */}
        <div className="mobile-list">
          {stats.recentActivity.map((item) => (
            <div className="list-card" key={item.id}>
              <div className="list-info">
                <span className="list-date">{formatDateDisplay(item.exam_date)}</span>
                <span className="list-hn">HN: {item.hn}</span>
              </div>
              <div className="list-results">
                 <div className={`mini-badge ${item.left_ear_result === 'PASS' ? 'pass' : 'fail'}`}>L</div>
                 <div className={`mini-badge ${item.right_ear_result === 'PASS' ? 'pass' : 'fail'}`}>R</div>
                 <Link to={`/edit-exam/${item.id}`} className="btn-edit-mobile">✏️</Link>
                {isAdmin && (
                  <button className="btn-delete-mobile" onClick={() => handleDeleteExam(item.id)} style={{marginLeft:8}}>🗑️</button>
                )}
              </div>
            </div>
          ))}
          {stats.recentActivity.length === 0 && <p style={{textAlign:'center', color:'#ccc'}}>ไม่มีข้อมูล</p>}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;