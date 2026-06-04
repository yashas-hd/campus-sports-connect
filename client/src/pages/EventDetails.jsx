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
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [processingActionId, setProcessingActionId] = useState(null);
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
    setProcessingActionId('rsvp');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/join`, {});
      
      const updatedEvent = await axiosInstance.get(`/api/events/${event._id}`);
      setEvent(updatedEvent.data);
      toast.success('Successfully enlisted in operation!', { icon: '🎖️' });
      
      const saved = JSON.parse(localStorage.getItem('campus_notifications')) || [];
      const updated = [{ id: Date.now(), message: `You joined ${event.title}` }, ...saved];
      localStorage.setItem('campus_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('campus_notify'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join event');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleApplyTryout = async () => {
    setProcessingActionId('apply');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/apply`, {});
      setEvent(data);
      toast.success('Tryout application submitted!', { icon: '📝' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleApprovePlayer = async (userId) => {
    setProcessingActionId(userId + '-approve');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/approve/${userId}`, {});
      setEvent(data);
      toast.success('Player approved for the team!', { icon: '🟢' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve player');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleRejectPlayer = async (userId) => {
    setProcessingActionId(userId + '-reject');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/reject/${userId}`, {});
      setEvent(data);
      toast.success('Player rejected.', { icon: '🔴' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject player');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to abort and delete this operation? This action cannot be undone.')) {
      setProcessingActionId('delete');
      try {
        await axiosInstance.delete(`/api/events/${event._id}`);
        toast.success('Event deleted successfully!', { icon: '🗑️' });
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete event');
      } finally {
        setProcessingActionId(null);
      }
    }
  };

  const handleRemovePlayer = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to remove ${userName} from the squad?`)) {
      setProcessingActionId(userId + '-remove');
      try {
        const { data } = await axiosInstance.post(`/api/events/${event._id}/remove/${userId}`, {});
        setEvent(data);
        toast.success(`${userName} was removed from the squad`, { icon: '👢' });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to remove player');
      } finally {
        setProcessingActionId(null);
      }
    }
  };

  const handleWithdraw = async () => {
    setProcessingActionId('withdraw');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/withdraw`, {});
      setEvent(data);
      toast.success(isApproved || isParticipating ? 'You left the team' : 'Application withdrawn successfully', { icon: '🚪' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleRatePlayer = async (userId, rating, feedback) => {
    setProcessingActionId(userId + '-rate');
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/rate/${userId}`, { rating, feedback });
      setEvent(data);
      toast.success('Player rating saved!', { icon: '⭐' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rating');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const { data } = await axiosInstance.post(`/api/events/${event._id}/comment`, {
        text: commentText
      });
      setEvent(data); // update event with new comment array
      setCommentText('');
      toast.success('Comment posted successfully!', { icon: '💬' });

      const saved = JSON.parse(localStorage.getItem('campus_notifications')) || [];
      const updated = [{ id: Date.now(), message: "New comment added successfully" }, ...saved];
      localStorage.setItem('campus_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('campus_notify'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const getSportBadgeColor = (sport) => {
    if(!sport) return '';
    const s = sport.toLowerCase();
    if (s.includes('basket')) return 'text-orange-400 border-orange-400/30 bg-orange-400/10 shadow-[0_0_15px_rgba(251,146,60,0.1)]';
    if (s.includes('foot') || s.includes('soccer')) return 'text-neon-green border-neon-green/30 bg-neon-green/10 shadow-[0_0_15px_rgba(57,255,20,0.1)]';
    if (s.includes('badminton')) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.1)]';
    if (s.includes('volley')) return 'text-neon-pink border-neon-pink/30 bg-neon-pink/10 shadow-[0_0_15px_rgba(255,0,255,0.1)]';
    if (s.includes('cricket')) return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.1)]';
    if (s.includes('kabaddi')) return 'text-red-500 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
    return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.1)]';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 font-sans flex flex-col relative overflow-hidden">
        <div className="absolute top-24 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <Navbar />
        <div className="flex-1 flex justify-center items-center relative z-10">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-dark-900 font-sans flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex justify-center items-center p-4 relative z-10">
          <div className="bg-dark-800/40 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-red-500/30 text-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
            <span className="text-6xl block mb-6 drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]">⚠️</span>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Operation Failed</h2>
            <p className="text-gray-400 mb-8 text-sm">{error || 'Event data corrupted or not found'}</p>
            <Link to="/dashboard" className="bg-dark-800 border border-dark-700/80 text-white px-6 py-3 rounded-xl text-xs font-bold hover:text-neon-blue hover:border-neon-blue/40 transition-all duration-300 inline-block cursor-pointer">
              Return to Base
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isParticipating = event?.participants?.some(p => p?._id === user?._id || p === user?._id) || false;
  const isCreator = event?.creator?._id === user?._id || event?.creator === user?._id || false;
  const isFull = event?.maxParticipants > 0 && (event?.participants?.length || 0) >= event?.maxParticipants;
  const isCompetitiveTryout = event?.eventType === 'Competitive Tryout';
  const myRequest = event?.teamRequests?.find(r => r && (r.user?._id === user?._id || r.user === user?._id));
  const hasApplied = !!myRequest;
  const myTeamStatus = myRequest?.teamStatus;
  const isApproved = event?.approvedPlayers?.some(p => p?._id === user?._id || p === user?._id) || false;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Decorative Blob Glows */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-[450px] h-[450px] bg-neon-pink/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <Link to="/dashboard" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-neon-blue mb-6 transition-colors uppercase tracking-widest cursor-pointer">
          &larr; Return to Radar
        </Link>
 
        <div className="bg-dark-800/30 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-dark-700/80 hover:border-dark-700 transition-all duration-300">
          {/* Header Banner */}
          <div className="min-h-56 bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 p-8 md:p-10 flex flex-col justify-end relative overflow-hidden group border-b border-dark-700/80">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-blue/5 blur-[70px] group-hover:bg-neon-pink/5 transition-colors duration-1000 z-0"></div>
            
            <div className="relative z-20 animate-fade-in-up">
              <span className={`inline-block mb-3.5 border text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md ${getSportBadgeColor(event.sport)}`}>
                {getSportEmoji(event.sport)} {event.sport}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md tracking-tight leading-tight">{event.title}</h1>
            </div>
          </div>
 
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-10">
                <section>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-dark-700/60 pb-3 mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-blue"></span> Mission Briefing
                  </h2>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base bg-dark-900/40 p-6 rounded-2xl border border-dark-700/50 shadow-inner">
                    {event.description}
                  </p>
                </section>
 
                <section>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-dark-700/60 pb-3 mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-pink"></span> Intel Details
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start bg-dark-900/40 p-4 rounded-2xl border border-dark-700/50 hover:border-dark-600 transition-all duration-300">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800/80 border border-dark-700/80 flex items-center justify-center text-xl shadow-inner text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,255,0.2)]">
                        📅
                      </div>
                      <div className="ml-5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Timeframe</p>
                        <p className="text-sm md:text-base font-bold text-white">
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs md:text-sm text-neon-pink font-medium mt-0.5">
                          {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start bg-dark-900/40 p-4 rounded-2xl border border-dark-700/50 hover:border-dark-600 transition-all duration-300">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800/80 border border-dark-700/80 flex items-center justify-center text-xl shadow-inner text-neon-green drop-shadow-[0_0_5px_rgba(57,255,20,0.2)]">
                        📍
                      </div>
                      <div className="ml-5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Coordinates</p>
                        <p className="text-sm md:text-base font-bold text-white">{event.location}</p>
                      </div>
                    </div>
 
                    <div className="flex items-start bg-dark-900/40 p-4 rounded-2xl border border-dark-700/50 hover:border-dark-600 transition-all duration-300">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-dark-800/80 border border-dark-700/80 flex items-center justify-center text-xl shadow-inner text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.2)]">
                        👑
                      </div>
                      <div className="ml-5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Commander / Host</p>
                        <p className="text-sm md:text-base font-bold text-white">{event.creator?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.creator?.college}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
 
              {/* Right Column: Participants & Action */}
              <div className="space-y-6">
                
                {/* Host Review Panel */}
                {isCreator && isCompetitiveTryout && (
                  <div className="bg-dark-900/40 p-5 md:p-6 rounded-2xl border border-neon-pink/30 shadow-[0_0_15px_rgba(255,0,255,0.05)]">
                    <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                      <span className="text-neon-pink">📋</span> Review Board ({event.teamRequests?.filter(r => r.teamStatus === 'Pending').length || 0})
                    </h3>
                    
                    {(!event.teamRequests || event.teamRequests.length === 0) ? (
                      <p className="text-gray-500 text-xs italic">No tryout applications yet.</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                        {event.teamRequests?.map(req => (
                          <div key={req._id} className="bg-dark-800/60 p-4 rounded-xl border border-dark-700/60 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-xs font-bold text-white">{req.user?.name}</h4>
                                <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{req.user?.college}</p>
                              </div>
                              {req.teamStatus === 'Pending' && <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pending</span>}
                              {req.teamStatus === 'Approved' && <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">Approved</span>}
                              {req.teamStatus === 'Rejected' && <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Rejected</span>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 mt-2 bg-dark-900/60 p-2.5 rounded-lg border border-dark-700/50">
                              <div>
                                <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Sports</span>
                                <span className="text-[10px] text-gray-300 font-medium truncate block max-w-[80px]">{req.user?.preferredSports?.join(', ') || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Position</span>
                                <span className="text-[10px] text-gray-300 font-medium truncate block max-w-[80px]">{req.user?.preferredPosition || 'N/A'}</span>
                              </div>
                              <div className="col-span-2 mt-1 border-t border-dark-700/40 pt-1 flex justify-between">
                                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Experience</span>
                                <span className="text-[10px] text-neon-blue font-bold">{req.user?.experienceLevel || 'Beginner'}</span>
                              </div>
                            </div>
                            
                            {req.teamStatus === 'Pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApprovePlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1.5 text-[10px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/30 rounded hover:bg-neon-green hover:text-dark-900 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                  {processingActionId === req.user._id + '-approve' ? '...' : 'Accept'}
                                </button>
                                <button 
                                  onClick={() => handleRejectPlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1.5 text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50 cursor-pointer"
                                >
                                  {processingActionId === req.user._id + '-reject' ? '...' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
 
                <div className="bg-dark-900/40 p-5 md:p-6 rounded-2xl border border-dark-700/80 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-base tracking-wide">
                      {isCompetitiveTryout ? '⭐ Team Roster' : 'Active Squad'}
                    </h3>
                    <span className="text-[10px] font-bold bg-dark-800/80 px-2.5 py-1 rounded-xl text-gray-300 border border-dark-700/60 shadow-inner flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse-glow"></span>
                      {event.participants?.length} / {event.maxParticipants || '∞'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {event.participants?.map(p => (
                      <div key={p._id} className="flex flex-col gap-2.5 bg-dark-800/40 p-3 rounded-xl border border-dark-750 hover:border-dark-650 transition-colors">
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-center text-gray-300 text-xs font-bold uppercase flex-shrink-0 shadow-inner">
                              {p.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">
                                {p.name} 
                                {p._id === event.creator?._id && <span className="text-[8px] bg-neon-blue/20 text-neon-blue px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider font-semibold">Host</span>}
                              </p>
                              <p className="text-[9px] text-gray-500 truncate mt-0.5">{p.college}</p>
                            </div>
                          </div>
                          {isCreator && p._id !== event.creator?._id && (
                            <button
                              onClick={() => handleRemovePlayer(p._id, p.name)}
                              disabled={processingActionId === p._id + '-remove'}
                              className="ml-2 w-7 h-7 flex-shrink-0 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                              title="Remove Player"
                            >
                              {processingActionId === p._id + '-remove' ? '...' : '×'}
                            </button>
                          )}
                        </div>
                        
                        {isCompetitiveTryout && p._id !== event.creator?._id && (
                          <div className="w-full">
                            <PlayerRating 
                              reqData={event.teamRequests?.find(r => r.user?._id === p._id || r.user === p._id)} 
                              isCreator={isCreator} 
                              userId={p._id} 
                              onRate={handleRatePlayer} 
                              processingActionId={processingActionId} 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!isCreator && (
                    <>
                      {!isCompetitiveTryout ? (
                        isParticipating ? (
                          <div className="space-y-3">
                            <div className="w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-lg uppercase tracking-widest text-center bg-neon-green/10 border border-neon-green/40 text-neon-green shadow-[0_0_12px_rgba(57,255,20,0.15)]">
                              ✓ Enlisted
                            </div>
                            <button
                              onClick={handleWithdraw}
                              disabled={processingActionId === 'withdraw'}
                              className="w-full py-2.5 px-4 rounded-xl text-[10px] font-bold transition-all duration-300 uppercase tracking-wider bg-dark-800 border border-dark-700 text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer"
                            >
                              {processingActionId === 'withdraw' ? 'Leaving...' : '🚪 Leave Match'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleRSVP}
                            disabled={isFull || processingActionId === 'rsvp'}
                            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-lg transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                              isFull
                                ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600'
                                : 'bg-gradient-to-r from-neon-blue to-neon-pink text-dark-900 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]'
                            }`}
                          >
                            {isFull ? 'Squad Full' : (processingActionId === 'rsvp' ? 'Enlisting...' : 'Enlist Now')}
                          </button>
                        )
                      ) : (
                        (hasApplied || isApproved) ? (
                          <div className="space-y-3">
                            <div className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-lg uppercase tracking-widest text-center border ${
                              isApproved
                                ? 'bg-neon-green/10 border-neon-green/40 text-neon-green shadow-[0_0_12px_rgba(57,255,20,0.15)]'
                                : myTeamStatus === 'Pending'
                                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
                                : 'bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                            }`}>
                              {isApproved ? '🟢 Selected for Team' : 
                               myTeamStatus === 'Pending' ? '🟡 Application Pending' : 
                               '🔴 Application Rejected'}
                            </div>
                            {myTeamStatus !== 'Rejected' && (
                              <button
                                onClick={handleWithdraw}
                                disabled={processingActionId === 'withdraw'}
                                className="w-full py-2.5 px-4 rounded-xl text-[10px] font-bold transition-all duration-300 uppercase tracking-wider bg-dark-800 border border-dark-700 text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer"
                              >
                                {processingActionId === 'withdraw' ? 'Processing...' : (isApproved ? '🚪 Leave Team' : '❌ Withdraw Tryout')}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handleApplyTryout}
                            disabled={isFull || processingActionId === 'apply'}
                            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-lg transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                              isFull
                                ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600'
                                : 'bg-gradient-to-r from-neon-pink to-orange-500 text-dark-900 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] disabled:opacity-50'
                            }`}
                          >
                            {isFull ? 'Squad Full' : (processingActionId === 'apply' ? 'Applying...' : 'Apply for Tryout')}
                          </button>
                        )
                      )}
                    </>
                  )}
                  {isCreator && (
                    <div className="space-y-3">
                      <div className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-neon-blue bg-neon-blue/10 text-center border border-neon-blue/20 uppercase tracking-widest shadow-[inset_0_0_10px_rgba(0,243,255,0.05)]">
                        You are Commander
                      </div>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={processingActionId === 'delete'}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all duration-300 uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {processingActionId === 'delete' ? 'Deleting...' : '🗑 Delete Event'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
 
            </div>
 
            {/* Discussion Section */}
            <div className="mt-12 pt-8 border-t border-dark-700/60">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-neon-pink">💬</span> Discussion Feed
              </h2>
 
              <div className="bg-dark-900/40 p-6 rounded-2xl border border-dark-700/50 mb-8 shadow-inner">
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Join the conversation..."
                    className="w-full bg-dark-800 border border-dark-700/80 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-pink/60 focus:ring-1 focus:ring-neon-pink/40 resize-none transition-all duration-300 text-sm"
                    rows="3"
                    required
                  ></textarea>
                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isCommenting}
                      className="bg-neon-pink text-dark-900 px-6 py-2 rounded-xl text-xs font-bold hover:bg-white hover:text-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(255,0,255,0.2)] cursor-pointer"
                    >
                      {isCommenting ? 'Transmitting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
 
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {(!event.comments || event.comments.length === 0) ? (
                  <p className="text-gray-500 text-center py-8 text-xs italic bg-dark-900/20 rounded-2xl border border-dark-700/30">
                    No communications received yet. Be the first to initiate contact!
                  </p>
                ) : (
                  event.comments?.map((comment, idx) => (
                    <div key={comment._id || idx} className="bg-dark-800/20 p-5 rounded-2xl border border-dark-700/40 hover:border-dark-650 transition-all duration-300 flex gap-4">
                      <div className="h-9 w-9 rounded-xl bg-dark-900 border border-dark-700/60 flex items-center justify-center text-neon-pink font-bold uppercase flex-shrink-0 text-xs">
                        {comment.user?.name ? comment.user.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-2">
                          <h4 className="font-bold text-white text-xs truncate max-w-[160px] md:max-w-none">{comment.user?.name || 'Unknown Player'}</h4>
                          <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const PlayerRating = ({ reqData, isCreator, userId, onRate, processingActionId }) => {
  const [rating, setRating] = useState(reqData?.rating || 0);
  const [feedback, setFeedback] = useState(reqData?.feedback || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (reqData) {
      setRating(reqData.rating || 0);
      setFeedback(reqData.feedback || '');
    }
  }, [reqData]);

  if (!reqData) return null;

  if (!isCreator) {
    if (reqData.rating > 0) {
      return (
        <div className="mt-2 text-[10px] text-yellow-400 bg-dark-900/60 px-2 py-1 rounded-lg border border-yellow-400/20 font-medium shadow-inner">
          Rating: {Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')} ({reqData.rating}/5)
        </div>
      );
    }
    return null;
  }

  // Host view
  return (
    <div className="mt-3 bg-dark-900/60 p-3 rounded-xl border border-dark-700/60 w-full shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="text-neon-blue">📊</span> Performance Card
        </span>
        {reqData.rating > 0 && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-[9px] text-neon-pink hover:text-white transition-colors cursor-pointer font-semibold">Edit</button>
        )}
      </div>
      
      {(!reqData.rating || isEditing) ? (
        <div className="space-y-2">
          <div className="flex gap-1 text-base">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                onClick={() => setRating(star)} 
                className={`focus:outline-none transition-transform hover:scale-120 cursor-pointer ${rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Technical details & feedback (optional)..."
            className="w-full bg-dark-900 border border-dark-700/60 rounded-lg p-2 text-[11px] text-white placeholder-gray-650 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue resize-none transition-all duration-300"
            rows="2"
          />
          <div className="flex justify-end gap-2">
            {isEditing && <button onClick={() => { setIsEditing(false); setRating(reqData.rating); setFeedback(reqData.feedback); }} className="text-[9px] text-gray-450 hover:text-white transition-colors px-2 cursor-pointer">Cancel</button>}
            <button 
              onClick={() => { onRate(userId, rating, feedback); setIsEditing(false); }}
              disabled={rating === 0 || processingActionId === userId + '-rate'}
              className="px-3 py-1 bg-neon-blue/15 text-neon-blue text-[10px] font-bold rounded-lg hover:bg-neon-blue hover:text-dark-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.1)] cursor-pointer"
            >
              {processingActionId === userId + '-rate' ? '...' : 'Save Rating'}
            </button>
          </div>
        </div>
      ) : (
        <div className="group">
          <div className="text-yellow-400 text-xs mb-1">{Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')}</div>
          {reqData.feedback && <p className="text-[11px] text-gray-450 italic leading-relaxed">"{reqData.feedback}"</p>}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
