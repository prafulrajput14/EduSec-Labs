import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function LabTerminal({ labId, labName, onClose }) {
    const terminalRef = useRef(null);
    const terminal = useRef(null);
    const fitAddon = useRef(null);
    const commandHistory = useRef([]);
    const historyIndex = useRef(-1);
    const currentLine = useRef('');

    useEffect(() => {
        if (terminalRef.current && !terminal.current) {
            initializeTerminal();
        }
        return () => {
            if (terminal.current) {
                terminal.current.dispose();
                terminal.current = null;
            }
        };
    }, []);

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
        term.writeln(`\x1b[32m║     ${labName.padEnd(44, ' ')} ║\x1b[0m`);
        term.writeln('\x1b[32m╚════════════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[36mWelcome to your lab environment!\x1b[0m');
        term.writeln('\x1b[33mType commands to interact with the lab container.\x1b[0m');
        term.writeln('');
        term.write('\x1b[36mroot@lab:~# \x1b[0m');

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
                    term.write('\x1b[36mroot@lab:~# \x1b[0m');
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
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
                            term.write(prevCmd);
                            currentLine.current = prevCmd;
                        }
                    } else if (arrow === 'B') { // Down
                        if (historyIndex.current < commandHistory.current.length - 1) {
                            historyIndex.current++;
                            const prevCmd = commandHistory.current[historyIndex.current];
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
                            term.write(prevCmd);
                            currentLine.current = prevCmd;
                        } else {
                            historyIndex.current = commandHistory.current.length;
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
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
            const response = await axios.post(`/api/labs/${labId}/execute`, { command: cmd });

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

        terminal.current.write('\r\n\x1b[36mroot@lab:~# \x1b[0m');
    };

    return (
        <div style={styles.container}>
            <div style={styles.chrome} className="d-flex align-items-center justify-content-between px-3 py-2">
                <div className="text-truncate">
                    <strong>{labName}</strong>
                    <span className="text-white-50 ms-2 small">Interactive Terminal</span>
                </div>
                <div>
                    <button className="btn btn-outline-light btn-sm" onClick={onClose}>
                        <i className="bi bi-x-lg"></i> Close
                    </button>
                </div>
            </div>
            <div
                ref={terminalRef}
                style={styles.terminal}
            />
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(5,8,15,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column'
    },
    chrome: {
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(180deg, rgba(16,18,26,0.95), rgba(14,16,22,0.92))'
    },
    terminal: {
        flex: '1 1 auto',
        padding: '10px',
        backgroundColor: '#1e1e1e',
        overflow: 'auto'
    }
};

