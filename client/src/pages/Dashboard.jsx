import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';
import { SPORTS } from '../constants/sports';


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
        let hasToken = false;
        try {
          const userInfoStr = localStorage.getItem("userInfo");
          const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
          hasToken = !!(userInfo?.token || localStorage.getItem("token"));
        } catch (e) {}

        if (!hasToken) {
          setLoading(false);
          return;
        }

        const [eventsRes, profileRes] = await Promise.all([
          axiosInstance.get('/api/events'),
          axiosInstance.get('/api/users/profile')
        ]);
        setEvents(eventsRes.data);
        setUserProfile(profileRes.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error('Failed to load dashboard');
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
          if ((newEvent.creator?._id || newEvent.creator) !== user?._id) {
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
    if (s.includes('basket')) return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
    if (s.includes('foot') || s.includes('soccer')) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (s.includes('badminton')) return 'text-teal-400 border-teal-500/20 bg-teal-500/10';
    if (s.includes('volley')) return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10';
    if (s.includes('cricket')) return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    if (s.includes('kabaddi')) return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    return 'text-slate-400 border-slate-500/20 bg-slate-500/10';
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
    if (!event) return false;
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
      statusMatch = event.participants?.some(p => p === user?._id || p?._id === user?._id) || event.creator === user?._id || event.creator?._id === user?._id;
    }
    
    return searchMatch && sportMatch && statusMatch;
  });

  const filterSportsList = ["All", ...SPORTS];
  const filterStatusList = ["All", "Upcoming", "Ongoing", "Joined"];

  const preferredSports = userProfile?.preferredSports || [];
  const recommendedEvents = events.filter(event => 
    event &&
    event?.status !== 'completed' &&
    event?.status !== 'cancelled' &&
    (preferredSports || []).some(sport => sport && sport.trim().toLowerCase() === (event?.sport || '').trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 font-sans relative overflow-hidden pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/5 blur-[150px] rounded-full z-0 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Welcome Hero Section */}
        <div className="relative overflow-hidden mb-8 rounded-2xl border border-dark-700 bg-dark-800/20 p-8 md:p-10 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-450 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Sports Network Online
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
                Welcome Back, <span className="text-blue-500">{userProfile?.name || user?.name || "Athlete"}</span> 👋
              </h1>
              <p className="text-slate-405 text-base max-w-xl font-normal leading-relaxed">
                Connect with local athletes, schedule competitive tryouts, and view performance insights across campus.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-all duration-200 flex items-center gap-2 transform active:scale-95 shadow-md shadow-blue-900/20 cursor-pointer text-sm"
            >
              <span>+</span>
              <span className="tracking-wide">Create Event</span>
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Active Events Card */}
          <div className="bg-dark-800/40 p-6 rounded-xl border border-dark-700 hover:border-blue-500/40 transition-all duration-300 shadow-md flex justify-between items-center group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Matches</p>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-500 transition-colors">
                {events.filter(e => e && e.status !== 'completed' && e.status !== 'cancelled').length}
              </h3>
            </div>
            <div className="text-2xl bg-dark-900/60 p-3 rounded-xl border border-dark-700">⚽</div>
          </div>
          
          {/* Ongoing Live Matches Card */}
          <div className="bg-dark-800/40 p-6 rounded-xl border border-dark-700 hover:border-blue-500/40 transition-all duration-300 shadow-md flex justify-between items-center group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Live Operations</p>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-500 transition-colors">
                {events.filter(e => e && e.status === 'ongoing').length + ongoingEvents.length}
              </h3>
            </div>
            <div className="text-2xl bg-dark-900/60 p-3 rounded-xl border border-dark-700">🔥</div>
          </div>

          {/* Recommended Card */}
          <div className="bg-dark-800/40 p-6 rounded-xl border border-dark-700 hover:border-blue-500/40 transition-all duration-300 shadow-md flex justify-between items-center group">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommendations</p>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-500 transition-colors">
                {recommendedEvents.length}
              </h3>
            </div>
            <div className="text-2xl bg-dark-900/60 p-3 rounded-xl border border-dark-700">✨</div>
          </div>
        </div>

        {/* Popular Sports Section */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚡</span> Popular Disciplines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {SPORTS.map((sportName, index) => {
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedSport(sportName)}
                  className="bg-dark-800/20 border border-dark-700/60 hover:border-blue-500/40 rounded-xl p-4 text-center text-slate-300 font-semibold hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 select-none"
                >
                  <div className="text-3xl mb-2">{getSportEmoji(sportName)}</div>
                  <div className="text-xs tracking-wider uppercase">{sportName}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ongoing Events Section */}
        <section className="mb-12">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingEvents.map((event, index) => (
              <div key={index} className="bg-dark-800/30 p-5 rounded-xl border border-dark-700 hover:border-slate-600 transition-all duration-300 flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-bold text-white transition-colors">{event.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${event.status === 'Live Now' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-400 font-normal mt-auto pt-4 border-t border-dark-700/60">
                  <span className="mr-1.5">📍</span>
                  {event.location}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Events Section */}
        {preferredSports.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>⭐</span> Recommended Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill().map((_, i) => (
                  <div key={i} className="bg-dark-800/30 rounded-xl p-6 border border-dark-700 animate-pulse-glow flex flex-col h-64">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 w-24 rounded-full bg-dark-700/50 animate-skeleton"></div>
                      <div className="h-6 w-20 rounded bg-dark-700/50 animate-skeleton"></div>
                    </div>
                    <div className="h-8 w-3/4 rounded mb-6 bg-dark-700/50 animate-skeleton"></div>
                    <div className="space-y-3 mt-auto">
                      <div className="h-4 w-1/2 rounded bg-dark-700/50 animate-skeleton"></div>
                      <div className="h-4 w-2/3 rounded bg-dark-700/50 animate-skeleton"></div>
                    </div>
                    <div className="h-10 w-full rounded-lg mt-6 bg-dark-700/50 animate-skeleton"></div>
                  </div>
                ))
              ) : recommendedEvents.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 bg-dark-800/20 rounded-xl border border-dark-700 shadow-inner">
                  <span className="text-3xl block mb-2 opacity-50">🤷‍♂️</span>
                  No matching recommendations found for your preferences.
                </div>
              ) : (
                recommendedEvents.slice(0, 3).map((event) => (
                  <div key={event._id} className="bg-dark-800/30 rounded-xl overflow-hidden border border-dark-700 hover:border-blue-500/40 transition-all duration-300 flex flex-col group shadow-sm">
                    <div className="p-5 flex-grow flex flex-col relative overflow-hidden">
                      <div className="mb-4 flex justify-between items-start">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${getSportBadgeColor(event.sport)}`}>
                          {getSportEmoji(event.sport)} {event.sport}
                        </span>
                        <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 tracking-wider">
                          Recommended
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-base font-bold text-white transition-colors line-clamp-2">{event.title}</h3>
                      </div>
                      
                      <div className="space-y-2 mb-5 flex-grow">
                        <div className="flex items-center text-xs text-slate-400 font-normal">
                          <span className="mr-2">📅</span>
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center text-xs text-slate-400 font-normal">
                          <span className="mr-2">📍</span>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-dark-700/60 mt-auto">
                        <Link
                          to={`/events/${event._id}`}
                          className="block text-center w-full bg-dark-900/60 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg border border-dark-700 hover:border-blue-600 transition-all duration-200 text-sm"
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
        <section className="mb-12 bg-dark-800/10 p-6 rounded-2xl border border-dark-700 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🎯</span> Operation Radar
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Scan and query current campus activities</p>
            </div>
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search sports events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600 text-sm shadow-inner"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Sport Category Filters */}
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Disciplines</span>
              <div className="flex flex-wrap gap-1.5">
                {filterSportsList.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setFilterSport(sport)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      filterSport === sport
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-dark-900 text-slate-400 border border-dark-700 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status Filters */}
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Filter status</span>
              <div className="flex flex-wrap gap-1.5">
                {filterStatusList.map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-dark-900 text-slate-400 border border-dark-700 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filtered Events List */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(6).fill().map((_, i) => (
                <div key={i} className="bg-dark-800/30 rounded-xl p-6 border border-dark-700 animate-pulse-glow flex flex-col h-64">
                  <div className="h-6 w-24 rounded-full mb-4 bg-dark-700/50 animate-skeleton"></div>
                  <div className="h-8 w-3/4 rounded mb-6 bg-dark-700/50 animate-skeleton"></div>
                  <div className="space-y-3 mt-auto">
                    <div className="h-4 w-1/2 rounded bg-dark-700/50 animate-skeleton"></div>
                    <div className="h-4 w-2/3 rounded bg-dark-700/50 animate-skeleton"></div>
                  </div>
                  <div className="h-10 w-full rounded-lg mt-6 bg-dark-700/50 animate-skeleton"></div>
                </div>
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400 bg-dark-800/30 rounded-2xl border border-dark-700 shadow-inner">
                <span className="text-4xl block mb-2 opacity-50">📭</span>
                <p className="text-base font-bold text-white mb-1">No matching events found</p>
                <p className="text-xs">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event._id} className="bg-dark-800/30 rounded-xl overflow-hidden border border-dark-700 hover:border-blue-500/40 transition-all duration-300 flex flex-col group shadow-sm">
                  <div className="p-5 flex-grow flex flex-col relative overflow-hidden">
                    
                    {/* Sport Badge */}
                    <div className="mb-4 flex justify-between items-start">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${getSportBadgeColor(event.sport)}`}>
                        {getSportEmoji(event.sport)} {event.sport}
                      </span>
                      {event.eventType === 'Competitive Tryout' && (
                        <span className="text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
                          Tryout
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <h3 className="text-base font-bold text-white transition-colors line-clamp-2">{event.title}</h3>
                    </div>
                    
                    <div className="space-y-2 mb-5 flex-grow">
                      <div className="flex items-center text-xs text-slate-400 font-normal">
                        <span className="mr-2.5">📅</span>
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center text-xs text-slate-400 font-normal">
                        <span className="mr-2.5">📍</span>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-400 font-normal">
                        <span className="mr-2.5">👑</span>
                        <span className="truncate">{event.creator?.name || 'Unknown Host'}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-dark-700/60 mt-auto">
                      <Link
                        to={`/events/${event._id}`}
                        className={`block w-full text-center font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm ${
                          event.eventType === 'Competitive Tryout' 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm' 
                            : 'bg-dark-900 hover:bg-dark-800 border border-dark-700 text-slate-200'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-dark-850 rounded-xl w-full max-w-md shadow-2xl border border-dark-700 overflow-hidden relative">
            <div className="px-6 py-4 border-b border-dark-700 flex justify-between items-center bg-dark-900">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-blue-500">⚡</span> {selectedSport} Info
              </h2>
              <button
                onClick={() => setSelectedSport(null)}
                className="text-slate-400 hover:text-white transition-all bg-dark-950 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  👥
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Players</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].players}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  ⏱️
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Duration</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  📍
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Location</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  🎒
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Equipment</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].equipment}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-dark-700 bg-dark-900 flex justify-end">
              <button
                onClick={() => setSelectedSport(null)}
                className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-dark-850 rounded-xl w-full max-w-lg shadow-2xl border border-dark-700 overflow-hidden max-h-[95vh] flex flex-col relative">
            <div className="px-6 py-4 border-b border-dark-700 flex justify-between items-center bg-dark-900 z-10">
              <h2 className="text-base font-bold text-white">Create New Event</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-all bg-dark-950 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all placeholder-slate-600 text-sm"
                    placeholder="e.g., Midnight Basketball Pickup"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Event Type</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 cursor-pointer p-3.5 rounded-lg border transition-all duration-200 text-center ${formData.eventType === 'Casual Match' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-slate-550'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Casual Match"
                        checked={formData.eventType === 'Casual Match'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-sm mb-0.5">Casual Match</span>
                      <span className="text-[10px] opacity-70">Direct Join Allowed</span>
                    </label>
                    <label className={`flex-1 cursor-pointer p-3.5 rounded-lg border transition-all duration-200 text-center ${formData.eventType === 'Competitive Tryout' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-dark-900 border-dark-700 text-slate-400 hover:border-slate-550'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Competitive Tryout"
                        checked={formData.eventType === 'Competitive Tryout'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-sm mb-0.5">Tryout / Selection</span>
                      <span className="text-[10px] opacity-70">Requires Approval</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sport</label>
                    <select
                      name="sport"
                      required
                      value={formData.sport}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all [color-scheme:dark] text-sm"
                    >
                      {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{getSportEmoji(sport)} {sport}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Capacity</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all placeholder-slate-600 text-sm"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all [color-scheme:dark] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all placeholder-slate-600 text-sm"
                    placeholder="e.g., Main Campus Court 1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Event Description</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all resize-none placeholder-slate-600 text-sm"
                    placeholder="Provide details about skill level, equipment required, etc."
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-dark-700 bg-dark-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-event-form"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
