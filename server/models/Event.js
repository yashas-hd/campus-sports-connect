const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    sport: {
      type: String,
      enum: ['Cricket', 'Football', 'Basketball', 'Volleyball', 'Badminton', 'Kabaddi'],
      required: [true, 'Please specify the sport'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date and time for the event'],
      validate: {
        validator: function(v) {
          if (this.isNew || this.isModified('date')) {
            // Allow a 5-minute clock skew buffer
            return v >= new Date(Date.now() - 5 * 60 * 1000);
          }
          return true;
        },
        message: 'Please select a valid current or future date.'
      }
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    eventType: {
      type: String,
      enum: ['Casual Match', 'Competitive Tryout'],
      default: 'Casual Match',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    teamRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        teamStatus: {
          type: String,
          enum: ['Pending', 'Approved', 'Rejected'],
          default: 'Pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        rating: {
          type: Number,
          min: 0,
          max: 5,
          default: 0
        },
        feedback: {
          type: String,
          default: ""
        }
      },
    ],
    approvedPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxParticipants: {
      type: Number,
      default: 1,
      validate: {
        validator: function(v) {
          if (this.isNew || this.isModified('maxParticipants')) {
            return v >= 1;
          }
          return true;
        },
        message: 'Capacity must be at least 1.'
      }
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

eventSchema.pre('validate', function() {
  if (this.sport) {
    const { SPORTS } = require('../constants/sports');
    const validSport = SPORTS.find(s => s.toLowerCase() === this.sport.toLowerCase());
    if (validSport) {
      this.sport = validSport;
    }
  }
});

module.exports = mongoose.model('Event', eventSchema);
