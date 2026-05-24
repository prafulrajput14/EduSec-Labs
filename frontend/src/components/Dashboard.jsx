import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [stats, setStats] = useState({
    totalLabs: 0,
    completedLabs: 0,
    inProgress: 0,
    totalScore: 0
  });
  const [recentLabs, setRecentLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/labs');
      const labs = response.data;
      
      const completed = labs.filter(lab => lab.userProgress.status === 'completed').length;
      const inProgress = labs.filter(lab => lab.userProgress.status === 'in_progress').length;
      const totalScore = labs
        .filter(lab => lab.userProgress.status === 'completed')
        .reduce((sum, lab) => sum + lab.userProgress.score, 0);

      setStats({
        totalLabs: labs.length,
        completedLabs: completed,
        inProgress: inProgress,
        totalScore: totalScore
      });

      // Get recent labs (last 3, sorted by activity - in progress first, then by startedAt)
      const sorted = labs
        .filter(lab => lab.userProgress?.status === 'in_progress' || lab.userProgress?.status === 'completed')
        .sort((a, b) => {
          if (a.userProgress.status === 'in_progress' && b.userProgress.status !== 'in_progress') return -1;
          if (b.userProgress.status === 'in_progress' && a.userProgress.status !== 'in_progress') return 1;
          return 0;
        })
        .slice(0, 3);
      setRecentLabs(sorted.length > 0 ? sorted : labs.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: 'info',
      intermediate: 'warning',
      advanced: 'danger',
      expert: 'dark'
    };
    return colors[level] || 'secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={mounted ? 'mounted' : ''}>
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-white">Welcome back, {user?.username}! 👋</h1>
          <p className="lead text-white-50">
            Continue your cybersecurity learning journey
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="row mb-5">
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Total Labs</h5>
                  <h2 className="card-text">{stats.totalLabs}</h2>
                </div>
                <div className="display-4">📚</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Completed</h5>
                  <h2 className="card-text">{stats.completedLabs}</h2>
                </div>
                <div className="display-4">✅</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">In Progress</h5>
                  <h2 className="card-text">{stats.inProgress}</h2>
                </div>
                <div className="display-4">🔄</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Total Score</h5>
                  <h2 className="card-text">{stats.totalScore}</h2>
                </div>
                <div className="display-4">🏆</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Quick Actions */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/labs" className="btn btn-primary btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Start a New Lab
                </Link>
                <Link to="/kali-vm" className="btn btn-outline-primary btn-lg">
                  <i className="bi bi-terminal me-2"></i>
                  Access Kali VM
                </Link>
                <Link to="/ai-assistant" className="btn btn-outline-success btn-lg">
                  <i className="bi bi-robot me-2"></i>
                  Ask AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-transparent">
              <h5 className="card-title mb-0">Your Profile</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Current Level:</strong>{' '}
                <span className={`badge bg-${getLevelColor(user?.level)}`}>
                  {user?.level}
                </span>
              </div>
              <div className="mb-3">
                <strong>Badges Earned:</strong>{' '}
                <span className="badge bg-secondary">
                  {user?.badges?.length || 0}
                </span>
              </div>
              <div className="progress mb-3" style={{ height: '20px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ width: `${stats.totalLabs > 0 ? (stats.completedLabs / stats.totalLabs) * 100 : 0}%` }}
                >
                  {stats.totalLabs > 0 ? Math.round((stats.completedLabs / stats.totalLabs) * 100) : 0}%
                </div>
              </div>
              <small className="text-muted">
                Progress: {stats.completedLabs} of {stats.totalLabs} labs completed
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Labs */}
      {recentLabs.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-transparent">
                <h5 className="card-title mb-0">Recent Labs</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {recentLabs.map(lab => (
                    <div key={lab._id} className="col-md-4 mb-3">
                      <div className="card lab-card h-100">
                        <div className="card-body">
                          <h6 className="card-title">{lab.name}</h6>
                          <span className={`badge bg-${lab.difficulty === 'easy' ? 'success' : lab.difficulty === 'medium' ? 'warning' : 'danger'} mb-2`}>
                            {lab.difficulty}
                          </span>
                          <p className="card-text small text-muted">
                            {lab.description.substring(0, 80)}...
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className={`badge bg-${lab.userProgress.status === 'completed' ? 'success' : lab.userProgress.status === 'in_progress' ? 'primary' : 'secondary'}`}>
                              {lab.userProgress.status.replace('_', ' ')}
                            </span>
                            <Link 
                              to="/labs" 
                              className="btn btn-sm btn-outline-primary"
                            >
                              {lab.userProgress.status === 'not_started' ? 'Start' : 'Continue'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

