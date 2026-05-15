const express = require('express');
const router = express.Router();
const { getEvents, createEvent, getEventById, joinEvent, addComment, applyForTryout, approvePlayer, rejectPlayer } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/:id')
  .get(protect, getEventById);

router.route('/:id/join')
  .post(protect, joinEvent);

router.route('/:id/comment')
  .post(protect, addComment);

router.route('/:id/apply')
  .post(protect, applyForTryout);

router.route('/:id/approve/:userId')
  .post(protect, approvePlayer);

router.route('/:id/reject/:userId')
  .post(protect, rejectPlayer);

module.exports = router;
