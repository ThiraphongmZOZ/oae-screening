import React, { useState } from 'react';
import './App.css'; 
import Dashboard from './Dashboard'; // <--- 1. นำเข้าไฟล์ Dashboard

function App() {
  // สร้างตัวแปรเก็บว่าตอนนี้อยู่หน้าไหน ('form' หรือ 'dashboard')
  const [currentPage, setCurrentPage] = useState('form');

  // --- State ของฟอร์ม (เหมือนเดิม) ---
  const [formData, setFormData] = useState({
    hn: '',
    birthDate: '',
    examDate: new Date().toISOString().split('T')[0], 
    leftResult: null, 
    rightResult: null 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectResult = (side, result) => {
    setFormData({ ...formData, [side]: result });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hn || !formData.birthDate || !formData.leftResult || !formData.rightResult) {
      alert("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่องครับ");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL; 
      const response = await fetch(`${apiUrl}/api/save-screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.success) {
        alert("🎉 บันทึกข้อมูลเรียบร้อย!");
        setFormData({ ...formData, hn: '', leftResult: null, rightResult: null });
      } else {
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เชื่อมต่อ Server ไม่ได้");
    }
  };

  return (
    <>
      {/* --- Navbar (เพิ่มปุ่มเมนู) --- */}
      <nav className="navbar">
        <div className="nav-content">
          <span style={{ marginRight: '20px' }}>🎧 OAE System</span>
          
          {/* ปุ่มสลับหน้า */}
          <div className="nav-menu">
            <button 
              className={`nav-btn ${currentPage === 'form' ? 'active' : ''}`}
              onClick={() => setCurrentPage('form')}
            >
              📝 บันทึกผล
            </button>
            <button 
              className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              📊 ดูสถิติ
            </button>
          </div>
        </div>
      </nav>

      {/* --- ส่วนเนื้อหา (เปลี่ยนไปตาม currentPage) --- */}
      
      {currentPage === 'form' ? (
        // ---------------- กรณีเป็นหน้า Form ----------------
        <div className="container">
          <form onSubmit={handleSubmit} className="form-card">
            <div className="form-header">
              <h2>บันทึกผลตรวจ</h2>
              <p>กรอกข้อมูลผู้ป่วยและผลการตรวจการได้ยิน</p>
            </div>

            {/* Input: HN */}
            <div className="input-group">
              <label className="label-text">รหัส HN (Patient ID)</label>
              <input 
                type="text" 
                name="hn" 
                value={formData.hn} 
                onChange={handleChange} 
                placeholder="เช่น 66xxxxx" 
                autoComplete="off"
              />
            </div>

            {/* Input: วันเกิด & วันตรวจ */}
            <div className="date-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="label-text">วันเกิด</label>
                <input 
                  type="date" 
                  name="birthDate" 
                  value={formData.birthDate} 
                  onChange={handleChange} 
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="label-text">วันที่ตรวจ</label>
                <input 
                  type="date" 
                  name="examDate" 
                  value={formData.examDate} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* Ear Selection */}
            <label className="label-text" style={{ marginTop: '10px' }}>ผลการตรวจ (Result)</label>
            <div className="ear-section">
              {/* หูซ้าย */}
              <div className="ear-box">
                <h4>หูซ้าย (Left)</h4>
                <div className="btn-options">
                  <button 
                    type="button"
                    className={`option-btn pass ${formData.leftResult === 'PASS' ? 'active' : ''}`}
                    onClick={() => handleSelectResult('leftResult', 'PASS')}
                  >
                    {formData.leftResult === 'PASS' ? '✅' : '⚪'} ผ่าน (Pass)
                  </button>
                  <button 
                    type="button"
                    className={`option-btn fail ${formData.leftResult === 'FAIL' ? 'active' : ''}`}
                    onClick={() => handleSelectResult('leftResult', 'FAIL')}
                  >
                    {formData.leftResult === 'FAIL' ? '❌' : '⚪'} ไม่ผ่าน (Fail)
                  </button>
                </div>
              </div>

              {/* หูขวา */}
              <div className="ear-box">
                <h4>หูขวา (Right)</h4>
                <div className="btn-options">
                  <button 
                    type="button"
                    className={`option-btn pass ${formData.rightResult === 'PASS' ? 'active' : ''}`}
                    onClick={() => handleSelectResult('rightResult', 'PASS')}
                  >
                     {formData.rightResult === 'PASS' ? '✅' : '⚪'} ผ่าน (Pass)
                  </button>
                  <button 
                    type="button"
                    className={`option-btn fail ${formData.rightResult === 'FAIL' ? 'active' : ''}`}
                    onClick={() => handleSelectResult('rightResult', 'FAIL')}
                  >
                     {formData.rightResult === 'FAIL' ? '❌' : '⚪'} ไม่ผ่าน (Fail)
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              บันทึกข้อมูล
            </button>
          </form>
        </div>
      ) : (
        // ---------------- กรณีเป็นหน้า Dashboard ----------------
        // เรียกใช้ Component ที่คุณแยกไฟล์ไว้
        <Dashboard />
      )}
    </>
  );
}

export default App;