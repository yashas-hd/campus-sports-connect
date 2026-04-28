import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    date: '',
    location: '',
    description: '',
    maxParticipants: 0,
  });
  const [error, setError] = useState('');

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchEvents = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/events', config);
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Socket.io integration
    const socket = io('http://localhost:5000');
    
    // Join personal room for notifications
    socket.emit('join_user_room', user._id);

    // Listen for new events
    socket.on('new_event', (newEvent) => {
      setEvents((prevEvents) => {
        if (!prevEvents.find(e => e._id === newEvent._id)) {
          if (newEvent.creator !== user._id) {
            toast.success(`New Event: ${newEvent.title}`);
          }
          return [...prevEvents, newEvent];
        }
        return prevEvents;
      });
    });

    socket.on('new_notification', (notification) => {
      toast.success(notification.message, { icon: '🔔' });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0
      };

      const { data } = await axios.post('http://localhost:5000/api/events', eventData, config);
      
      // Update local state (socket will also broadcast, but we can update optimistically or rely on the response)
      setEvents((prev) => {
        if (!prev.find(e => e._id === data._id)) {
          return [...prev, data];
        }
        return prev;
      });
      
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        sport: '',
        date: '',
        location: '',
        description: '',
        maxParticipants: 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
            <p className="text-gray-500 mt-1">Join sports activities happening around campus</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+ Create Event</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-500 mb-6">Be the first to create a sports event!</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-50 text-indigo-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Create New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-end">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    {event.sport}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Link to={`/events/${event._id}`} className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.title}
                    </Link>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 flex justify-center mr-2">📅</span>
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 flex justify-center mr-2">📍</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 flex justify-center mr-2">👥</span>
                      {event.participants?.length || 1} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''} participants
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold uppercase">
                        {event.creator?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-gray-600 truncate max-w-[100px]">{event.creator?.name || 'User'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/events/${event._id}`} 
                        className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors"
                      >
                        Details
                      </Link>
                      <button 
                        onClick={async () => {
                          try {
                            const config = { headers: { Authorization: `Bearer ${user.token}` } };
                            const { data } = await axios.post(`http://localhost:5000/api/events/${event._id}/join`, {}, config);
                            // Update local state
                            setEvents(events.map(e => e._id === data._id ? data : e));
                            toast.success('Successfully joined the event!');
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to join event');
                          }
                        }}
                        disabled={event.participants?.includes(user._id) || (event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants)}
                        className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {event.participants?.includes(user._id) ? 'Joined ✓' : (event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants ? 'Full' : 'RSVP &rarr;')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}
              
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="e.g., Evening Basketball Pickup"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                    <input
                      type="text"
                      name="sport"
                      required
                      value={formData.sport}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="e.g., Basketball"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder="0 for unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="e.g., Main Campus Court 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Provide details about skill level, equipment, etc."
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-event-form"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
