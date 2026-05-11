import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';

const API = import.meta.env.VITE_API_URL;

const upcomingEvents = [
  {
    title: "Cricket Tournament",
    time: "Tomorrow • 4:00 PM",
    location: "College Ground"
  },
  {
    title: "Football Practice",
    time: "Saturday • 6:00 PM",
    location: "Main Stadium"
  },
  {
    title: "Volleyball Match",
    time: "Sunday • 5:30 PM",
    location: "Indoor Court"
  }
];

const ongoingEvents = [
  {
    title: "Basketball Match",
    status: "Live Now",
    location: "Court 1"
  },
  {
    title: "Badminton Doubles",
    status: "Ongoing",
    location: "Court 2"
  }
];

const sports = [
  "🏏 Cricket",
  "⚽ Football",
  "🏐 Volleyball",
  "🏀 Basketball",
  "🏸 Badminton"
];

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
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 bg-dark-800/60 backdrop-blur-md p-8 rounded-3xl border border-dark-700 shadow-xl">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
              Welcome back 👋
            </h1>
            <p className="text-gray-400 text-lg font-medium">Find and join sports activities happening around campus.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative px-6 py-3 font-bold text-dark-900 rounded-lg overflow-hidden bg-gradient-to-r from-neon-blue to-neon-pink hover:from-neon-pink hover:to-neon-blue transition-all duration-500 shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span>Create Event</span>
          </button>
        </div>

        {/* Popular Sports Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">⚡</span> Popular Sports
          </h2>
          <div className="flex flex-wrap gap-4">
            {sports.map((sport, index) => (
              <div key={index} className="bg-dark-800/80 backdrop-blur-sm border border-dark-700 hover:border-neon-blue/50 rounded-xl px-6 py-3 text-gray-200 font-bold hover:text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_5px_15px_rgba(0,243,255,0.2)] hover:-translate-y-1">
                {sport}
              </div>
            ))}
          </div>
        </section>

        {/* Ongoing Events Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🔥</span> Ongoing Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingEvents.map((event, index) => (
              <div key={index} className="bg-dark-800/80 backdrop-blur-sm rounded-2xl p-6 border border-dark-700 hover:border-orange-500/50 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(249,115,22,0.15)] flex flex-col relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full group-hover:bg-orange-500/20 transition-colors duration-700 z-0"></div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-orange-400 transition-colors">{event.title}</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${event.status === 'Live Now' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-orange-500/10 text-orange-500 border border-orange-500/30'}`}>
                    {event.status}
                  </span>
                </div>
                <div className="relative z-10 flex items-center text-sm text-gray-300 font-medium mt-auto pt-4 border-t border-dark-700">
                  <span className="mr-2 text-orange-400">📍</span>
                  {event.location}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🏆</span> Upcoming Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 bg-dark-800/40 backdrop-blur-md rounded-2xl border border-dark-700">
                <span className="text-4xl block mb-2 opacity-50">📡</span>
                No events on the radar. Be the first to create one!
              </div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700 hover:border-neon-blue/50 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(0,243,255,0.15)] flex flex-col group">
                  <div className="p-6 flex-grow flex flex-col relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neon-blue/10 blur-[50px] rounded-full group-hover:bg-neon-pink/20 transition-colors duration-700 z-0"></div>
                    
                    {/* Sport Badge */}
                    <div className="relative z-10 mb-3 flex justify-between items-start">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                        {event.sport}
                      </span>
                    </div>

                    <div className="relative z-10 mb-4">
                      <h3 className="text-2xl font-extrabold text-white group-hover:text-neon-blue transition-colors line-clamp-2">{event.title}</h3>
                    </div>
                    
                    <div className="relative z-10 space-y-3 mb-6 flex-grow">
                      <div className="flex items-center text-sm text-gray-300 font-medium">
                        <span className="mr-3 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">📅</span>
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center text-sm text-gray-300 font-medium">
                        <span className="mr-3 text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">📍</span>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300 font-medium">
                        <span className="mr-3 text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">👑</span>
                        <span className="truncate">{event.creator?.name || 'Unknown Host'}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 pt-5 border-t border-dark-700 mt-auto">
                      <button
                        onClick={async (e) => {
                          try {
                            const btn = e.target;
                            btn.innerText = 'Joining...';
                            await axiosInstance.post(`/api/events/${event._id}/join`, {});
                            btn.innerText = 'Joined ✓';
                            btn.className = 'w-full bg-neon-green/10 text-neon-green border border-neon-green/50 font-bold py-3 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(57,255,20,0.2)]';
                            btn.disabled = true;
                            alert("Joined Successfully!");
                          } catch (err) {
                            e.target.innerText = 'Join Event';
                            toast.error(err.response?.data?.message || 'Failed to join event');
                          }
                        }}
                        className="w-full bg-dark-700 text-white font-bold py-3 rounded-lg hover:bg-neon-blue hover:text-dark-900 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                      >
                        Join Event
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
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
