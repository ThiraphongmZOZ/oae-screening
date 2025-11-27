import React, { useState } from 'react';
import "./FormPage.css";
import Popup from './Popup'; // 1. Import ไฟล์ใหม่เข้ามา

function FormPage() {
  const [formData, setFormData] = useState({
    hn: '',
    birthDate: '',
    examDate: new Date().toISOString().split('T')[0],
    leftResult: null,
    rightResult: null
  });

  // 2. State สำหรับควบคุม Popup
  const [popup, setPopup] = useState({
    show: false,
    type: 'success', // 'success' หรือ 'error'
    message: ''
  });

  // ฟังก์ชันช่วยเรียก Popup
  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
  };

  const closePopup = () => {
    setPopup({ ...popup, show: false });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectResult = (side, result) => {
    setFormData({ ...formData, [side]: result });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // เช็คข้อมูลว่าง
    if (!formData.hn || !formData.birthDate || !formData.leftResult || !formData.rightResult) {
      showPopup('error', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
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
        showPopup('success', 'บันทึกข้อมูลเรียบร้อยแล้ว');
        setFormData({ ...formData, hn: '', birthDate: '', leftResult: null, rightResult: null });
      } else {
        // ===============================================
        // 🔴 แก้ไขตรงนี้: ดักจับ Error Message แปลงเป็นไทย
        // ===============================================
        
        let message = data.error || 'เกิดข้อผิดพลาดในการบันทึก';

        // เช็คว่า error มีคำว่า "duplicate key" หรือไม่ (แปลว่า HN ซ้ำ)
        if (message.includes("duplicate key") || message.includes("unique constraint")) {
          message = "⚠️ รหัส HN นี้ถูกบันทึกไปแล้ว กรุณาตรวจสอบ";
        }

        showPopup('error', message);
      }

    } catch (error) {
      console.error("Error:", error);
      showPopup('error', 'ไม่สามารถเชื่อมต่อ Server ได้');
    }
  };

  return (
    <>
      <div className="container">
        <div className="form-container" style={{ paddingTop: '20px' }}>
          <form onSubmit={handleSubmit} className="form-card">
             {/* ... (ส่วน Input Form เหมือนเดิม ไม่ต้องแก้) ... */}
             
             <div className="form-header">
              <h2>บันทึกผลตรวจ</h2>
            </div>

            <div className="input-group">
              <label className="label-text">รหัส HN</label>
              <input type="text" name="hn" value={formData.hn} onChange={handleChange} placeholder="เช่น 66xxxxx" autoComplete="off" />
            </div>

            <div className="date-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="label-text">วันเกิด</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="label-text">วันที่ตรวจ</label>
                <input type="date" name="examDate" value={formData.examDate} onChange={handleChange} />
              </div>
            </div>

            <label className="label-text" style={{ marginTop: '10px' }}>ผลการตรวจ (Result)</label>
            <div className="ear-section">
               {/* ... ส่วนหัวข้อ ... */}
            
            <div className="result-section">
              <div className="result-grid">
                
                {/* --- หูซ้าย --- */}
                <div className="ear-row">
                  <div className="ear-label">
                    <span className="ear-icon">L</span> หูซ้าย (Left)
                  </div>
                  <div className="choice-group">
                    <button 
                      type="button" 
                      className={`choice-btn pass ${formData.leftResult === 'PASS' ? 'active' : ''}`} 
                      onClick={() => handleSelectResult('leftResult', 'PASS')}
                    >
                      <span className="btn-icon">✔</span> ผ่าน
                    </button>
                    <button 
                      type="button" 
                      className={`choice-btn fail ${formData.leftResult === 'FAIL' ? 'active' : ''}`} 
                      onClick={() => handleSelectResult('leftResult', 'FAIL')}
                    >
                      <span className="btn-icon">✕</span> ไม่ผ่าน
                    </button>
                  </div>
                </div>

                {/* --- หูขวา --- */}
                <div className="ear-row">
                  <div className="ear-label">
                    <span className="ear-icon">R</span> หูขวา (Right)
                  </div>
                  <div className="choice-group">
                    <button 
                      type="button" 
                      className={`choice-btn pass ${formData.rightResult === 'PASS' ? 'active' : ''}`} 
                      onClick={() => handleSelectResult('rightResult', 'PASS')}
                    >
                      <span className="btn-icon">✔</span> ผ่าน
                    </button>
                    <button 
                      type="button" 
                      className={`choice-btn fail ${formData.rightResult === 'FAIL' ? 'active' : ''}`} 
                      onClick={() => handleSelectResult('rightResult', 'FAIL')}
                    >
                      <span className="btn-icon">✕</span> ไม่ผ่าน
                    </button>
                  </div>
                </div>

              </div>
            </div>
            </div>

            <button type="submit" className="submit-btn">บันทึกข้อมูล</button>
          </form>
        </div>

        {/* --- 3. วาง Popup Component ไว้ล่างสุด --- */}
        <Popup 
          isOpen={popup.show} 
          onClose={closePopup} 
          type={popup.type} 
          message={popup.message} 
        />
      </div>
    </>
  );
}

export default FormPage;