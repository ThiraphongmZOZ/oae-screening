import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    // refresh state in other components will read from localStorage
    window.dispatchEvent(new Event('storage'));
  };

  // Export CSV: ต้องมี token และ role=admin
  const handleExport = async () => {
    const token = localStorage.getItem('token');
    if (!token || !isAdmin) {
      // ถ้ายังไม่ได้ล็อกอินเป็น admin ให้ไปหน้า login
      navigate('/login');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const today = new Date().toISOString().split('T')[0];
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const res = await fetch(`${apiUrl}/api/export-csv?startDate=${firstDay}&endDate=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert('สิทธิ์ไม่พอ กรุณาเข้าสู่ระบบด้วยบัญชี Admin');
          navigate('/login');
          return;
        }
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eare-data.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถดาวน์โหลดได้ ลองอีกครั้ง');
    }
  };

  return (
    <nav className="navbar">
      {/* --- ส่วนโลโก้และชื่อ (จากอันเก่า) --- */}
      <div className="nav-brand">
        <div className="nav-logo-icon">
          🦻
        </div>
        <div className="nav-text">
          <span className="nav-title-main">OAE Screening</span>
          <span className="nav-title-sub1">Sick Newborn SKH</span>
        </div>
      </div>

      <ul className="nav-menu">
        <li>
          <Link to="/form" className={`nav-item ${location.pathname === '/form' || location.pathname === '/' ? 'active' : ''}`}>
            <div className="nav-item-icon">📝</div>
            <div className="nav-item-text">บันทึก</div>
          </Link>
        </li>

        <li>
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <div className="nav-item-icon">📊</div>
            <div className="nav-item-text">สรุปผล</div>
          </Link>
        </li>

        <li>
          <Link to="/search" className={`nav-item ${location.pathname === '/search' ? 'active' : ''}`}>
            <div className="nav-item-icon">🔍</div>
            <div className="nav-item-text">ค้นหา</div>
          </Link>
        </li>

        {/* ถ้ายังไม่ได้ล็อกอิน ให้แสดงปุ่ม Admin → ไปหน้า Login */}
        {!user && (
          <li>
            <Link to="/login" className="nav-item">
              <div className="nav-item-icon">🔑</div>
              <div className="nav-item-text">Admin</div>
            </Link>
          </li>
        )}

        {/* ถ้าเป็น admin ให้แสดงปุ่ม Export */}
        {isAdmin && (
          <li>
            <button className="nav-item export-btn" onClick={handleExport} title="Export ข้อมูล CSV">
              <div className="nav-item-icon">📥</div>
              <div className="nav-item-text">Export</div>
            </button>
          </li>
        )}

        <li>
          <div className="navbar-user">
            {user ? (
              <>
              {/* 
                <span className="user-name">{user.username}</span>
                <span className={`user-badge ${isAdmin ? 'admin' : 'user'}`}>{isAdmin ? 'ADMIN' : 'USER'}</span>
                */} 
                <button className="logout-btn" onClick={handleLogout}>ออก</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="user-badge user">Guest</span>
              
              </div>
            )}
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;