const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, updateFavoriteSports } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/favorite-sports')
  .put(protect, updateFavoriteSports);

module.exports = router;
