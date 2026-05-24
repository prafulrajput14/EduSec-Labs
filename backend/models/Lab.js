const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  category: { type: String, required: true },
  dockerImage: { type: String },
  port: { type: Number },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lab', labSchema);