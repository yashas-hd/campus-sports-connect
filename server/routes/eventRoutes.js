const express = require('express');
const router = express.Router();
const { getEvents, createEvent, getEventById, joinEvent, addComment, applyForTryout, approvePlayer, rejectPlayer, deleteEvent, withdrawApplication, removePlayer, ratePlayer } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .delete(protect, deleteEvent);

router.route('/:id/join')
  .post(protect, joinEvent);

router.route('/:id/withdraw')
  .post(protect, withdrawApplication);

router.route('/:id/remove/:userId')
  .post(protect, removePlayer);

router.route('/:id/rate/:userId')
  .post(protect, ratePlayer);

router.route('/:id/comment')
  .post(protect, addComment);

router.route('/:id/apply')
  .post(protect, applyForTryout);

router.route('/:id/approve/:userId')
  .post(protect, approvePlayer);

router.route('/:id/reject/:userId')
  .post(protect, rejectPlayer);

module.exports = router;
