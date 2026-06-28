const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/', matchController.getMatches);
router.post('/', auth, matchController.createMatch);
router.get('/:id', matchController.getMatchById);
router.put('/:id', auth, matchController.updateMatch);
router.post('/:id/undo', auth, matchController.undoLastBall);
router.delete('/:id', auth, matchController.deleteMatch);

module.exports = router;
