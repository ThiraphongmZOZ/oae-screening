import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // สร้าง State สำหรับเก็บค่าเดือนที่เลือก (Format: YYYY-MM)
  // Default เป็นเดือนปัจจุบัน
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));

  // ฟังก์ชันดึงข้อมูล (เรียกใหม่ทุกครั้งที่ filterDate เปลี่ยน)
  useEffect(() => {
    setLoading(true);
    
    // แยกปีและเดือนจาก string "2025-11"
    let url = 'http://localhost:3001/api/dashboard-stats';
    if (filterDate) {
      const [year, month] = filterDate.split('-');
      url += `?month=${month}&year=${year}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, [filterDate]); // <-- ใส่ filterDate ใน dependency array

  if (loading) return <div className="dashboard-container loading">กำลังโหลดข้อมูล...</div>;
  if (!stats) return <div className="dashboard-container error">ไม่สามารถดึงข้อมูลได้</div>;

  // --- กราฟ Pie ---
  const overviewPieData = {
    labels: ['ผ่านทั้ง 2 หู (Pass Both)', 'ต้องส่งต่อ (Refer/Fail)'],
    datasets: [
      {
        data: [stats.summary.pass, stats.summary.fail],
        backgroundColor: ['#A5D6A7', '#EF9A9A'],
        borderColor: ['#81C784', '#E57373'],
        borderWidth: 1,
      },
    ],
  };

  // --- กราฟ Bar ---
  const earBarData = {
    labels: ['หูซ้าย (Left)', 'หูขวา (Right)'],
    datasets: [
      {
        label: 'ผ่าน (Pass)',
        data: [stats.earStats.left.pass, stats.earStats.right.pass],
        backgroundColor: '#A5D6A7',
      },
      {
        label: 'ไม่ผ่าน (Fail)',
        data: [stats.earStats.left.fail, stats.earStats.right.fail],
        backgroundColor: '#EF9A9A',
      },
    ],
  };
  
  const barOptions = {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
  };

  return (
    <div className="dashboard-container">
      
      {/* --- Header พร้อมตัวเลือกเดือน --- */}
      <div className="dashboard-header-group">
        <h2 className="dashboard-title">📊 สรุปผลการตรวจ (Dashboard)</h2>
        
        <div className="filter-wrapper">
          <label>เลือกเดือน:</label>
          <input 
            type="month" 
            className="month-filter"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {/* --- ส่วนที่ 1: Summary Cards --- */}
      <div className="summary-cards">
        <div className="card total">
          <h3>ตรวจทั้งหมด</h3>
          <p className="number">{stats.summary.total}</p>
          <span>ราย</span>
        </div>
        <div className="card pass">
          <h3>ผ่าน 2 หู ✅</h3>
          <p className="number">{stats.summary.pass}</p>
          <span>ราย ({stats.summary.total > 0 ? ((stats.summary.pass / stats.summary.total) * 100).toFixed(1) : 0}%)</span>
        </div>
        <div className="card fail">
          <h3>ต้องส่งต่อ ❌</h3>
          <p className="number">{stats.summary.fail}</p>
          <span>ราย ({stats.summary.total > 0 ? ((stats.summary.fail / stats.summary.total) * 100).toFixed(1) : 0}%)</span>
        </div>
      </div>

      {/* --- ส่วนที่ 2: Charts --- */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>ภาพรวมผลการตรวจ</h3>
           {/* ถ้าไม่มีข้อมูลเลย ให้แสดงข้อความแทนกราฟวงกลมโล่งๆ */}
           {stats.summary.total === 0 ? (
              <p className="no-data-text">ไม่มีข้อมูลในเดือนนี้</p>
           ) : (
              <div className="chart-wrapper pie-wrapper">
                <Pie data={overviewPieData} />
              </div>
           )}
        </div>
        <div className="chart-card">
          <h3>เปรียบเทียบ หูซ้าย vs หูขวา</h3>
          <div className="chart-wrapper">
            <Bar options={barOptions} data={earBarData} />
          </div>
        </div>
      </div>

       {/* --- ส่วนที่ 3: Recent Table --- */}
       <div className="recent-section">
          <h3>🕒 รายการตรวจล่าสุด (ของเดือนที่เลือก)</h3>
          <div className="table-container">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>วันที่ตรวจ</th>
                  <th>HN</th>
                  <th>หูซ้าย</th>
                  <th>หูขวา</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.exam_date).toLocaleDateString('th-TH')}</td>
                    <td>{item.hn}</td>
                    <td>
                      <span className={`badge ${item.left_ear_result === 'PASS' ? 'pass' : 'fail'}`}>
                        {item.left_ear_result}
                      </span>
                    </td>
                     <td>
                      <span className={`badge ${item.right_ear_result === 'PASS' ? 'pass' : 'fail'}`}>
                        {item.right_ear_result}
                      </span>
                    </td>
                  </tr>
                ))}
                 {stats.recentActivity.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#ccc'}}>ไม่มีข้อมูลการตรวจในเดือนนี้</td></tr>
                 )}
              </tbody>
            </table>
          </div>
       </div>

    </div>
  );
}

export default Dashboard;