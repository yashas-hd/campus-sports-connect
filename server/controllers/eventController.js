const Event = require('../models/Event');
const Notification = require('../models/Notification');

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
    const { title, sport, date, location, description, maxParticipants } = req.body;

    const event = await Event.create({
      title,
      sport,
      date,
      location,
      description,
      maxParticipants,
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
      .populate('participants', 'name college');

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

    // Create notification for creator
    if (event.creator.toString() !== req.user._id.toString()) {
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
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  getEventById,
  joinEvent,
};
