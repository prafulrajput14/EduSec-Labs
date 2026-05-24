const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusec-labs');

const Lab = require('../models/Lab');

const sampleLabs = [
  {
    name: "DVWA - Web Application Security",
    description: "Practice web application vulnerabilities including SQL injection, XSS, CSRF, and more in a controlled environment.",
    difficulty: "easy",
    category: "Web Application",
    dockerImage: "vulnerables/web-dvwa",
    port: 8082,
    isActive: true
  },
  {
    name: "OWASP Juice Shop",
    description: "Modern vulnerable web application containing all OWASP Top 10 vulnerabilities and more.",
    difficulty: "medium",
    category: "Web Application",
    dockerImage: "bkimminich/juice-shop",
    port: 8083,
    isActive: true
  },
  {
    name: "Metasploitable 2",
    description: "Intentionally vulnerable Linux virtual machine for practicing penetration testing and exploitation.",
    difficulty: "hard",
    category: "Network Security",
    dockerImage: "tleemcjr/metasploitable2",
    port: 8084,
    isActive: true
  },
  {
    name: "Basic Network Scanning",
    description: "Learn network reconnaissance techniques with nmap and other scanning tools.",
    difficulty: "easy",
    category: "Network Security",
    dockerImage: null,
    port: null,
    isActive: true
  },
  {
    name: "Password Cracking",
    description: "Practice password cracking techniques with John the Ripper and Hashcat.",
    difficulty: "medium",
    category: "Cryptography",
    dockerImage: null,
    port: null,
    isActive: true
  }
];

async function initializeLabs() {
  try {
    // Clear existing labs
    await Lab.deleteMany({});
    
    // Insert sample labs
    await Lab.insertMany(sampleLabs);
    
    console.log('✅ Sample labs initialized successfully!');
    console.log('📋 Created labs:');
    sampleLabs.forEach(lab => {
      console.log(`   - ${lab.name} (${lab.difficulty})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing labs:', error);
    process.exit(1);
  }
}

initializeLabs();