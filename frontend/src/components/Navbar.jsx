import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{backgroundColor:'transparent'}}> 
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center brand-animated" to="/">
          <span className="brand-badge me-2">
            <i className="bi bi-shield-lock-fill"></i>
          </span>
          EduSec Labs
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                <li className="nav-item"><Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">Dashboard</Link></li>
                <li className="nav-item"><Link className={`nav-link ${isActive('/labs')}`} to="/labs">Labs</Link></li>
                <li className="nav-item"><Link className={`nav-link ${isActive('/kali-vm')}`} to="/kali-vm">Kali VM</Link></li>
                <li className="nav-item"><Link className={`nav-link ${isActive('/ai-assistant')}`} to="/ai-assistant">AI Tutor</Link></li>
              </>
            )}
          </ul>

          <ul className="navbar-nav align-items-lg-center">
            {user ? (
              <>
                <li className="nav-item me-lg-2">
                  <span className="navbar-text small text-white-50 me-2" style={{color:'#f5f7fb'}}>
                    <i className="bi bi-person-circle me-1"></i>{user.username}
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm" style={{background:'transparent', color:'#f5f7fb', border:'1px solid rgba(255,255,255,0.16)'}} onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="btn btn-primary btn-sm" to="/register">Get Started</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

