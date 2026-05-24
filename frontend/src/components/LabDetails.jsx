import React from 'react';

export default function LabDetails({ lab, onClose, onStart, onOpenTerminal }) {
  if (!lab) return null;
  return (
    <div style={styles.overlay}>
      <div className="container py-3" style={{ maxWidth: 1200 }}>
        <div className="mb-3 d-flex align-items-center">
          <button className="btn btn-outline-light btn-sm me-3" onClick={onClose}>
            <i className="bi bi-arrow-left"></i> Back to Labs
          </button>
          <h4 className="text-white mb-0">{lab.name}</h4>
          <span className="badge bg-success ms-3 text-capitalize">{lab.difficulty}</span>
          <span className="badge bg-secondary ms-2">{lab.category}</span>
        </div>

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card bg-dark text-white mb-3">
              <div className="card-header">Overview</div>
              <div className="card-body">
                <p className="mb-0 text-white-50">{lab.description}</p>
              </div>
            </div>

            <div className="card bg-dark text-white mb-3">
              <div className="card-header">Lab Objectives</div>
              <div className="card-body">
                <ul className="mb-0">
                  <li>Identify common vulnerabilities</li>
                  <li>Practice exploitation techniques</li>
                  <li>Understand mitigations and secure design</li>
                </ul>
              </div>
            </div>

            <div className="card bg-dark text-white">
              <div className="card-header">Learning Outcomes</div>
              <div className="card-body">
                <ul className="mb-0">
                  <li>Hands-on practice in a safe environment</li>
                  <li>Methodology and reporting discipline</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card bg-dark text-white mb-3">
              <div className="card-header">Lab Statistics</div>
              <div className="card-body">
                <div className="d-flex justify-content-between"><span>Points</span><strong>100</strong></div>
                <div className="d-flex justify-content-between"><span>Est. Time</span><strong>30 minutes</strong></div>
                <div className="d-flex justify-content-between"><span>Completed</span><strong>—</strong></div>
              </div>
            </div>

            <div className="card bg-dark text-white mb-3">
              <div className="card-header">Your Progress</div>
              <div className="card-body">
                <small className="text-white-50 d-block mb-2">Completion</small>
                <div className="progress" style={{ height: 6 }}>
                  <div className="progress-bar" role="progressbar" style={{ width: lab.userProgress?.status === 'completed' ? '100%' : '0%' }}></div>
                </div>
              </div>
            </div>

            <div className="card bg-dark text-white">
              <div className="card-header">Quick Actions</div>
              <div className="card-body d-grid gap-2">
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onStart?.(); }}>
                  <i className="bi bi-play-circle me-2"></i>Start Lab
                </button>
                <button className="btn btn-outline-light" onClick={(e) => { e.stopPropagation(); onOpenTerminal?.(); }}>
                  <i className="bi bi-terminal me-2"></i>Open Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1050,
    background: '#0b0f16', overflowY: 'auto'
  }
};



