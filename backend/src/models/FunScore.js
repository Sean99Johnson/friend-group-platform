const mongoose = require('mongoose');

const funScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  currentScore: {
    type: Number,
    default: 500,
    min: 300,
    max: 850
  },
  scoreHistory: [{
    score: Number,
    reason: String,
    change: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  metrics: {
    eventsAttended: {
      type: Number,
      default: 0
    },
    eventsHosted: {
      type: Number,
      default: 0
    },
    totalRSVPs: {
      type: Number,
      default: 0
    },
    noShows: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 100
    },
    hostingFrequency: {
      type: Number,
      default: 0
    }
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for user-group combinations
funScoreSchema.index({ user: 1, group: 1 }, { unique: true });

module.exports = mongoose.model('FunScore', funScoreSchema);
