import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-5 pt-4 border-top" style={{background:'#0f1115'}}>
      <div className="container">
        <div className="row gy-4 align-items-center">
          <div className="col-md-4 text-white-50">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-shield-lock-fill text-primary me-2"></i>
              <strong className="text-white">EduSec Labs</strong>
            </div>
            <small>Practice cybersecurity safely in your browser.</small>
          </div>
          <div className="col-md-4">
            <ul className="nav justify-content-md-center">
              <li className="nav-item"><Link className="nav-link px-2 text-white-50" to="/labs">Labs</Link></li>
              <li className="nav-item"><Link className="nav-link px-2 text-white-50" to="/ai-assistant">AI Tutor</Link></li>
              <li className="nav-item"><Link className="nav-link px-2 text-white-50" to="/kali-vm">Kali VM</Link></li>
            </ul>
          </div>
          <div className="col-md-4 text-md-end">
            <a className="text-white-50 me-3" href="#" aria-label="twitter"><i className="bi bi-twitter-x"></i></a>
            <a className="text-white-50 me-3" href="#" aria-label="github"><i className="bi bi-github"></i></a>
            <a className="text-white-50" href="#" aria-label="discord"><i className="bi bi-discord"></i></a>
          </div>
        </div>
        <div className="text-center text-white-50 small mt-3 pb-3">© {new Date().getFullYear()} EduSec Labs</div>
      </div>
    </footer>
  );
}

