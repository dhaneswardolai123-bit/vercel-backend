const mongoose = require('mongoose');
const Match = require('./models/Match');
require('dotenv').config();

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gully-cricket');
    console.log('Connected to MongoDB');

    // 1. Create a match WITH createdBy (need a user ID)
    // I'll skip this and use the UI for "with creator" case.

    // 2. Create a match WITHOUT createdBy (legacy case)
    const legacyMatch = new Match({
      teams: {
        teamA: { name: 'Legacy A', score: 50, wickets: 5, overs: 10 },
        teamB: { name: 'Legacy B', score: 45, wickets: 8, overs: 9.4 }
      },
      status: 'completed',
      venue: 'Legacy Ground',
      totalOvers: 10,
      currentInnings: 'teamB'
    });
    const saved = await legacyMatch.save();
    console.log('Created legacy match (no creator):', saved._id);

    process.exit(0);
  } catch (err) {
    console.error('Error creating test data:', err);
    process.exit(1);
  }
}

createTestData();
