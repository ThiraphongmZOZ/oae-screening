import React from 'react';
import './NotificationModal.css'; // นำเข้า CSS ที่เราเขียน

const NotificationModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null; // ถ้าไม่เปิด ก็ไม่ต้องแสดงอะไร

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        
        {/* ส่วนไอคอนกระดิ่งด้านบน */}
        <div className="icon-container">
          <span className="bell-icon">🔔</span> {/* หรือจะใช้รูปภาพ <img> ก็ได้ */}
          <span className="notification-badge"></span>
        </div>

        {/* เนื้อหา */}
        <h2 className="modal-title">{title || "Notification"}</h2>
        <p className="modal-message">{message}</p>

        {/* ปุ่มกด */}
        <button className="modal-button" onClick={onClose}>
          ตกลง
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;