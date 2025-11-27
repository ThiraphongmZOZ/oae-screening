import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SearchExam.css';

function SearchExam() {
  const [hn, setHn] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    if (!hn.trim()) {
      setError('กรุณากรอก HN');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/exams-by-hn/${encodeURIComponent(hn.trim())}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <h2>ค้นหาการตรวจจาก HN</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="ใส่ HN (ตัวอย่าง: 12345 หรือ ส่วนของ HN)"
          value={hn}
          onChange={(e) => setHn(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      <div className="search-results">
        {results.length === 0 && !loading && <div className="no-results">ไม่พบผลลัพธ์</div>}
        {results.map(item => (
          <div className="result-card" key={item.id}>
            <div className="result-info">
              <div className="r-hn">HN: <strong>{item.hn}</strong></div>
              <div className="r-date">วันที่: {new Date(item.exam_date).toLocaleDateString()}</div>
              <div className="r-results">
                <span className={`pill ${item.left_ear_result === 'PASS' ? 'pass' : 'fail'}`}>L: {item.left_ear_result}</span>
                <span className={`pill ${item.right_ear_result === 'PASS' ? 'pass' : 'fail'}`}>R: {item.right_ear_result}</span>
              </div>
            </div>
            <div className="result-actions">
              <Link to={`/edit-exam/${item.id}`} className="edit-link">✏️ แก้ไข</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchExam;