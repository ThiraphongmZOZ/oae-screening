import React, { useEffect } from 'react';
import './Popup.css';

const Popup = ({ isOpen, onClose, type, message }) => {
  if (!isOpen) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // 2 วินาทีปิดเอง
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  const isSuccess = type === 'success';
  const containerClass = isSuccess ? 'popup-success' : 'popup-error';
  
  // เลือกเครื่องหมายถูก (✔) หรือตกใจ (!)
  const iconSymbol = isSuccess ? '✔' : '!'; 

  return (
    <div className={`popup-container ${containerClass}`}>
      {/* ไอคอนวงกลม */}
      <div className="popup-icon-circle">
        {iconSymbol}
      </div>

      {/* ข้อความ */}
      <span className="popup-message">{message}</span>

      {/* เส้นคั่น */}
      <div className="popup-divider"></div>

      {/* ปุ่มปิด */}
      <button className="popup-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default Popup;