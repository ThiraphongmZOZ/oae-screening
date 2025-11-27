import React, { useState } from 'react';
import './ExportModal.css';

function ExportModal({ onClose }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ตั้งค่าเริ่มต้น: วันแรกของเดือน - วันปัจจุบัน
  React.useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatDate = (d) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  }, []);

  const handleExport = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';

      const res = await fetch(
        `${apiUrl}/api/export-csv?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('สิทธิ์ไม่พอ กรุณาเข้าสู่ระบบใหม่');
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

      onClose();
      alert('ดาวน์โหลดสำเร็จ!');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดาวน์โหลดได้ ลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📥 Export ข้อมูล</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleExport}>
          <div className="form-group">
            <label>วันที่เริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>วันที่สิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="form-input"
              disabled={loading}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-export" disabled={loading}>
              {loading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportModal;