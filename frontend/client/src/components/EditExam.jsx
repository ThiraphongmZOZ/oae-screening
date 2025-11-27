import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditExam.css';

function EditExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ดึงข้อมูลการตรวจ
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/api/exams/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExam(data.data);
        } else {
          setError('ไม่พบข้อมูล');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('เกิดข้อผิดพลาด');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const apiUrl = import.meta.env.VITE_API_URL;
    try {
      const response = await fetch(`${apiUrl}/api/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exam)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('บันทึกข้อมูลสำเร็จ!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.message || 'ไม่สามารถบันทึกได้');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('เกิดข้อผิดพลาด');
    }
  };

  if (loading) return (
    <div className="edit-container">
      <div className="loading-state">⏳ กำลังโหลดข้อมูล...</div>
    </div>
  );

  if (!exam) return (
    <div className="edit-container">
      <div className="error-state">ไม่พบข้อมูล</div>
    </div>
  );

  return (
    <div className="edit-container">
      <div className="edit-card">
        <div className="edit-header">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>← ย้อนกลับ</button>
          <h1>แก้ไขข้อมูลการตรวจ</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>HN (เลขประจำตัวผู้ป่วย)</label>
            <input
              type="text"
              name="hn"
              value={exam.hn || ''}
              onChange={handleChange}
              disabled
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>วันที่ตรวจ</label>
            <input
              type="date"
              name="exam_date"
              value={exam.exam_date || ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>หูซ้าย (Left Ear)</label>
              <select
                name="left_ear_result"
                value={exam.left_ear_result || ''}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">-- เลือก --</option>
                <option value="PASS">✓ PASS</option>
                <option value="FAIL">✗ FAIL</option>
              </select>
            </div>

            <div className="form-group">
              <label>หูขวา (Right Ear)</label>
              <select
                name="right_ear_result"
                value={exam.right_ear_result || ''}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">-- เลือก --</option>
                <option value="PASS">✓ PASS</option>
                <option value="FAIL">✗ FAIL</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExam;