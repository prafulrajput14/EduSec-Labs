const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Manages lifecycle of lab containers (per user, per lab).
 * Each running container is tracked in-memory. On process restart,
 * the map resets, but docker containers (if any) can still be stopped manually.
 */
class LabManager {
  constructor() {
    // key: `${userId}:${labId}` -> details
    this.activeLabs = new Map();
    this.baseHttpPort = 8082; // starting range for host port mappings
    this.dockerCmd = this._resolveDockerCmd();
  }

  _resolveDockerCmd() {
    // Prefer PATH 'docker', else try common Docker Desktop locations on Windows
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
      } catch (_) { }
    }
    return 'docker';
  }

  async _findFreeHttpPort() {
    let port = this.baseHttpPort + Math.floor(Math.random() * 1000);
    while ([...this.activeLabs.values()].some(v => v.hostPort === port)) {
      port++;
    }
    return port;
  }

  /**
   * Best-effort guess of exposed internal port for known images.
   * Falls back to 80 for generic web apps.
   */
  _inferInternalPort(dockerImage) {
    const image = (dockerImage || '').toLowerCase();
    if (image.includes('juice-shop')) return 3000;
    if (image.includes('dvwa')) return 80;
    if (image.includes('metasploitable')) return 80; // many ports; expose 80 for UI
    return 80;
  }

  _containerName(labId, userId) {
    return `edusec_lab_${String(labId)}_${String(userId)}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  async startLabContainer({ lab, userId }) {
    if (!lab || !lab.dockerImage) {
      throw new Error('This lab is not containerized or dockerImage is missing');
    }

    const key = `${userId}:${lab._id}`;
    if (this.activeLabs.has(key)) {
      return this.activeLabs.get(key);
    }

    const internalPort = this._inferInternalPort(lab.dockerImage);
    // Always choose a free host port to avoid clashes with any pre-run Compose stacks
    const hostPort = await this._findFreeHttpPort();
    const containerName = this._containerName(lab._id, userId);

    // Ensure image exists locally
    try {
      await execPromise(`${this.dockerCmd} image inspect ${lab.dockerImage}`);
    } catch (_) {
      await execPromise(`${this.dockerCmd} pull ${lab.dockerImage}`);
    }

    // If a stale container with same name exists, remove it
    try {
      await execPromise(`${this.dockerCmd} rm -f ${containerName}`);
    } catch (_) {
      // ignore
    }

    const runCmd = `${this.dockerCmd} run -d --name ${containerName} -p ${hostPort}:${internalPort} --restart=no ${lab.dockerImage}`;
    const { stderr } = await execPromise(runCmd);
    if (stderr) {
      // docker sometimes writes warnings to stderr; do not fail on non-empty stderr
      try { if (!/^[\s\S]*$/.test(stderr)) { } } catch (_) { }
    }

    const details = {
      id: containerName,
      status: 'running',
      containerName,
      hostPort,
      internalPort,
      image: lab.dockerImage,
      accessUrl: `http://localhost:${hostPort}`,
      startedAt: new Date()
    };

    this.activeLabs.set(key, details);
    return details;
  }

  async stopLabContainer({ labId, userId }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    const containerName = info ? info.containerName : this._containerName(labId, userId);
    try {
      await execPromise(`${this.dockerCmd} rm -f ${containerName}`);
    } catch (_) {
      // ignore
    }
    this.activeLabs.delete(key);
    return { success: true };
  }

  async getStatus({ labId, userId }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);
    if (!info) return { status: 'stopped' };
    try {
      const { stdout } = await execPromise(`${this.dockerCmd} inspect -f '{{.State.Running}}' ${info.containerName}`);
      const running = stdout.trim() === 'true';
      return { ...info, status: running ? 'running' : 'stopped' };
    } catch (_) {
      this.activeLabs.delete(key);
      return { status: 'stopped' };
    }
  }

  async executeCommand({ labId, userId, command }) {
    const key = `${userId}:${labId}`;
    const info = this.activeLabs.get(key);

    if (!info) {
      throw new Error('Lab container is not running. Please start the lab first.');
    }

    try {
      // Execute command in the container
      const execCmd = `${this.dockerCmd} exec ${info.containerName} /bin/sh -c ${JSON.stringify(command)}`;
      const { stdout, stderr } = await execPromise(execCmd);

      // Combine stdout and stderr for terminal output
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      return {
        success: true,
        output: output || '(no output)\r\n'
      };
    } catch (error) {
      return {
        success: false,
        output: error.message || 'Command execution failed'
      };
    }
  }
}

module.exports = new LabManager();


