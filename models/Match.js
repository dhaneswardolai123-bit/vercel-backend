const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  teams: {
    teamA: { name: String, score: { type: Number, default: 0 }, wickets: { type: Number, default: 0 }, overs: { type: Number, default: 0 } },
    teamB: { name: String, score: { type: Number, default: 0 }, wickets: { type: Number, default: 0 }, overs: { type: Number, default: 0 } }
  },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  venue: String,
  totalOvers: Number,
  totalPlayers: { type: Number, default: 11 },
  currentInnings: { type: String, enum: ['teamA', 'teamB'], default: 'teamA' },
  history: [{
    innings: String,
    runs: Number,
    isWicket: { type: Boolean, default: false },
    extraType: { type: String, enum: ['none', 'NB', 'WD'], default: 'none' },
    timestamp: { type: Date, default: Date.now }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
