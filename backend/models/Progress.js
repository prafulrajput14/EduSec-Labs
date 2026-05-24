const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  score: { type: Number, default: 0 }
});


module.exports = mongoose.model('Progress', progressSchema);
