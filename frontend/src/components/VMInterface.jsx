import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function VMInterface() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [vmStatus, setVmStatus] = useState('stopped');
  const [loading, setLoading] = useState(false);
  const [vmDetails, setVmDetails] = useState(null);
  const [dockerHealthy, setDockerHealthy] = useState(true);
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);
  const currentLine = useRef('');

  useEffect(() => {
    checkVMStatus();
    checkDockerHealth();
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const checkDockerHealth = async () => {
    try {
      const response = await axios.get('/api/vm/docker-health');
      setDockerHealthy(response.data.healthy);
    } catch (error) {
      setDockerHealthy(false);
    }
  };

  useEffect(() => {
    if (vmStatus === 'running' && terminalRef.current && !terminal.current) {
      initializeTerminal();
    }
    return () => {
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
    };
  }, [vmStatus]);

  const checkVMStatus = async () => {
    try {
      const response = await axios.get('/api/vm/status');
      setVmStatus(response.data.status);
      setVmDetails(response.data);
      
      if (response.data.status === 'running' && !terminal.current) {
        setTimeout(() => {
          if (terminalRef.current && !terminal.current) {
            initializeTerminal();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error checking VM status:', error);
    }
  };

  const initializeTerminal = () => {
    if (terminal.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#00ff00',
        cursor: '#00ff00',
        selection: '#333333'
      }
    });

    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);
    term.open(terminalRef.current);
    fitAddon.current.fit();

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    // Write welcome message
    term.writeln('\r\n\x1b[32m╔════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[32m║     Welcome to EduSec Labs Kali Environment     ║\x1b[0m');
    term.writeln('\x1b[32m╚════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.write('\x1b[36mroot@kali:~# \x1b[0m');

    // Handle input
    term.onData((data) => {
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        const cmd = currentLine.current.trim();
        if (cmd) {
          term.write('\r\n');
          executeCommand(cmd);
          commandHistory.current.push(cmd);
          historyIndex.current = commandHistory.current.length;
        } else {
          term.write('\r\n');
          term.write('\x1b[36mroot@kali:~# \x1b[0m');
        }
        currentLine.current = '';
      } else if (code === 127) { // Backspace
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 27) { // Escape sequence (arrows)
        if (data.length === 3 && data[1] === '[') {
          const arrow = data[2];
          if (arrow === 'A') { // Up
            if (historyIndex.current > 0) {
              historyIndex.current--;
              const prevCmd = commandHistory.current[historyIndex.current];
              // Clear current line
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              term.write(prevCmd);
              currentLine.current = prevCmd;
            }
          } else if (arrow === 'B') { // Down
            if (historyIndex.current < commandHistory.current.length - 1) {
              historyIndex.current++;
              const prevCmd = commandHistory.current[historyIndex.current];
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              term.write(prevCmd);
              currentLine.current = prevCmd;
            } else {
              historyIndex.current = commandHistory.current.length;
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              currentLine.current = '';
            }
          }
        }
      } else if (code >= 32 && code <= 126) { // Printable characters
        currentLine.current += data;
        term.write(data);
      }
    });

    terminal.current = term;

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const executeCommand = async (cmd) => {
    if (!terminal.current) return;

    try {
      const response = await axios.post('/api/vm/execute', { command: cmd });
      
      if (response.data.success) {
        const output = response.data.output || '';
        if (output) {
          terminal.current.write(output);
        }
      } else {
        terminal.current.write(`\x1b[31mError: ${response.data.output}\x1b[0m`);
      }
    } catch (error) {
      terminal.current.write(`\x1b[31mError executing command: ${error.response?.data?.message || error.message}\x1b[0m`);
    }
    
    terminal.current.write('\r\n\x1b[36mroot@kali:~# \x1b[0m');
  };

  const startVM = async () => {
    setLoading(true);
    let checkInterval = null;
    
    try {
      const response = await axios.post('/api/vm/start');
      // Optimistically mark as running and initialize terminal; we'll verify in background
      setVmDetails(response.data.vm);
      setVmStatus('running');
      setTimeout(() => {
        if (terminalRef.current && !terminal.current) {
          initializeTerminal();
        }
      }, 300);

      // Background verify up to 60s; if check fails we fall back to stopped with message
      let attempts = 0;
      const maxAttempts = 60;
      checkInterval = setInterval(async () => {
        attempts++;
        try {
          const statusResponse = await axios.get('/api/vm/status');
          if (statusResponse.data.status === 'running') {
            clearInterval(checkInterval);
            setLoading(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setVmStatus('stopped');
            setLoading(false);
            
            // Try to get more detailed error info
            try {
              const finalStatus = await axios.get('/api/vm/status');
              if (finalStatus.data.status === 'stopped' && finalStatus.data.error) {
                alert(`❌ VM failed to start after ${maxAttempts} seconds.\n\nError: ${finalStatus.data.error}\n\nPlease check Docker Desktop is running and try again.`);
              } else {
                alert(`❌ VM failed to start after ${maxAttempts} seconds.\n\nThe container may be taking longer than expected, or there was an issue.\n\n💡 Solutions:\n1. Check Docker Desktop is running\n2. Wait a moment and try again\n3. Check Docker logs if the problem persists`);
              }
            } catch (err) {
              alert(`❌ VM failed to start after ${maxAttempts} seconds.\n\nPlease check Docker Desktop is running and try again.`);
            }
          }
        } catch (err) {
          console.error('Error checking VM status:', err);
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setVmStatus('stopped');
            setLoading(false);
            alert(`❌ VM failed to start: Unable to check VM status.\n\nError: ${err.message || 'Connection error'}`);
          }
        }
      }, 1000);
      
    } catch (error) {
      if (checkInterval) clearInterval(checkInterval);
      
      console.error('Error starting VM:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      
      // Show user-friendly error message
      if (errorMsg.includes('Docker Desktop')) {
        alert(`❌ ${errorMsg}\n\n💡 Solution:\n1. Open Docker Desktop\n2. Wait for it to show "Docker is running"\n3. Try again`);
      } else if (errorMsg.includes('Conflict') || errorMsg.includes('already in use')) {
        alert(`❌ Container name conflict.\n\nThe system should have handled this automatically. Please try again, or manually remove the container:\n\n${errorMsg}\n\n💡 Try clicking "Start VM" again - it should work now.`);
      } else {
        alert(`❌ Failed to start VM: ${errorMsg}\n\n💡 Please check:\n1. Docker Desktop is running\n2. You have enough disk space\n3. No firewall is blocking Docker`);
      }
      setLoading(false);
      setVmStatus('stopped');
    }
  };

  const stopVM = async () => {
    setLoading(true);
    try {
      await axios.post('/api/vm/stop');
      setVmStatus('stopped');
      setVmDetails(null);
      
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
        fitAddon.current = null;
      }
      
      commandHistory.current = [];
      historyIndex.current = -1;
      currentLine.current = '';
    } catch (error) {
      console.error('Error stopping VM:', error);
      alert(`Failed to stop VM: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      running: 'success',
      starting: 'warning',
      stopped: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      running: 'RUNNING',
      starting: 'STARTING',
      stopped: 'STOPPED'
    };
    return texts[status] || 'UNKNOWN';
  };

  const getStatusDesc = (status) => {
    const descs = {
      running: 'VM is ready to use',
      starting: 'VM is booting up...',
      stopped: 'VM is powered off'
    };
    return descs[status] || 'Unknown status';
  };

  return (
    <div className={mounted ? 'mounted' : ''}>
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-white">Kali Linux VM</h1>
          <p className="lead text-white-50">
            Access your personal Kali Linux environment - Just like TryHackMe!
          </p>
        </div>
      </div>

      {/* VM Status Card */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-hdd me-2"></i>
                Virtual Machine Status
              </h5>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col">
                  <div className="d-flex align-items-center">
                    <span className={`badge bg-${getStatusColor(vmStatus)} me-3`} style={{ width: '12px', height: '12px', padding: 0, borderRadius: '50%' }}></span>
                    <div>
                      <h4 className={`text-${getStatusColor(vmStatus)} mb-0`}>
                        {getStatusText(vmStatus)}
                      </h4>
                      <small className="text-muted">
                        {getStatusDesc(vmStatus)}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-auto">
                  {vmStatus === 'stopped' ? (
                    <button
                      className="btn btn-success btn-lg"
                      onClick={startVM}
                      disabled={loading || !dockerHealthy}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Starting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-play-fill me-2"></i>
                          Start VM
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      onClick={stopVM}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Stopping...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-stop-fill me-2"></i>
                          Stop VM
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {vmDetails && vmDetails.sshPort && (
                <div className="mt-3 p-3 bg-light rounded">
                  <h6>Connection Details:</h6>
                  <div className="row small">
                    <div className="col-md-12">
                      <strong>SSH Access:</strong><br/>
                      <code className="text-primary">ssh root@localhost -p {vmDetails.sshPort}</code>
                      <br/>
                      <small className="text-muted">Password: root (default)</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!dockerHealthy && (
              <div className="alert alert-warning mx-3 mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Docker Desktop is not running.</strong> Please start Docker Desktop and wait for it to fully load.
                <button className="btn btn-sm btn-outline-primary ms-2" onClick={checkDockerHealth}>
                  <i className="bi bi-arrow-clockwise me-1"></i>Check Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Available Tools
              </h5>
            </div>
            <div className="card-body">
              <div className="row small">
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  nmap
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  metasploit
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  burpsuite
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  sqlmap
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  john
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  wireshark
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  gobuster
                </div>
                <div className="col-6 mb-2">
                  <i className="bi bi-check-circle text-success me-1"></i>
                  hydra
                </div>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  Full Linux environment pre-configured and ready to use.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Interface */}
      {vmStatus === 'running' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-terminal me-2"></i>
              Web Terminal
            </h5>
            <small className="text-muted">Interactive terminal - Type commands directly</small>
          </div>
          <div className="card-body p-0">
            <div 
              ref={terminalRef}
              style={{ 
                height: '500px', 
                padding: '10px',
                backgroundColor: '#1e1e1e'
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Start Guide */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                Quick Start Guide
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <h6>1. Start the VM</h6>
                  <p className="small text-muted">
                    Click "Start VM" to launch your Kali Linux environment. 
                    This may take a few moments.
                  </p>
                </div>
                <div className="col-md-4 mb-3">
                  <h6>2. Use the Terminal</h6>
                  <p className="small text-muted">
                    Type commands directly in the web terminal. All commands are 
                    executed in real-time on your VM.
                  </p>
                </div>
                <div className="col-md-4 mb-3">
                  <h6>3. Practice Safely</h6>
                  <p className="small text-muted">
                    All activities are contained within the VM. 
                    Experiment safely with various security tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
