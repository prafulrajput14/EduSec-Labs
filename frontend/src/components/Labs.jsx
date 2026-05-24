import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LabTerminal from './LabTerminal';
import LabDetails from './LabDetails';

const Labs = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingLab, setStartingLab] = useState(null);
  const [stoppingLab, setStoppingLab] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeLab, setActiveLab] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);

  useEffect(() => {
    fetchLabs();
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await axios.get('/api/labs');
      setLabs(response.data);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLab = async (labId) => {
    setStartingLab(labId);
    try {
      const response = await axios.post(`/api/labs/${labId}/start`);

      if (response.data.lab) {
        setLabs(prevLabs =>
          prevLabs.map(lab =>
            lab._id === labId
              ? { ...lab, userProgress: { ...lab.userProgress, status: 'in_progress' } }
              : lab
          )
        );
        const selected = labs.find(l => l._id === labId);
        if (selected) {
          setActiveLab({
            id: labId,
            name: selected.name,
            accessUrl: response.data.lab.accessUrl
          });
        }
      }
    } catch (error) {
      console.error('Error starting lab:', error);
      const detail = error?.response?.data?.error || error?.message || '';
      const hint = detail ? `\n\nDetails: ${detail}` : '';
      alert(`❌ Failed to start lab. Please try again.${hint}`);
    } finally {
      setStartingLab(null);
    }
  };

  const stopLab = async (labId) => {
    setStoppingLab(labId);
    try {
      await axios.post(`/api/labs/${labId}/stop`);
      setLabs(prevLabs =>
        prevLabs.map(lab =>
          lab._id === labId
            ? { ...lab, userProgress: { ...lab.userProgress, status: 'not_started', score: lab.userProgress.score || 0 } }
            : lab
        )
      );
    } catch (error) {
      console.error('Error stopping lab:', error);
      alert('❌ Failed to stop lab. Please try again.');
    } finally {
      setStoppingLab(null);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger'
    };
    return `badge bg-${colors[difficulty]}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      not_started: 'secondary',
      in_progress: 'primary',
      completed: 'success'
    };
    return `badge bg-${colors[status]}`;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Web Application': '🌐',
      'Network Security': '🔗',
      'Cryptography': '🔐',
      'Forensics': '🔍'
    };
    return icons[category] || '📁';
  };

  const labStats = React.useMemo(() => ({
    easy: labs.filter(l => l.difficulty === 'easy').length,
    medium: labs.filter(l => l.difficulty === 'medium').length,
    hard: labs.filter(l => l.difficulty === 'hard').length,
    completed: labs.filter(l => l.userProgress?.status === 'completed').length
  }), [labs]);

  const filteredLabs = React.useMemo(() => {
    return labs.filter(lab => {
      let matchesFilter = false;
      if (filter === 'all') {
        matchesFilter = true;
      } else if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
        matchesFilter = lab.difficulty === filter;
      } else if (filter === 'web') {
        matchesFilter = lab.category.toLowerCase().includes('web');
      } else if (filter === 'network') {
        matchesFilter = lab.category.toLowerCase().includes('network');
      }

      const matchesSearch = !searchTerm.trim() ||
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [labs, filter, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading labs...</span>
        </div>
        <p className="mt-2 text-white loader-anim">Loading available labs...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-white">Cybersecurity Labs</h1>
          <p className="lead text-white-50">Practice your skills in safe, isolated environments</p>
        </div>
        <span className="badge bg-primary fs-6">{filteredLabs.length} labs available</span>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Labs</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="web">Web Application</option>
                <option value="network">Network Security</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={`row ${mounted ? 'mounted' : ''}`}>
        {filteredLabs.map(lab => (
          <div key={lab._id} className="col-xl-4 col-lg-6 mb-4">
            <div className="card lab-card h-100" onClick={() => setSelectedLab(lab)} style={{ cursor: 'pointer' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="card-title mb-1">{lab.name}</h5>
                    <span className={getDifficultyBadge(lab.difficulty)}>
                      {lab.difficulty}
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="fs-4">{getCategoryIcon(lab.category)}</div>
                    <small className="text-muted">{lab.category}</small>
                  </div>
                </div>

                <p className="card-text text-muted">{lab.description}</p>

                {lab.category && (
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="bi bi-tags me-1"></i>
                      Category: {lab.category}
                      {lab.dockerImage && (
                        <span className="ms-2">
                          <i className="bi bi-box me-1"></i>
                          Containerized
                        </span>
                      )}
                    </small>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <span className={getStatusBadge(lab.userProgress.status)}>
                    {lab.userProgress.status.replace('_', ' ')}
                  </span>

                  <div>
                    {lab.userProgress.status === 'in_progress' ? (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={(e) => { e.stopPropagation(); stopLab(lab._id); }}
                        disabled={stoppingLab === lab._id}
                      >
                        {stoppingLab === lab._id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Stopping...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-stop-circle me-2"></i>
                            Stop Lab
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); startLab(lab._id); }}
                        disabled={startingLab === lab._id}
                      >
                        {startingLab === lab._id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Starting...
                          </>
                        ) : lab.userProgress.status === 'completed' ? (
                          <>
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Restart
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-fill me-2"></i>
                            Start Lab
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {lab.userProgress.status === 'completed' && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${lab.userProgress.score}%` }}
                      ></div>
                    </div>
                    <small className="text-success">
                      <i className="bi bi-star-fill me-1"></i>
                      Score: {lab.userProgress.score}/100
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLabs.length === 0 && (
        <div className="text-center py-5">
          <div className="card">
            <div className="card-body py-5">
              <i className="bi bi-search display-1 text-muted"></i>
              <h3 className="text-muted mt-3">No labs found</h3>
              <p className="text-muted">
                {searchTerm ? `No labs match "${searchTerm}"` : 'No labs available for the selected filter'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Show All Labs
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Lab Statistics</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <h4 className="text-primary">{labStats.easy}</h4>
                  <p className="text-muted mb-0">Easy Labs</p>
                </div>
                <div className="col-md-3">
                  <h4 className="text-warning">{labStats.medium}</h4>
                  <p className="text-muted mb-0">Medium Labs</p>
                </div>
                <div className="col-md-3">
                  <h4 className="text-danger">{labStats.hard}</h4>
                  <p className="text-muted mb-0">Hard Labs</p>
                </div>
                <div className="col-md-3">
                  <h4 className="text-success">{labStats.completed}</h4>
                  <p className="text-muted mb-0">Your Completions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeLab && (
        <LabTerminal
          labId={activeLab.id}
          labName={activeLab.name}
          onClose={() => setActiveLab(null)}
        />
      )}

      {selectedLab && (
        <LabDetails
          lab={selectedLab}
          onClose={() => { setSelectedLab(null); setActiveLab(null); }}
          onStart={() => {
            setSelectedLab(null);
            startLab(selectedLab._id);
          }}
          onOpenTerminal={() => {
            if (selectedLab) {
              setActiveLab({
                id: selectedLab._id,
                name: selectedLab.name
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default Labs;

