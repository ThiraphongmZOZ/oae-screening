import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import FormPage from './components/FormPage';
import Dashboard from './components/Dashboard';
import EditExam from './components/EditExam';
import SearchExam from './components/SearchExam';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    setLoading(false);

    // optional: listen storage changes (logout/login in another tab)
    const onStorage = () => {
      const u = localStorage.getItem('user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Loading...</div>;

  return (
    <Router>
      {/* Navbar แสดงตลอด (แม้ยังไม่ได้ล็อกอิน) */}
      <Navbar user={user} />

      {/* เนื่องจาก navbar เป็น fixed ให้เว้นพื้นที่ด้านบนตลอด */}
      <main style={{ paddingTop: '40 px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<FormPage />} />
          <Route path="/form" element={<FormPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<SearchExam />} />
          <Route path="/edit-exam/:id" element={<EditExam />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;