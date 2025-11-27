import React, { useEffect } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;

  // ตั้งเวลาให้ปิดตัวเองอัตโนมัติหลังจาก 3 วินาที (ถ้าต้องการ)
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); 
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  // เลือกไอคอนตามประเภท
  const icon = type === 'success' ? '✅' : '⚠️'; // หรือจะใช้ <SVG> สวยๆ ก็ได้
  const containerClass = type === 'success' ? 'toast-success' : 'toast-error';

  return (
    <div className={`toast-container ${containerClass}`}>
      <div className="toast-icon">
        {icon}
      </div>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default ToastNotification;