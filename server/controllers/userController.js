const User = require('../models/User');
const Event = require('../models/Event');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Find events the user is hosting
      const hostedEvents = await Event.find({ creator: user._id }).sort({ date: 1 });
      
      // Find events the user has joined (but not hosting)
      const joinedEvents = await Event.find({
        participants: user._id,
        creator: { $ne: user._id }
      }).sort({ date: 1 });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        bio: user.bio,
        sportsInterests: user.sportsInterests,
        hostedEvents,
        joinedEvents,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.sportsInterests = req.body.sportsInterests || user.sportsInterests;

      // Handle password update if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        college: updatedUser.college,
        bio: updatedUser.bio,
        sportsInterests: updatedUser.sportsInterests,
        isVerified: updatedUser.isVerified,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
