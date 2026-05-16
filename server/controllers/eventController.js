const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('creator', 'name college').sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    const { title, sport, date, location, description, maxParticipants, eventType } = req.body;

    const allowedSports = ['Cricket', 'Football', 'Basketball', 'Volleyball', 'Badminton', 'Kabaddi'];
    if (!allowedSports.includes(sport)) {
      return res.status(400).json({ message: 'Only approved campus sports are allowed.' });
    }

    const event = await Event.create({
      title,
      sport,
      date,
      location,
      description,
      maxParticipants,
      eventType: eventType || 'Casual Match',
      creator: req.user._id,
      participants: [req.user._id], // Creator is automatically a participant
    });

    // We can emit a socket event to all clients about the new event
    const io = req.app.get('io');
    io.emit('new_event', event);

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join an event
// @route   POST /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already a participant
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already participating in this event' });
    }

    // Check if event is full
    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is already full' });
    }

    event.participants.push(req.user._id);
    await event.save();

    // Add event ID into logged-in user's joinedEvents array
    const user = await User.findById(req.user._id);
    if (!user.joinedEvents.includes(event._id)) {
      user.joinedEvents.push(event._id);
      await user.save();
    }

    // Create notification for creator
    if (event.creator.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.create({
          recipient: event.creator,
          sender: req.user._id,
          event: event._id,
          type: 'new_participant',
          message: `${req.user.name} joined your event: ${event.title}`,
        });

        // Emit socket event to the creator's room
        const io = req.app.get('io');
        io.to(event.creator.toString()).emit('new_notification', notification);
      } catch (err) {
        console.error('Notification creation failed:', err);
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to event
// @route   POST /api/events/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!req.body.text || req.body.text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    event.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await event.save();

    // Re-fetch to populate the user details for the new comment
    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name');

    res.status(201).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply for Tryout
// @route   POST /api/events/:id/apply
// @access  Private
const applyForTryout = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.eventType !== 'Competitive Tryout') {
      return res.status(400).json({ message: 'This event is not a tryout' });
    }

    if (!req.user.preferredSports || !req.user.preferredSports.includes(event.sport)) {
      return res.status(400).json({ message: 'You can only apply for tryouts matching your selected preferred sports.' });
    }

    const alreadyApplied = event.teamRequests.some(r => r.user.toString() === req.user._id.toString());
    const alreadyApproved = event.approvedPlayers.includes(req.user._id);

    if (alreadyApplied || alreadyApproved || event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already applied or joined this event' });
    }

    event.teamRequests.push({ user: req.user._id, teamStatus: 'Pending' });
    await event.save();

    // Create notification for creator
    if (event.creator.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.create({
          recipient: event.creator,
          sender: req.user._id,
          event: event._id,
          type: 'new_applicant',
          message: `${req.user.name} applied for tryouts: ${event.title}`,
        });
        const io = req.app.get('io');
        io.to(event.creator.toString()).emit('new_notification', notification);
      } catch (err) {
        console.error('Notification creation failed:', err);
      }
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve Player
// @route   POST /api/events/:id/approve/:userId
// @access  Private
const approvePlayer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can approve players' });
    }

    const targetUserId = req.params.userId;
    const requestIndex = event.teamRequests.findIndex(r => r.user.toString() === targetUserId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event capacity reached' });
    }

    // Update status
    event.teamRequests[requestIndex].teamStatus = 'Approved';

    if (!event.approvedPlayers.includes(targetUserId)) {
      event.approvedPlayers.push(targetUserId);
    }
    
    if (!event.participants.includes(targetUserId)) {
      event.participants.push(targetUserId);
    }

    await event.save();

    // Add event ID into target user's joinedEvents
    const targetUser = await User.findById(targetUserId);
    if (targetUser && !targetUser.joinedEvents.includes(event._id)) {
      targetUser.joinedEvents.push(event._id);
      await targetUser.save();
    }

    // Notify user
    try {
      const notification = await Notification.create({
        recipient: targetUserId,
        sender: req.user._id,
        event: event._id,
        type: 'player_approved',
        message: `You were approved for the team: ${event.title}!`,
      });
      const io = req.app.get('io');
      io.to(targetUserId).emit('new_notification', notification);
    } catch (err) {
      console.error('Notification creation failed:', err);
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject Player
// @route   POST /api/events/:id/reject/:userId
// @access  Private
const rejectPlayer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can reject players' });
    }

    const targetUserId = req.params.userId;
    const requestIndex = event.teamRequests.findIndex(r => r.user.toString() === targetUserId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    event.teamRequests[requestIndex].teamStatus = 'Rejected';
    await event.save();

    try {
      const notification = await Notification.create({
        recipient: targetUserId,
        sender: req.user._id,
        event: event._id,
        type: 'player_rejected',
        message: `Your application for ${event.title} was not accepted at this time.`,
      });
      const io = req.app.get('io');
      io.to(targetUserId).emit('new_notification', notification);
    } catch (err) {
      console.error('Notification creation failed:', err);
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can delete this event' });
    }

    // Clean up joinedEvents array for all participants
    await User.updateMany(
      { joinedEvents: event._id },
      { $pull: { joinedEvents: event._id } }
    );

    // Delete related notifications
    await Notification.deleteMany({ event: event._id });

    await event.deleteOne();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw Application / Leave Team
// @route   POST /api/events/:id/withdraw
// @access  Private
const withdrawApplication = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user._id.toString();

    // Remove from teamRequests
    event.teamRequests = event.teamRequests.filter(r => r.user.toString() !== userId);

    // Remove from approvedPlayers
    event.approvedPlayers = event.approvedPlayers.filter(p => p.toString() !== userId);

    // Remove from participants
    event.participants = event.participants.filter(p => p.toString() !== userId);

    await event.save();

    // Remove from user's joinedEvents
    const user = await User.findById(req.user._id);
    if (user && user.joinedEvents.includes(event._id)) {
      user.joinedEvents.pull(event._id);
      await user.save();
    }

    try {
      if (event.creator.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          recipient: event.creator,
          sender: req.user._id,
          event: event._id,
          type: 'withdraw_application',
          message: `${req.user.name} withdrew from the team: ${event.title}`,
        });
        const io = req.app.get('io');
        io.to(event.creator.toString()).emit('new_notification', notification);
      }
    } catch (err) {
      console.error('Notification creation failed:', err);
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a player from an event (Host only)
// @route   POST /api/events/:id/remove/:userId
// @access  Private
const removePlayer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can remove players' });
    }

    const userIdToRemove = req.params.userId;

    if (userIdToRemove === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot remove yourself' });
    }

    // Remove from teamRequests
    event.teamRequests = event.teamRequests.filter(r => r.user.toString() !== userIdToRemove);

    // Remove from approvedPlayers
    event.approvedPlayers = event.approvedPlayers.filter(p => p.toString() !== userIdToRemove);

    // Remove from participants
    event.participants = event.participants.filter(p => p.toString() !== userIdToRemove);

    await event.save();

    // Remove from user's joinedEvents
    const user = await User.findById(userIdToRemove);
    if (user && user.joinedEvents.includes(event._id)) {
      user.joinedEvents.pull(event._id);
      await user.save();
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate Player
// @route   POST /api/events/:id/rate/:userId
// @access  Private
const ratePlayer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can rate players' });
    }

    const targetUserId = req.params.userId;
    const { rating, feedback } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const requestIndex = event.teamRequests.findIndex(r => r.user.toString() === targetUserId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Applicant not found in team requests' });
    }

    if (event.teamRequests[requestIndex].teamStatus !== 'Approved') {
      return res.status(400).json({ message: 'Only approved players can be rated' });
    }

    event.teamRequests[requestIndex].rating = rating;
    if (feedback !== undefined) {
      event.teamRequests[requestIndex].feedback = feedback;
    }

    await event.save();

    // Send notification
    try {
      const notification = await Notification.create({
        recipient: targetUserId,
        sender: req.user._id,
        event: event._id,
        type: 'player_rated',
        message: `You received a ${rating}-star rating for ${event.title}`,
      });
      const io = req.app.get('io');
      io.to(targetUserId.toString()).emit('new_notification', notification);
    } catch (err) {
      console.error('Notification creation failed:', err);
    }

    const updatedEvent = await Event.findById(req.params.id)
      .populate('creator', 'name college bio')
      .populate('participants', 'name college')
      .populate('comments.user', 'name')
      .populate('teamRequests.user', 'name email college preferredSports preferredPosition experienceLevel')
      .populate('approvedPlayers', 'name college preferredSports preferredPosition');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  getEventById,
  joinEvent,
  addComment,
  applyForTryout,
  approvePlayer,
  rejectPlayer,
  deleteEvent,
  withdrawApplication,
  removePlayer,
  ratePlayer,
};
