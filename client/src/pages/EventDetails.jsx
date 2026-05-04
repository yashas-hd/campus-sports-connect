import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';

const API = import.meta.env.VITE_API_URL;

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchEventDetails = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/events/${id}`);
        setEvent(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Event not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();

    // Socket.io integration
    const socket = io(API);
    socket.emit('join_user_room', user._id);

    socket.on('new_notification', (notification) => {
      toast.success(notification.message, { icon: '🔔' });
      // If notification is about this event, we could refresh details
      if (notification.event === id) {
        fetchEventDetails();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, user, navigate]);

  const handleRSVP = async () => {
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/join`, {});
      
      const updatedEvent = await axiosInstance.get(`/api/events/${event._id}`);
      setEvent(updatedEvent.data);
      toast.success('Successfully enlisted in operation!', { icon: '🎖️' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join event');
    }
  };

  const getSportBadgeColor = (sport) => {
    if(!sport) return '';
    const s = sport.toLowerCase();
    if (s.includes('basket')) return 'text-orange-400 border-orange-400 bg-orange-400/10';
    if (s.includes('foot') || s.includes('soccer')) return 'text-neon-green border-neon-green bg-neon-green/10';
    if (s.includes('tennis')) return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
    if (s.includes('volley')) return 'text-neon-pink border-neon-pink bg-neon-pink/10';
    return 'text-neon-blue border-neon-blue bg-neon-blue/10';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 font-sans flex flex-col relative">
        <Navbar />
        <div className="flex-1 flex justify-center items-center relative z-10">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-dark-900 font-sans flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex justify-center items-center p-4 relative z-10">
          <div className="bg-dark-800/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-red-500/30 text-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
            <span className="text-6xl block mb-6 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">⚠️</span>
            <h2 className="text-2xl font-bold text-white mb-2">Operation Aborted</h2>
            <p className="text-gray-400 mb-8">{error || 'Event data corrupted or not found'}</p>
            <Link to="/dashboard" className="bg-dark-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-dark-600 transition-colors border border-dark-600 inline-block">
              Return to Base
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isParticipating = event.participants?.some(p => p._id === user._id);
  const isCreator = event.creator?._id === user._id;
  const isFull = event.maxParticipants > 0 && event.participants?.length >= event.maxParticipants;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-neon-blue rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-neon-green rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob" style={{ animationDelay: '3s' }}></div>

      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-neon-blue mb-6 transition-colors uppercase tracking-widest">
          &larr; Return to Radar
        </Link>

        <div className="bg-dark-800/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-dark-700">
          {/* Header Banner */}
          <div className="h-56 bg-dark-700 p-8 flex flex-col justify-end relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-blue/10 blur-[60px] group-hover:bg-neon-pink/10 transition-colors duration-1000 z-0"></div>
            
            <div className="relative z-20 animate-fade-in-up">
              <span className={`inline-block mb-3 border text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                {event.sport}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight leading-tight">{event.title}</h1>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-10">
                <section>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-dark-700 pb-3 mb-5">Mission Briefing</h2>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base bg-dark-900/50 p-6 rounded-2xl border border-dark-700 shadow-inner">
                    {event.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-dark-700 pb-3 mb-5">Intel</h2>
                  <div className="space-y-6">
                    <div className="flex items-start bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center text-xl shadow-inner text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                        📅
                      </div>
                      <div className="ml-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Timeframe</p>
                        <p className="text-base font-bold text-white">
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-neon-pink font-medium mt-0.5">
                          {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center text-xl shadow-inner text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
                        📍
                      </div>
                      <div className="ml-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Coordinates</p>
                        <p className="text-base font-bold text-white">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start bg-dark-900/50 p-4 rounded-2xl border border-dark-700">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center text-xl shadow-inner text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                        👑
                      </div>
                      <div className="ml-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Commander</p>
                        <p className="text-base font-bold text-white">{event.creator?.name}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{event.creator?.college}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Participants & Action */}
              <div className="space-y-6">
                <div className="bg-dark-900/80 p-6 rounded-2xl border border-dark-700 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">Squad</h3>
                    <span className="text-xs font-bold bg-dark-800 px-3 py-1.5 rounded-lg text-gray-300 border border-dark-600 shadow-inner flex items-center gap-2">
                      <span className="text-neon-blue">👥</span>
                      {event.participants?.length} / {event.maxParticipants || '∞'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-8 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                    {event.participants?.map(p => (
                      <div key={p._id} className="flex items-center gap-3 bg-dark-800/50 p-3 rounded-xl border border-dark-600 hover:border-dark-500 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-dark-900 border border-dark-600 flex items-center justify-center text-gray-300 text-sm font-bold uppercase flex-shrink-0 shadow-inner">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">
                            {p.name} 
                            {p._id === event.creator?._id && <span className="text-[10px] bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded ml-2 uppercase tracking-wider">Host</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{p.college}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isCreator && (
                    <button
                      onClick={handleRSVP}
                      disabled={isParticipating || isFull}
                      className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 uppercase tracking-wider ${
                        isParticipating
                          ? 'bg-neon-green/10 border border-neon-green/50 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                          : isFull
                          ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600'
                          : 'bg-gradient-to-r from-neon-blue to-neon-pink text-dark-900 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)]'
                      }`}
                    >
                      {isParticipating ? '✓ Enlisted' : isFull ? 'Squad Full' : 'Enlist Now'}
                    </button>
                  )}
                  {isCreator && (
                    <div className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-neon-blue bg-neon-blue/10 text-center border border-neon-blue/30 uppercase tracking-wider shadow-[inset_0_0_10px_rgba(0,243,255,0.1)]">
                      You are Commander
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetails;
