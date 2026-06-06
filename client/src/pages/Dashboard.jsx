import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import axiosInstance from '../utils/axiosInstance';
import { SPORTS } from '../constants/sports';
import { 
  FiAward, 
  FiActivity, 
  FiStar, 
  FiClock, 
  FiPlus, 
  FiMessageSquare, 
  FiUserCheck, 
  FiCompass, 
  FiMapPin, 
  FiCalendar, 
  FiSearch, 
  FiChevronRight 
} from 'react-icons/fi';

const API = import.meta.env.VITE_API_URL;

const upcomingEventsFallback = [
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

const ongoingEventsFallback = [
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

  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all'; // 'all', 'events', 'tryouts'

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
        toast.error('Failed to load dashboard data');
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
      triggerNotification(`${eventData.sport || 'Event'} ${eventData.eventType === 'Competitive Tryout' ? 'Tryout' : 'Match'} created successfully`);
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
    if (s.includes('cricket')) return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
    if (s.includes('kabaddi')) return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    return 'text-zinc-400 border-zinc-700 bg-zinc-800/40';
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
      statusMatch = event.status === 'upcoming' || !event.status;
    } else if (filterStatus === 'Ongoing') {
      statusMatch = event.status === 'ongoing';
    } else if (filterStatus === 'Joined') {
      statusMatch = event.participants?.some(p => p === user?._id || p?._id === user?._id) || event.creator === user?._id || event.creator?._id === user?._id;
    }

    let tabMatch = true;
    if (currentTab === 'events') {
      tabMatch = event.eventType === 'Casual Match' || !event.eventType;
    } else if (currentTab === 'tryouts') {
      tabMatch = event.eventType === 'Competitive Tryout';
    }
    
    return searchMatch && sportMatch && statusMatch && tabMatch;
  });

  const getRecentActivity = () => {
    const activity = [];
    events.forEach(e => {
      if (!e) return;
      if (e.comments && e.comments.length > 0) {
        e.comments.forEach(c => {
          activity.push({
            id: c._id || Math.random().toString(),
            type: 'comment',
            user: c.user?.name || 'Athlete',
            detail: `commented on "${e.title}"`,
            time: new Date(c.createdAt || Date.now())
          });
        });
      }
      if (e.participants && e.participants.length > 0) {
        e.participants.slice(0, 2).forEach(p => {
          activity.push({
            id: `${e._id}-join-${p._id || p}`,
            type: 'join',
            user: p.name || 'Athlete',
            detail: `joined "${e.title}"`,
            time: new Date(e.createdAt || Date.now() - 3600000 * 2)
          });
        });
      }
    });

    activity.sort((a, b) => b.time - a.time);

    if (activity.length === 0) {
      return [
        { id: 'act-1', type: 'system', user: 'System', detail: 'Sports portal online & ready.', time: new Date() },
        { id: 'act-2', type: 'system', user: 'System', detail: 'Tryouts tracking active.', time: new Date(Date.now() - 3600000) }
      ];
    }

    return activity.slice(0, 5);
  };

  const getUpcomingSchedule = () => {
    const list = events
      .filter(e => e && new Date(e.date) > new Date() && (currentTab === 'all' || (currentTab === 'events' && e.eventType !== 'Competitive Tryout') || (currentTab === 'tryouts' && e.eventType === 'Competitive Tryout')))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);

    if (list.length === 0) {
      return upcomingEventsFallback.map((item, idx) => ({
        _id: `fallback-${idx}`,
        title: item.title,
        date: new Date(Date.now() + 86400000 * (idx + 1)),
        location: item.location,
        isFallback: true
      }));
    }

    return list;
  };

  const filterSportsList = ["All", ...SPORTS];
  const filterStatusList = ["All", "Upcoming", "Ongoing", "Joined"];

  const preferredSports = userProfile?.preferredSports || [];
  const recommendedEvents = events.filter(event => 
    event &&
    event?.status !== 'completed' &&
    event?.status !== 'cancelled' &&
    (preferredSports || []).some(sport => sport && sport.trim().toLowerCase() === (event?.sport || '').trim().toLowerCase())
  );

  // Compute metrics based on current tab
  const getMetrics = () => {
    if (currentTab === 'events') {
      const activeMatches = events.filter(e => e && e.eventType !== 'Competitive Tryout' && e.status !== 'completed').length;
      return [
        { title: 'Casual Matches', value: activeMatches, icon: FiAward, desc: 'Active friendly fixtures' },
        { title: 'Registered Squads', value: events.filter(e => e && e.eventType !== 'Competitive Tryout' && e.participants?.some(p => p?._id === user?._id || p === user?._id)).length, icon: FiUserCheck, desc: 'Joined sport operations' },
        { title: 'Recommended Matches', value: recommendedEvents.filter(e => e.eventType !== 'Competitive Tryout').length, icon: FiStar, desc: 'Matching interests' }
      ];
    }
    if (currentTab === 'tryouts') {
      const activeTryouts = events.filter(e => e && e.eventType === 'Competitive Tryout' && e.status !== 'completed').length;
      return [
        { title: 'Active Tryouts', value: activeTryouts, icon: FiActivity, desc: 'Competitive selection gates' },
        { title: 'Submitted Applications', value: events.filter(e => e && e.eventType === 'Competitive Tryout' && e.teamRequests?.some(r => r.user === user?._id || r.user?._id === user?._id)).length, icon: FiCompass, desc: 'Awaiting host selection' },
        { title: 'Recommended gates', value: recommendedEvents.filter(e => e.eventType === 'Competitive Tryout').length, icon: FiStar, desc: 'Matching tryout fields' }
      ];
    }
    return [
      { title: 'Active Matches', value: events.filter(e => e && e.status !== 'completed' && e.status !== 'cancelled').length, icon: FiAward, desc: 'Total scheduled operations' },
      { title: 'Live Operations', value: events.filter(e => e && e.status === 'ongoing').length + ongoingEventsFallback.length, icon: FiActivity, desc: 'Currently in progress' },
      { title: 'Recommendations', value: recommendedEvents.length, icon: FiStar, desc: 'Based on preferred sports' }
    ];
  };

  const currentMetrics = getMetrics();

  return (
    <SidebarLayout>
      <div className="space-y-8 animate-fade-in-up">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                {currentTab === 'tryouts' ? 'COMPETITIVE OPERATIONS' : currentTab === 'events' ? 'CASUAL ATHLETICS FEED' : 'CAMPUS DASHBOARD'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {currentTab === 'tryouts' ? 'Tryouts Selection Center' : currentTab === 'events' ? 'Casual Sports Hub' : 'Athletic Command'}{', '}
                <span className="text-blue-500">{userProfile?.name || user?.name || "Athlete"}</span> 👋
              </h1>
              <p className="text-slate-400 text-sm max-w-xl font-normal leading-relaxed">
                {currentTab === 'tryouts' 
                  ? 'Initiate selection tryouts, manage athlete rating scorecards, and recruit top performing campus players.'
                  : currentTab === 'events' 
                  ? 'Connect with athletes, organize friendly matches, and build active sports communities.'
                  : 'Manage tryouts, schedule friendly match fixtures, and review system insights across the campus network.'}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider shadow-sm"
            >
              <FiPlus className="h-4 w-4" />
              <span>{currentTab === 'tryouts' ? 'Create Tryout' : 'Create Event'}</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {currentMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div 
                key={index} 
                className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex items-center justify-between group shadow-sm"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{metric.title}</p>
                  <h3 className="text-2xl font-extrabold text-white mb-0.5">{loading ? '...' : metric.value}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{metric.desc}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-all duration-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dashboard 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Operations Radar & Filters */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Preferred / Recommended Section (Only on main Dashboard / relevant tabs) */}
            {currentTab === 'all' && preferredSports.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span> Recommended For You
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    Array(2).fill().map((_, i) => (
                      <div key={i} className="bg-slate-900/40 rounded-xl p-5 border border-slate-800 animate-pulse h-40"></div>
                    ))
                  ) : recommendedEvents.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                      No matching events found for your preferred sports.
                    </div>
                  ) : (
                    recommendedEvents.slice(0, 2).map((event) => (
                      <div key={event._id} className="bg-slate-900/40 rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between h-40">
                        <div>
                          <div className="flex justify-between items-start mb-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getSportBadgeColor(event.sport)}`}>
                              {getSportEmoji(event.sport)} {event.sport}
                            </span>
                            <span className="text-[8px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                              MATCH
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">{event.title}</h3>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                            <FiMapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <Link
                            to={`/events/${event._id}`}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            <span>DETAILS</span>
                            <FiChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Popular Disciplines section (Only on main Dashboard / relevant tabs) */}
            {currentTab === 'all' && (
              <section className="space-y-4">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span> Recommended Sports
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {SPORTS.map((sportName, index) => (
                    <div 
                      key={index} 
                      onClick={() => setSelectedSport(sportName)}
                      className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 text-center text-slate-350 font-bold hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex flex-col items-center justify-center select-none"
                    >
                      <span className="text-2xl mb-1.5">{getSportEmoji(sportName)}</span>
                      <span className="text-[10px] tracking-wider uppercase">{sportName}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Operations Radar & Search Card */}
            <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                    <FiCompass className="h-4.5 w-4.5 text-blue-500" />
                    <span>Operations Radar</span>
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Search and filter active campus matches</p>
                </div>
                <div className="relative w-full md:max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <FiSearch className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search sports activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-0 transition-all placeholder-slate-500 text-xs shadow-inner"
                  />
                </div>
              </div>
              
              <div className="space-y-4.5">
                {/* Sport Category Filters */}
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Disciplines</span>
                  <div className="flex flex-wrap gap-1.5">
                    {filterSportsList.map(sport => (
                      <button
                        key={sport}
                        onClick={() => setFilterSport(sport)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                          filterSport === sport
                            ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status Filters */}
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Filter status</span>
                  <div className="flex flex-wrap gap-1.5">
                    {filterStatusList.map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                          filterStatus === status
                            ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
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
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array(4).fill().map((_, i) => (
                    <div key={i} className="bg-slate-900/40 rounded-xl p-5 border border-slate-800 animate-pulse h-48"></div>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 shadow-inner">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    <p className="text-sm font-bold text-white mb-1 uppercase tracking-wide">No active matching events</p>
                    <p className="text-xs text-slate-500">Try adjusting your filters or query parameters.</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div key={event._id} className="bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between group shadow-sm overflow-hidden relative">
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        
                        <div>
                          {/* Sport Badge */}
                          <div className="mb-3.5 flex justify-between items-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getSportBadgeColor(event.sport)}`}>
                              {getSportEmoji(event.sport)} {event.sport}
                            </span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              event.eventType === 'Competitive Tryout' 
                                ? 'bg-indigo-950/45 text-indigo-400 border-indigo-900/30' 
                                : 'bg-blue-950/45 text-blue-400 border-blue-900/30'
                            }`}>
                              {event.eventType === 'Competitive Tryout' ? 'Tryout' : 'Match'}
                            </span>
                          </div>

                          <div className="mb-4">
                            <h3 className="text-sm font-extrabold text-white group-hover:text-blue-500 transition-colors line-clamp-1">{event.title}</h3>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-[11px] text-slate-400 font-medium">
                              <FiCalendar className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center text-[11px] text-slate-400 font-medium">
                              <FiMapPin className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                            <div className="flex items-center text-[11px] text-slate-400 font-medium">
                              <span className="mr-2 text-xs">👑</span>
                              <span className="truncate">Host: {event.creator?.name || 'Athlete'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-800/80 mt-auto flex items-center justify-between">
                          <span className="text-[10px] text-slate-550 font-bold">
                            Squad: {event.participants?.length || 1} / {event.maxParticipants || '∞'}
                          </span>
                          <Link
                            to={`/events/${event._id}`}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              event.eventType === 'Competitive Tryout' 
                                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-900/30 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' 
                                : 'bg-blue-600/10 text-blue-400 border-blue-900/30 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                            }`}
                          >
                            {event.eventType === 'Competitive Tryout' ? 'Enter Tryout' : 'View Match'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Recent Activity & Upcoming Schedule */}
          <div className="space-y-8 lg:col-span-1">
            
            {/* Upcoming Schedule */}
            <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiClock className="h-4 w-4 text-blue-500" />
                <span>Upcoming Events</span>
              </h2>
              <div className="divide-y divide-slate-800/80 space-y-3.5">
                {getUpcomingSchedule().map((item, idx) => (
                  <div key={item._id || idx} className="pt-3.5 first:pt-0 flex flex-col gap-1 group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-500 transition-colors line-clamp-1 pr-4">{item.title}</h4>
                      {item.isFallback && (
                        <span className="text-[8px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">DEMO</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-1">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="h-3 w-3" />
                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="truncate max-w-[120px] flex items-center gap-1">
                        <FiMapPin className="h-3 w-3" />
                        {item.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity Timeline */}
            <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiActivity className="h-4 w-4 text-blue-500" />
                <span>Recent Activity</span>
              </h2>
              <div className="relative pl-3 border-l border-slate-800 space-y-6">
                {getRecentActivity().map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Circle Indicator */}
                    <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full border border-[#0f172a] bg-slate-800 group-hover:bg-blue-600 transition-colors" />
                    
                    <div>
                      <p className="text-xs text-slate-350 leading-normal">
                        <span className="font-bold text-white">{act.user}</span> {act.detail}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                        {new Date(act.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>

      {/* Sport Details Modal */}
      {selectedSport && sportsInfo[selectedSport] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-slate-900 rounded-xl w-full max-w-md shadow-2xl border border-slate-800 overflow-hidden relative">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <span className="text-blue-500">⚡</span> {selectedSport} General Info
              </h2>
              <button
                onClick={() => setSelectedSport(null)}
                className="text-slate-400 hover:text-white transition-all bg-slate-950 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border border-slate-800"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sm">
                  👥
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Squad Count</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].players}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sm">
                  ⏱️
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration Limit</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sm">
                  📍
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Arena Type</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sm">
                  🎒
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Equipment Requirements</p>
                  <p className="text-white text-xs font-semibold">{sportsInfo[selectedSport].equipment}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedSport(null)}
                className="w-full px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-slate-900 rounded-xl w-full max-w-lg shadow-2xl border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col relative">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-10">
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Create New Athletic Event</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-all bg-slate-950 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border border-slate-800"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all placeholder-slate-500 text-xs"
                    placeholder="e.g., Weekend Friendly Football"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Mode / Selection Type</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 cursor-pointer p-3 rounded-lg border transition-all duration-200 text-center ${formData.eventType === 'Casual Match' ? 'bg-blue-500/5 border-blue-500/30 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Casual Match"
                        checked={formData.eventType === 'Casual Match'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-xs mb-0.5">Casual Match</span>
                      <span className="text-[9px] opacity-70">Direct Squad RSVP</span>
                    </label>
                    <label className={`flex-1 cursor-pointer p-3 rounded-lg border transition-all duration-200 text-center ${formData.eventType === 'Competitive Tryout' ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input
                        type="radio"
                        name="eventType"
                        value="Competitive Tryout"
                        checked={formData.eventType === 'Competitive Tryout'}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="font-bold block text-xs mb-0.5">Tryout / Selection</span>
                      <span className="text-[9px] opacity-70">Requires Approval</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sport</label>
                    <select
                      name="sport"
                      required
                      value={formData.sport}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all [color-scheme:dark] text-xs"
                    >
                      {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{getSportEmoji(sport)} {sport}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Participants</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all placeholder-slate-500 text-xs"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all [color-scheme:dark] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arena location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all placeholder-slate-500 text-xs"
                    placeholder="e.g., Main Arena, Turf 1"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Description</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-white transition-all resize-none placeholder-slate-500 text-xs"
                    placeholder="Specify requirements, gear, and athlete skill levels..."
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-event-form"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default Dashboard;
