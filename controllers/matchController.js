const Match = require('../models/Match');

exports.createMatch = async (req, res) => {
  try {
    const newMatch = new Match({ ...req.body, createdBy: req.user.id });
    const savedMatch = await newMatch.save();
    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    // Show ALL matches to everyone for history visibility
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMatch = async (req, res) => {
  try {
    const { runs, isWicket, extraType = 'none' } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Verify ownership
    if (match.createdBy && match.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this match' });
    }

    // Process top-level fields
    if (req.body.status) {
      match.status = req.body.status;
    }
    if (req.body.currentInnings) {
      match.currentInnings = req.body.currentInnings;
    }
    if (req.body.venue) {
      match.venue = req.body.venue;
    }

    if (runs !== undefined) {
      if (match.status === 'completed') {
        return res.status(400).json({ message: 'Match already completed' });
      }

      const innings = match.currentInnings;
      const team = match.teams[innings];

      const maxWickets = (match.totalPlayers || 11) - 1;
      if (team.overs >= match.totalOvers || team.wickets >= maxWickets) {
        return res.status(400).json({ message: 'Innings already completed' });
      }

      team.score += Number(runs);
      if (isWicket) team.wickets += 1;
      
      // Only increment over if it's a legal ball
      if (extraType === 'none') {
        team.overs = parseFloat((team.overs + 0.1).toFixed(1));
        if (team.overs % 1 >= 0.6) {
          team.overs = Math.floor(team.overs) + 1;
        }
      }

      match.history.push({ 
        innings, 
        runs: Number(runs), 
        isWicket: !!isWicket,
        extraType
      });

      // Auto-complete match if second innings chase succeeds or fails
      if (innings === 'teamB') {
        const teamA = match.teams.teamA;
        const target = teamA.score + 1;
        const maxWickets = (match.totalPlayers || 11) - 1;
        if (team.score >= target || team.wickets >= maxWickets || team.overs >= match.totalOvers) {
          match.status = 'completed';
        }
      }

      match.markModified('teams');
      match.markModified('history');
    }

    const updatedMatch = await match.save();
    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.undoLastBall = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Verify ownership
    if (match.createdBy && match.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to undo this match' });
    }

    if (match.history.length === 0) return res.status(400).json({ message: 'Nothing to undo' });

    const lastBall = match.history.pop();
    const team = match.teams[lastBall.innings];

    team.score -= lastBall.runs;
    if (lastBall.isWicket) team.wickets -= 1;

    // Only decrement over if it was a legal ball
    if (lastBall.extraType === 'none') {
      if (team.overs % 1 === 0) {
        team.overs = parseFloat((team.overs - 0.5).toFixed(1)); // From 1.0 to 0.5
      } else {
        team.overs = parseFloat((team.overs - 0.1).toFixed(1));
      }
    }

    match.markModified('teams');
    match.markModified('history');
    const updatedMatch = await match.save();
    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user.id;
    
    console.log(`[DELETE] Request for match ${matchId} by user ${userId}`);
    
    const match = await Match.findById(matchId);
    if (!match) {
      console.log(`[DELETE] Match ${matchId} not found`);
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify ownership: Only if match has a creator, we check it.
    // If it was created without a creator (legacy), we allow any authenticated user to delete.
    if (match.createdBy) {
      const creatorId = match.createdBy.toString();
      if (creatorId !== userId) {
        console.log(`[DELETE] Unauthorized: Match creator is ${creatorId}, but requester is ${userId}`);
        return res.status(403).json({ message: 'Unauthorized to delete this match' });
      }
    } else {
      console.log(`[DELETE] Match ${matchId} has no creator recorded. Proceeding with deletion by authenticated user ${userId}`);
    }

    await Match.findByIdAndDelete(matchId);
    console.log(`[DELETE] Match ${matchId} successfully deleted`);
    res.json({ message: 'Match deleted successfully' });
  } catch (err) {
    console.error(`[DELETE] Error deleting match ${req.params.id}:`, err.message);
    res.status(500).json({ message: err.message });
  }
};
