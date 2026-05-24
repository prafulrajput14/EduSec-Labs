import React, { useEffect } from 'react';

export default function LabViewer({ url, onClose, title }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!url) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.chrome} className="d-flex align-items-center justify-content-between px-3 py-2">
        <div className="text-truncate">
          <strong>{title || 'Lab'}</strong>
          <span className="text-white-50 ms-2 small">{url}</span>
        </div>
        <div>
          <button className="btn btn-light btn-sm me-2" onClick={() => window.open(url, '_blank', 'noopener')}>Open in new tab</button>
          <button className="btn btn-outline-light btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <iframe title="Lab" src={url} style={styles.iframe} />
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1050,
    background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(4px)',
    display: 'flex', flexDirection: 'column'
  },
  chrome: {
    color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(180deg, rgba(16,18,26,0.95), rgba(14,16,22,0.92))'
  },
  iframe: {
    flex: '1 1 auto', width: '100%', border: 0, background: '#0f1115'
  }
};



