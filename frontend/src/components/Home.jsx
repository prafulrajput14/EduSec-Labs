import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <section className={`hero-section ${mounted ? 'mounted' : ''}`}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge bg-light text-dark mb-2">Welcome to</span>
              <h1 className="display-5 fw-bold mb-2">EduSec Labs</h1>
              <p className="lead mb-4">Learn cybersecurity by doing. Your personal, persistent Kali machine and on‑demand target labs with AI guidance—all in your browser.</p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/login" className="btn btn-light btn-lg cta-raise">Start Hacking</Link>
                <Link to="/register" className="btn btn-outline-light btn-lg cta-ghost">Create Free Account</Link>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0 d-flex justify-content-center align-items-center">
              <div className="hero-illustration me-3">
                <div className="term-top">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="term-body p-3">
                  <pre className="m-0">$ ssh kali@localhost -p 2222
Welcome to EduSec Labs
root@kali:~# nmap -sS 10.0.0.5
Starting Nmap 7.80 ( https://nmap.org )</pre>
                </div>
              </div>

              {/* removed right-side info card per user request */}
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-4 mt-md-5">
        <div className="row g-4">
          {[{
            title: 'Your Kali, Always On', icon: '💻', text: 'Persistent storage and snapshots keep your tools and notes forever.'
          },{
            title: 'Launch Labs Instantly', icon: '🚀', text: 'Spin up vulnerable targets with isolated networks in seconds.'
          },{
            title: 'Learn Faster with AI', icon: '🤖', text: 'Ask for hints, fix tool syntax, and debug errors without spoilers.'
          }].map((c, i) => (
            <div className="col-md-4" key={i}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="display-6 mb-2">{c.icon}</div>
                  <h5 className="card-title">{c.title}</h5>
                  <p className="text-muted mb-0">{c.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


