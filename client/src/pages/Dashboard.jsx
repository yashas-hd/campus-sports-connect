import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';

const API = import.meta.env.VITE_API_URL;

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

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchEvents = async () => {
      try {
        const { data } = await axiosInstance.get('/api/events');
        setEvents(data);
      } catch (error) {
        toast.error('Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Socket.io integration
    const socket = io(API);

    // Join personal room for notifications
    socket.emit('join_user_room', user._id);

    // Listen for new events
    socket.on('new_event', (newEvent) => {
      setEvents((prevEvents) => {
        if (!prevEvents.find(e => e._id === newEvent._id)) {
          if (newEvent.creator !== user._id) {
            toast.success(`New Event: ${newEvent.title}`, { icon: '🔥' });
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

    try {
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : 0
      };

      const { data } = await axiosInstance.post('/api/events', eventData);

      setEvents((prev) => {
        if (!prev.find(e => e._id === data._id)) {
          return [...prev, data];
        }
        return prev;
      });

      toast.success('Event Created Successfully!', { icon: '🏆' });
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
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSportBadgeColor = (sport) => {
    const s = sport.toLowerCase();
    if (s.includes('basket')) return 'text-orange-400 border-orange-400 bg-orange-400/10';
    if (s.includes('foot') || s.includes('soccer')) return 'text-neon-green border-neon-green bg-neon-green/10';
    if (s.includes('tennis')) return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
    if (s.includes('volley')) return 'text-neon-pink border-neon-pink bg-neon-pink/10';
    return 'text-neon-blue border-neon-blue bg-neon-blue/10';
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Campus Radar
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Discover and join sports activities around campus</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative px-6 py-3 font-bold text-dark-900 rounded-lg overflow-hidden bg-gradient-to-r from-neon-blue to-neon-pink hover:from-neon-pink hover:to-neon-blue transition-all duration-500 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span>Create Event</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-dark-800/40 backdrop-blur-md rounded-3xl p-16 text-center border border-dark-700 shadow-xl">
            <div className="mx-auto w-28 h-28 bg-dark-700/50 rounded-full flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border border-dark-600">
              <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🏆</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No events on the radar</h3>
            <p className="text-gray-400 mb-8 text-lg">Be the pioneer! Start the first sports event.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 rounded-full text-sm font-bold text-neon-blue border border-neon-blue hover:bg-neon-blue/10 transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
            >
              Start an Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event._id} className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700 hover:border-neon-blue/50 group transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(0,243,255,0.15)] flex flex-col">
                <div className="h-36 bg-dark-700 relative overflow-hidden flex items-end p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-transparent opacity-80 z-0"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-neon-blue/20 blur-[50px] rounded-full group-hover:bg-neon-pink/30 transition-colors duration-700 z-0"></div>
                  <span className={`relative z-10 border text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                    {event.sport}
                  </span>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="mb-4">
                    <Link to={`/events/${event._id}`} className="text-2xl font-extrabold text-white group-hover:text-neon-blue transition-colors line-clamp-2">
                      {event.title}
                    </Link>
                  </div>
                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center text-sm text-gray-300 font-medium">
                      <span className="w-6 flex justify-center mr-2 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">📅</span>
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-sm text-gray-300 font-medium">
                      <span className="w-6 flex justify-center mr-2 text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">📍</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-300 font-medium">
                      <span className="w-6 flex justify-center mr-2 text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">👥</span>
                      <span className="bg-dark-900 px-2 py-0.5 rounded text-xs border border-dark-700">
                        {event.participants?.length || 1} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''}
                      </span>
                      <span className="ml-2 text-gray-500">joined</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-dark-700 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-dark-900 border border-dark-600 flex items-center justify-center text-gray-300 text-sm font-bold uppercase shadow-inner">
                        {event.creator?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-400 truncate max-w-[100px]">{event.creator?.name || 'User'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            const { data } = await axiosInstance.post(`/api/events/${event._id}/join`, {});
                            setEvents(events.map(e => e._id === data._id ? data : e));
                            toast.success('Successfully joined the event!', { icon: '🎉' });
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to join event');
                          }
                        }}
                        disabled={event.participants?.includes(user._id) || (event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants)}
                        className={`text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                          event.participants?.includes(user._id) 
                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/50 cursor-default' 
                            : event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants
                              ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                              : 'bg-dark-700 text-white hover:bg-neon-blue hover:text-dark-900 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        }`}
                      >
                        {event.participants?.includes(user._id) ? 'Joined ✓' : (event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants ? 'Full' : 'RSVP')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-dark-700 overflow-hidden max-h-[90vh] flex flex-col relative">
            {/* Modal glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50 blur-sm"></div>
            
            <div className="px-8 py-5 border-b border-dark-700 flex justify-between items-center bg-dark-800 z-10">
              <h2 className="text-2xl font-bold text-white">Initialize Event</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-white hover:rotate-90 transition-all duration-300 bg-dark-900 w-8 h-8 rounded-full flex items-center justify-center"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue text-white transition-all placeholder-gray-600"
                    placeholder="e.g., Midnight Basketball Pickup"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sport</label>
                    <input
                      type="text"
                      name="sport"
                      required
                      value={formData.sport}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-white transition-all placeholder-gray-600"
                      placeholder="e.g., Basketball"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Capacity</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue text-white transition-all placeholder-gray-600"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-neon-green text-white transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue text-white transition-all placeholder-gray-600"
                    placeholder="e.g., Main Campus Court 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mission Briefing</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-white transition-all resize-none placeholder-gray-600"
                    placeholder="Provide details about skill level, equipment required, etc."
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-dark-700 bg-dark-800 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Abort
              </button>
              <button
                type="submit"
                form="create-event-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-dark-900 bg-gradient-to-r from-neon-blue to-neon-green rounded-lg hover:shadow-[0_0_15px_rgba(57,255,20,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deploying...' : 'Launch Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
