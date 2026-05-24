const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class VMManager {
  constructor() {
    // Map userId -> { containerName, sshPort, startedAt }
    this.activeVMs = new Map();
    this.baseSshPort = 22220; // base for mapping host ports
  }

  async _findFreePort() {
    // naive port selection: iterate until a port not currently used by our map
    let port = this.baseSshPort + Math.floor(Math.random() * 1000);
    while ([...this.activeVMs.values()].some(v => v.sshPort === port)) {
      port++;
    }
    return port;
  }

  async _checkDockerConnection() {
    try {
      const dockerCmd = this._resolveDockerCmd();
      await execPromise(`${dockerCmd} version`, { timeout: 5000 });
      return true;
    } catch (error) {
      const msg = error.message || error.toString();
      if (msg.includes('pipe') || msg.includes('dockerDesktopLinuxEngine') || msg.includes('cannot find the file')) {
        throw new Error('Docker Desktop is not running. Please start Docker Desktop and wait for it to fully load, then try again.');
      }
      throw new Error(`Cannot connect to Docker: ${msg}`);
    }
  }

  async startKaliVM(userId) {
    try {
      console.log(`VMManager: Starting container for user ${userId}`);

      // Check Docker connection first
      await this._checkDockerConnection();

      // If already running, return existing
      if (this.activeVMs.has(userId)) {
        return this.activeVMs.get(userId);
      }

      const dockerCmd = this._resolveDockerCmd();
      const sshPort = await this._findFreePort();
      const containerName = `edusec_kali_${userId}`;

      // Remove any existing container with the same name (stopped or running)
      try {
        console.log(`Removing any existing container: ${containerName}`);
        await execPromise(`${dockerCmd} rm -f ${containerName}`, { timeout: 5000 });
      } catch (err) {
        // Container might not exist, which is fine
        console.log(`No existing container to remove: ${err.message}`);
      }

      // Use a tiny Alpine base image; very reliable to keep alive on Windows Docker
      const image = 'alpine:3.19';

      // Pull image (non-blocking if present)
      try {
        await execPromise(`${dockerCmd} image inspect ${image}`, { timeout: 10000 });
      } catch (err) {
        console.log(`Pulling image ${image}...`);
        await execPromise(`${dockerCmd} pull ${image}`, { timeout: 300000 }); // 5 min timeout for pull
      }

      // Run container detached; keep it alive reliably. Use --init for proper signal handling
      // Avoid port mappings for now to remove potential conflicts on Windows.
      const runCmd = `${dockerCmd} run -d --init --name ${containerName} --restart=no ${image} sh -c "while true; do sleep 3600; done"`;
      const { stdout, stderr } = await execPromise(runCmd);
      if (stderr) console.log('docker run stderr:', stderr);

      const vmDetails = {
        id: containerName,
        status: 'running',
        containerName,
        sshPort,
        guacamoleUrl: null,
        startedAt: new Date()
      };

      this.activeVMs.set(userId, vmDetails);

      // Verify container is actually running
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Double-check container is running
      try {
        const { stdout: runningCheck } = await execPromise(`${dockerCmd} inspect -f '{{.State.Running}}' ${containerName}`);
        const isRunningFlag = /true/i.test((runningCheck || '').trim());
        if (!isRunningFlag) {
          // Collect more diagnostics from inspect and decide based on JSON
          let info = null; let diag = '';
          try {
            const { stdout: inspectOut } = await execPromise(`${dockerCmd} inspect ${containerName}`);
            info = JSON.parse(inspectOut)[0] || {};
            const st = info.State || {};
            const status = st.Status;
            const exitCode = st.ExitCode;
            const oom = st.OOMKilled;
            const errMsg = st.Error || 'n/a';
            diag = `Status=${status}; ExitCode=${exitCode}; OOMKilled=${oom}; Error=${errMsg}`;
            if (status === 'running') {
              // Treat as success if inspect says running (workaround for formatting differences)
              return vmDetails;
            }
          } catch (_) {}

          // Try to get container logs for more context
          let logs = '';
          try {
            const { stdout } = await execPromise(`${dockerCmd} logs --tail 80 ${containerName}`);
            logs = stdout;
          } catch (_) {}
          throw new Error(`Container was created but failed to start. ${diag ? 'Inspect: ' + diag + '. ' : ''}Logs: ${logs || 'no logs available'}`);
        }
      } catch (err) {
        console.error('Container verification failed:', err);
        throw new Error('Container failed to start properly: ' + (err.message || err));
      }

      return vmDetails;
    } catch (error) {
      console.error('VMManager: Error starting VM:', error);
      // Re-throw with user-friendly message if it's already formatted
      if (error.message && error.message.includes('Docker Desktop')) {
        throw error;
      }
      throw new Error('Failed to start containerized VM: ' + (error.message || error));
    }
  }

  async stopKaliVM(userId) {
    try {
      const vm = this.activeVMs.get(userId);
      if (!vm) return { success: true };

      const dockerCmd = this._resolveDockerCmd();
      const containerName = vm.containerName;
      // Stop and remove container
      try {
        await execPromise(`${dockerCmd} rm -f ${containerName}`);
      } catch (err) {
        console.warn('VMManager: Error removing container', err.message || err);
      }

      this.activeVMs.delete(userId);
      return { success: true };
    } catch (error) {
      console.error('VMManager: Error stopping VM:', error);
      throw new Error('Failed to stop containerized VM');
    }
  }

  async getVMStatus(userId) {
    const vm = this.activeVMs.get(userId);
    if (!vm) {
      // Check if container exists but isn't in our map (e.g., after restart)
      const containerName = `edusec_kali_${userId}`;
      try {
        const dockerCmd = this._resolveDockerCmd();
        const { stdout } = await execPromise(`${dockerCmd} inspect -f '{{.State.Running}}' ${containerName}`);
        const running = stdout.trim() === 'true';
        if (running) {
          // Container exists and is running, recover the VM details
          const { stdout: portOut } = await execPromise(`${dockerCmd} inspect -f '{{range .NetworkSettings.Ports}}{{range .}}{{.HostPort}}{{end}}{{end}}' ${containerName}`);
          const sshPort = parseInt(portOut.trim().split('\n')[0]) || await this._findFreePort();
          const recovered = {
            id: containerName,
            status: 'running',
            containerName,
            sshPort,
            guacamoleUrl: null,
            startedAt: new Date()
          };
          this.activeVMs.set(userId, recovered);
          return recovered;
        } else {
          // Container exists but is stopped, clean it up
          await execPromise(`${dockerCmd} rm -f ${containerName}`);
        }
      } catch (err) {
        // Container doesn't exist, which is fine
      }
      return { status: 'stopped' };
    }

    try {
      const dockerCmd = this._resolveDockerCmd();
      const { stdout } = await execPromise(`${dockerCmd} inspect -f '{{.State.Running}}' ${vm.containerName}`);
      const running = stdout.trim() === 'true';
      return { ...vm, status: running ? 'running' : 'stopped' };
    } catch (err) {
      // container might have exited
      this.activeVMs.delete(userId);
      return { status: 'stopped' };
    }
  }

  _resolveDockerCmd() {
    const isWindows = process.platform === 'win32';
    if (!isWindows) return 'docker';

    const candidates = [
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\resources\\docker.exe',
      process.env.ProgramFiles + '\\Docker\\Docker\\bin\\docker.exe'
    ].filter(Boolean);

    for (const cand of candidates) {
      try {
        const fs = require('fs');
        if (fs.existsSync(cand)) return `"${cand}"`;
      } catch (_) {}
    }
    return 'docker';
  }

  async executeCommand(userId, command) {
    const vm = this.activeVMs.get(userId);
    if (!vm) {
      throw new Error('VM is not running');
    }

    try {
      const dockerCmd = this._resolveDockerCmd();
      // Execute command in container as root (since rastasheep/ubuntu-sshd runs as root by default)
      // For real Kali, we'd use: docker exec -it container bash -c "command"
      const execCmd = `${dockerCmd} exec ${vm.containerName} bash -c ${JSON.stringify(command)}`;
      const { stdout, stderr } = await execPromise(execCmd, { maxBuffer: 1024 * 1024 * 10 });
      
      return {
        success: true,
        output: stdout || stderr || '',
        exitCode: stderr ? 1 : 0
      };
    } catch (error) {
      return {
        success: false,
        output: error.stderr || error.message || 'Command execution failed',
        exitCode: error.code || 1
      };
    }
  }

  async cleanupInactiveVMs() {
    const now = new Date();
    const inactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [userId, vm] of this.activeVMs.entries()) {
      const inactiveFor = now - vm.startedAt;
      if (inactiveFor > inactiveTime) {
        console.log(`Cleaning up inactive VM for user ${userId}`);
        await this.stopKaliVM(userId);
      }
    }
  }
}

module.exports = new VMManager();