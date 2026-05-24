// Curated, high-level guidance for common cybersecurity lab topics.
// This is used when no model key is configured or as context for prompting.

const topics = [
  {
    id: 'recon_web',
    title: 'Web Reconnaissance Basics',
    keywords: ['recon', 'enumeration', 'what to scan', 'reconnaissance', 'dirb', 'gobuster'],
    steps: [
      'Identify target host and confirm reachability with ping or curl.',
      'Enumerate open ports/services: nmap -sS -sV -O -Pn <target>',
      'If web is open, enumerate content and paths: gobuster dir -u http://<host> -w <wordlist>',
      'Capture and review responses with an intercepting proxy (e.g., Burp).',
      'Map inputs and auth flows; note potential injection points.',
    ],
    tips: [
      'Always start broad (top 1000 ports), then focus based on service banners.',
      'Cache findings in a notes file; you will reuse service versions later.',
    ],
  },
  {
    id: 'dvwa_sql_injection',
    title: 'DVWA SQL Injection Workflow',
    keywords: ['dvwa', 'sql injection', "sql'i", 'sqli'],
    steps: [
      'Set DVWA security level to Low/Medium to observe differences.',
      'Identify parameterized inputs (GET/POST).',
      'Test for injection with benign probes like a single quote or OR 1=1 patterns in a safe lab context.',
      'Observe error-based signals, then move to UNION-based enumeration in the lab.',
      'Discuss mitigations: parameterized queries, least privilege, input validation.',
    ],
    tips: [
      'Keep testing strictly inside the provided lab environment.',
      'Document payloads and server responses to compare across security levels.',
    ],
  },
  {
    id: 'owasp_juice_shop',
    title: 'OWASP Juice Shop Learning Path',
    keywords: ['juice shop', 'owasp juice', 'owasp top 10', 'xss', 'broken auth'],
    steps: [
      'Start with Score Board to track challenges (in-app feature).',
      'Practice reflected and stored XSS in search/review inputs (in the lab only).',
      'Explore broken access control via direct object references.',
      'Use hints to understand root causes and mitigations.',
    ],
    tips: [
      'After reproducing a vuln, write down the secure design and fix.',
      'Try the challenge in dev mode, then reflect on real-world hardening.',
    ],
  },
  {
    id: 'password_cracking_basics',
    title: 'Password Cracking Basics (Ethical, Lab Only)',
    keywords: ['hashcat', 'john', 'password cracking', 'wordlist'],
    steps: [
      'Work only with lab-provided sample hashes and explicit permission.',
      'Identify hash type safely (e.g., hashid).',
      'Attempt dictionary attack with well-known lists; avoid brute force unless required.',
      'Discuss defense: password policies, rate limiting, MFA, strong hashing (bcrypt/argon2).',
    ],
    tips: [
      'Always pair exploitation practice with mitigation strategies.',
    ],
  },
];

function retrieveRelevant(message, max = 3) {
  const m = String(message || '').toLowerCase();
  const scored = topics.map(t => ({
    topic: t,
    score: t.keywords.reduce((acc, k) => (m.includes(k.toLowerCase()) ? acc + 1 : acc), 0),
  }));
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => s.topic);
}

module.exports = { topics, retrieveRelevant };


