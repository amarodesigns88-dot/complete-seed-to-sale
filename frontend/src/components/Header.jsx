import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="container">
        <h1>🌱 Seed to Sale - Cannabis Tracking System</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <nav className="nav">
            <Link to="/">Dashboard</Link>
            <Link to="/plants">Plants</Link>
            <Link to="/sales">Sales & POS</Link>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '14px' }}>{user.email}</span>
            <button 
              onClick={handleLogout}
              className="button button-danger"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
