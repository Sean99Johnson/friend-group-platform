const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide a location name']
    },
    address: {
      type: String,
      required: [true, 'Please provide an address']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  datetime: {
    type: Date,
    required: [true, 'Please provide event date and time']
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: 20
  },
  rsvps: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going'],
      required: true
    },
    rsvpedAt: {
      type: Date,
      default: Date.now
    }
  }],
  checkins: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    location: {
      lat: Number,
      lng: Number
    }
  }],
  eventType: {
    type: String,
    enum: ['dinner', 'games', 'outdoor', 'sports', 'entertainment', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ group: 1, datetime: 1 });
eventSchema.index({ host: 1 });

module.exports = mongoose.model('Event', eventSchema);
