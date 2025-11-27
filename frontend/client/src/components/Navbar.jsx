import React, { useState } from 'react';
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
    window.dispatchEvent(new Event('storage'));
  };

  // Export: ถ้ายังไม่ได้ล็อกอิน ให้ไปหน้า login ก่อน
  const handleExport = () => {
    const token = localStorage.getItem('token');
    if (!token || !isAdmin) {
      navigate('/login');
      return;
    }
    // ส่ง event ให้ Dashboard export
    window.dispatchEvent(new CustomEvent('export-requested'));
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-icon">🦻</div>
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

        {!user && (
          <li>
            <Link to="/login" className="nav-item">
              <div className="nav-item-icon">🔑</div>
              <div className="nav-item-text">Admin</div>
            </Link>
          </li>
        )}

        {isAdmin && (
          <li>
            <button 
              className="nav-item export-btn" 
              onClick={handleExport} 
              title="Export ข้อมูล CSV จากช่วงเวลาที่เลือกใน Dashboard"
            >
              <div className="nav-item-icon">📥</div>
              <div className="nav-item-text">Export</div>
            </button>
          </li>
        )}

        <li>
          <div className="navbar-user">
            {user ? (
              <>
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