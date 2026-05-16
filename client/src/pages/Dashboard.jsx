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
  "🏸 Badminton",
  "🤼 Kabaddi"
];

const sportsInfo = {
  Cricket: {
    players: "11 Players",
    duration: "20 Overs",
    location: "Outdoor Ground",
    equipment: "Bat, Ball, Stumps"
  },
  Football: {
    players: "11 Players",
    duration: "90 Minutes",
    location: "Football Field",
    equipment: "Football, Goal Post"
  },
  Volleyball: {
    players: "6 Players",
    duration: "Best of 3 or 5 Sets",
    location: "Indoor Court",
    equipment: "Volleyball, Net"
  },
  Basketball: {
    players: "5 Players",
    duration: "40-48 Minutes",
    location: "Indoor/Outdoor Court",
    equipment: "Basketball, Hoops"
  },
  Badminton: {
    players: "1 or 2 Players",
    duration: "Best of 3 Games",
    location: "Indoor Court",
    equipment: "Rackets, Shuttlecock"
  },
  Kabaddi: {
    players: "7 Players",
    duration: "40 Minutes",
    location: "Kabaddi Mat",
    equipment: "None"
  }
};

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [userProfile, setUserProfile] = useState(null);

  const triggerNotification = (message) => {
    const saved = JSON.parse(localStorage.getItem('campus_notifications')) || [];
    const updated = [{ id: Date.now(), message }, ...saved];
    localStorage.setItem('campus_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('campus_notify'));
  };

  const [formData, setFormData] = useState({
    title: '',
    sport: 'Cricket',
    date: '',
    location: '',
    description: '',
    maxParticipants: 0,
    eventType: 'Casual Match',
  });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [eventsRes, profileRes] = await Promise.all([
          axiosInstance.get('/api/events'),
          axiosInstance.get('/api/users/profile')
        ]);
        setEvents(eventsRes.data);
        setUserProfile(profileRes.data);
      } catch (error) {
        toast.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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
      triggerNotification(notification.message);
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
      triggerNotification(`${eventData.sport || 'Event'} Match created successfully`);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        sport: 'Cricket',
        date: '',
        location: '',
        description: '',
        maxParticipants: 0,
        eventType: 'Casual Match',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSportBadgeColor = (sport) => {
    if(!sport) return '';
    const s = sport.toLowerCase();
    if (s.includes('basket')) return 'text-orange-400 border-orange-400 bg-orange-400/10';
    if (s.includes('foot') || s.includes('soccer')) return 'text-neon-green border-neon-green bg-neon-green/10';
    if (s.includes('badminton')) return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
    if (s.includes('volley')) return 'text-neon-pink border-neon-pink bg-neon-pink/10';
    if (s.includes('cricket')) return 'text-blue-400 border-blue-400 bg-blue-400/10';
    if (s.includes('kabaddi')) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-neon-blue border-neon-blue bg-neon-blue/10';
  };

  const getSportEmoji = (sport) => {
    if(!sport) return '🏆';
    const s = sport.toLowerCase();
    if (s.includes('basket')) return '🏀';
    if (s.includes('foot') || s.includes('soccer')) return '⚽';
    if (s.includes('badminton')) return '🏸';
    if (s.includes('volley')) return '🏐';
    if (s.includes('cricket')) return '🏏';
    if (s.includes('kabaddi')) return '🤼';
    return '🏆';
  };

  const filteredEvents = events.filter(event => {
    const searchMatch = 
      (event.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (event.sport?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (event.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const sportMatch = filterSport === 'All' || event.sport?.toLowerCase() === filterSport.toLowerCase();
    
    let statusMatch = true;
    if (filterStatus === 'Upcoming') {
      statusMatch = event.status === 'upcoming' || !event.status; // fallback if status missing
    } else if (filterStatus === 'Ongoing') {
      statusMatch = event.status === 'ongoing';
    } else if (filterStatus === 'Joined') {
      statusMatch = event.participants?.some(p => p === user._id || p._id === user._id) || event.creator === user._id;
    }
    
    return searchMatch && sportMatch && statusMatch;
  });

  const filterSportsList = ["All", "Cricket", "Football", "Volleyball", "Basketball", "Badminton", "Kabaddi"];
  const filterStatusList = ["All", "Upcoming", "Ongoing", "Joined"];

  const preferredSports = userProfile?.preferredSports || [];
  const recommendedEvents = events.filter(event => 
    event.status !== 'completed' &&
    event.status !== 'cancelled' &&
    preferredSports.some(sport => (event.sport?.toLowerCase() || '').includes(sport.toLowerCase()))
  );

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
            {sports.map((sport, index) => {
              const sportName = sport.replace(/[^a-zA-Z]/g, '').trim();
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedSport(sportName)}
                  className="bg-dark-800/80 backdrop-blur-sm border border-dark-700 hover:border-neon-blue/50 rounded-xl px-6 py-3 text-gray-200 font-bold hover:text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_5px_15px_rgba(0,243,255,0.2)] hover:-translate-y-1"
                >
                  {sport}
                </div>
              );
            })}
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

        {/* Recommended Events Section */}
        {preferredSports.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">⭐</span> Recommended Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                Array(3).fill().map((_, i) => (
                  <div key={i} className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 animate-pulse-glow flex flex-col h-64">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 w-24 rounded-full animate-skeleton"></div>
                      <div className="h-6 w-20 rounded animate-skeleton"></div>
                    </div>
                    <div className="h-8 w-3/4 rounded mb-6 animate-skeleton"></div>
                    <div className="space-y-3 mt-auto">
                      <div className="h-4 w-1/2 rounded animate-skeleton"></div>
                      <div className="h-4 w-2/3 rounded animate-skeleton"></div>
                    </div>
                    <div className="h-10 w-full rounded-lg mt-6 animate-skeleton"></div>
                  </div>
                ))
              ) : recommendedEvents.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400 bg-dark-800/40 backdrop-blur-md rounded-2xl border border-dark-700">
                  <span className="text-4xl block mb-2 opacity-50">🤷‍♂️</span>
                  No personalized recommendations yet for your favorite sports.
                </div>
              ) : (
                recommendedEvents.slice(0, 3).map((event) => (
                  <div key={event._id} className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-neon-pink/30 hover:border-neon-pink/70 transition-all duration-500 hover:-translate-y-2 shadow-[0_0_15px_rgba(255,0,255,0.1)] hover:shadow-[0_10px_30px_rgba(255,0,255,0.25)] flex flex-col group">
                    <div className="p-6 flex-grow flex flex-col relative overflow-hidden">
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neon-pink/10 blur-[50px] rounded-full group-hover:bg-neon-pink/20 transition-colors duration-700 z-0"></div>
                      
                      <div className="relative z-10 mb-3 flex justify-between items-start">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                          {event.sport}
                        </span>
                        <span className="text-[10px] font-bold bg-neon-pink/20 text-neon-pink px-2 py-1 rounded uppercase tracking-widest border border-neon-pink/30">
                          Recommended
                        </span>
                      </div>

                      <div className="relative z-10 mb-4">
                        <h3 className="text-2xl font-extrabold text-white group-hover:text-neon-pink transition-colors line-clamp-2">{event.title}</h3>
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
                      </div>
                      
                      <div className="relative z-10 pt-5 border-t border-dark-700 mt-auto">
                        <Link
                          to={`/events/${event._id}`}
                          className="block text-center w-full bg-dark-700 text-white font-bold py-3 rounded-lg hover:bg-neon-pink hover:text-dark-900 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,0,255,0.4)]"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Radar & Search Section */}
        <section className="mb-12 bg-dark-800/50 backdrop-blur-sm p-6 rounded-3xl border border-dark-700 shadow-xl">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 whitespace-nowrap">
              <span className="text-3xl">🎯</span> Radar
            </h2>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search sports events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] placeholder-gray-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            {/* Sport Category Filters */}
            <div className="flex flex-wrap gap-2">
              {filterSportsList.map(sport => (
                <button
                  key={sport}
                  onClick={() => setFilterSport(sport)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 shadow-md ${
                    filterSport === sport
                      ? 'bg-neon-blue text-dark-900 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                      : 'bg-dark-900 text-gray-400 border border-dark-600 hover:text-white hover:border-neon-blue/50'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
            
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {filterStatusList.map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 shadow-md ${
                    filterStatus === status
                      ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.4)] border border-neon-pink'
                      : 'bg-dark-900 text-gray-400 border border-dark-600 hover:text-white hover:border-neon-pink/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Filtered Events List */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array(6).fill().map((_, i) => (
                <div key={i} className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700 animate-pulse-glow flex flex-col h-64">
                  <div className="h-6 w-24 rounded-full mb-4 animate-skeleton"></div>
                  <div className="h-8 w-3/4 rounded mb-6 animate-skeleton"></div>
                  <div className="space-y-3 mt-auto">
                    <div className="h-4 w-1/2 rounded animate-skeleton"></div>
                    <div className="h-4 w-2/3 rounded animate-skeleton"></div>
                  </div>
                  <div className="h-10 w-full rounded-lg mt-6 animate-skeleton"></div>
                </div>
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400 bg-dark-800/40 backdrop-blur-md rounded-3xl border border-dark-700 shadow-inner">
                <span className="text-5xl block mb-4 opacity-50">📭</span>
                <p className="text-xl font-bold text-white mb-2">No matching events found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event._id} className="bg-dark-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-dark-700 hover:border-neon-blue/50 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-[0_10px_30px_rgba(0,243,255,0.15)] flex flex-col group">
                  <div className="p-6 flex-grow flex flex-col relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neon-blue/10 blur-[50px] rounded-full group-hover:bg-neon-pink/20 transition-colors duration-700 z-0"></div>
                    
                    {/* Sport Badge */}
                    <div className="relative z-10 mb-3 flex justify-between items-start">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                        {getSportEmoji(event.sport)} {event.sport}
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
                      <Link
                        to={`/events/${event._id}`}
                        className={`block w-full text-center font-bold py-3 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                          event.eventType === 'Competitive Tryout' 
                            ? 'bg-gradient-to-r from-neon-pink/80 to-orange-500/80 text-white hover:shadow-[0_0_15px_rgba(255,0,255,0.4)]' 
                            : 'bg-dark-700 text-white hover:bg-neon-blue hover:text-dark-900 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        }`}
                      >
                        {event.eventType === 'Competitive Tryout' ? 'View Tryout Details' : 'View Event Details'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Sport Details Modal */}
      {selectedSport && sportsInfo[selectedSport] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-dark-800 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-dark-700 overflow-hidden relative group">
            {/* Modal glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-neon-pink to-transparent opacity-50 blur-sm"></div>
            
            <div className="px-8 py-5 border-b border-dark-700 flex justify-between items-center bg-dark-800 z-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-neon-pink">⚡</span> {selectedSport}
              </h2>
              <button
                onClick={() => setSelectedSport(null)}
                className="text-gray-500 hover:text-white hover:rotate-90 transition-all duration-300 bg-dark-900 w-8 h-8 rounded-full flex items-center justify-center"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 group/item hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                  👥
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Players</p>
                  <p className="text-white font-medium">{sportsInfo[selectedSport].players}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group/item hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/30 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                  ⏱️
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-white font-medium">{sportsInfo[selectedSport].duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group/item hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                  📍
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Location</p>
                  <p className="text-white font-medium">{sportsInfo[selectedSport].location}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group/item hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                  🎒
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Equipment</p>
                  <p className="text-white font-medium">{sportsInfo[selectedSport].equipment}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-dark-700 bg-dark-800 flex justify-end">
              <button
                onClick={() => setSelectedSport(null)}
                className="w-full px-6 py-3 text-sm font-bold text-dark-900 bg-gradient-to-r from-neon-pink to-orange-500 rounded-lg hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all duration-300"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

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

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Type</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 cursor-pointer p-4 rounded-xl border transition-all duration-300 text-center ${formData.eventType === 'Casual Match' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'bg-dark-900 border-dark-700 text-gray-400 hover:border-gray-500'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Casual Match"
                        checked={formData.eventType === 'Casual Match'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block mb-1">Casual Match</span>
                      <span className="text-xs opacity-70">Direct Join Allowed</span>
                    </label>
                    <label className={`flex-1 cursor-pointer p-4 rounded-xl border transition-all duration-300 text-center ${formData.eventType === 'Competitive Tryout' ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.2)]' : 'bg-dark-900 border-dark-700 text-gray-400 hover:border-gray-500'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Competitive Tryout"
                        checked={formData.eventType === 'Competitive Tryout'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block mb-1">Tryout / Selection</span>
                      <span className="text-xs opacity-70">Requires Approval</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sport</label>
                    <select
                      name="sport"
                      required
                      value={formData.sport}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-white transition-all [color-scheme:dark]"
                    >
                      <option value="Cricket">🏏 Cricket</option>
                      <option value="Football">⚽ Football</option>
                      <option value="Basketball">🏀 Basketball</option>
                      <option value="Volleyball">🏐 Volleyball</option>
                      <option value="Badminton">🏸 Badminton</option>
                      <option value="Kabaddi">🤼 Kabaddi</option>
                    </select>
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
