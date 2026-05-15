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
      try {
        await axiosInstance.delete(`/api/events/${event._id}`);
        toast.success('Event deleted successfully!', { icon: '🗑️' });
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete event');
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
  const isCompetitiveTryout = event.eventType === 'Competitive Tryout';
  const myRequest = event.teamRequests?.find(r => (r.user?._id === user._id || r.user === user._id));
  const hasApplied = !!myRequest;
  const myTeamStatus = myRequest?.teamStatus;
  const isApproved = event.approvedPlayers?.some(p => p._id === user._id || p === user._id);

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
                {getSportEmoji(event.sport)} {event.sport}
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
                
                {/* Host Review Panel */}
                {isCreator && isCompetitiveTryout && (
                  <div className="bg-dark-900/80 p-6 rounded-2xl border border-neon-pink/50 shadow-[0_0_15px_rgba(255,0,255,0.1)]">
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                      <span className="text-neon-pink">📋</span> Host Review Panel
                    </h3>
                    
                    {(!event.teamRequests || event.teamRequests.length === 0) ? (
                      <p className="text-gray-500 text-sm italic">No tryout applications yet.</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                        {event.teamRequests.map(req => (
                          <div key={req._id} className="bg-dark-800 p-4 rounded-xl border border-dark-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-white">{req.user?.name}</h4>
                                <p className="text-xs text-gray-400">{req.user?.college} • {req.user?.email}</p>
                              </div>
                              {req.teamStatus === 'Pending' && <span className="text-[10px] font-bold px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">🟡 Pending</span>}
                              {req.teamStatus === 'Approved' && <span className="text-[10px] font-bold px-2 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/30">🟢 Approved</span>}
                              {req.teamStatus === 'Rejected' && <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/30">🔴 Rejected</span>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 mt-2 bg-dark-900/50 p-2 rounded-lg">
                              <div>
                                <span className="block text-[10px] text-gray-500 uppercase">Sport</span>
                                <span className="text-xs text-gray-300 font-medium">{req.user?.preferredSport || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-500 uppercase">Position</span>
                                <span className="text-xs text-gray-300 font-medium">{req.user?.preferredPosition || 'N/A'}</span>
                              </div>
                              <div className="col-span-2 mt-1">
                                <span className="block text-[10px] text-gray-500 uppercase">Experience</span>
                                <span className="text-xs text-neon-blue font-medium">{req.user?.experienceLevel || 'Beginner'}</span>
                              </div>
                            </div>
                            
                            {req.teamStatus === 'Pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApprovePlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1.5 text-xs font-bold bg-neon-green/20 text-neon-green rounded hover:bg-neon-green/30 transition-colors disabled:opacity-50"
                                >
                                  {processingActionId === req.user._id + '-approve' ? '...' : 'Accept'}
                                </button>
                                <button 
                                  onClick={() => handleRejectPlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1.5 text-xs font-bold bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
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

                <div className="bg-dark-900/80 p-6 rounded-2xl border border-dark-700 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">
                      {isCompetitiveTryout ? '⭐ Final Team Members' : 'Squad'}
                    </h3>
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
                          
                          {isCompetitiveTryout && p._id !== event.creator?._id && (
                            <PlayerRating 
                              reqData={event.teamRequests?.find(r => r.user?._id === p._id || r.user === p._id)} 
                              isCreator={isCreator} 
                              userId={p._id} 
                              onRate={handleRatePlayer} 
                              processingActionId={processingActionId} 
                            />
                          )}
                        </div>
                        {isCreator && p._id !== event.creator?._id && (
                            <button
                              onClick={() => handleRemovePlayer(p._id, p.name)}
                              disabled={processingActionId === p._id + '-remove'}
                              className="ml-2 w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                              title="Remove Player"
                            >
                              {processingActionId === p._id + '-remove' ? '...' : '×'}
                            </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {!isCreator && (
                    <>
                      {!isCompetitiveTryout ? (
                        isParticipating ? (
                          <div className="space-y-3">
                            <div className="w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg uppercase tracking-wider text-center bg-neon-green/10 border border-neon-green/50 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                              ✓ Enlisted
                            </div>
                            <button
                              onClick={handleWithdraw}
                              disabled={processingActionId === 'withdraw'}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider bg-dark-800 border border-dark-600 text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {processingActionId === 'withdraw' ? 'Leaving...' : '🚪 Leave Match'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleRSVP}
                            disabled={isFull}
                            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 uppercase tracking-wider ${
                              isFull
                                ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600'
                                : 'bg-gradient-to-r from-neon-blue to-neon-pink text-dark-900 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)]'
                            }`}
                          >
                            {isFull ? 'Squad Full' : 'Enlist Now'}
                          </button>
                        )
                      ) : (
                        (hasApplied || isApproved) ? (
                          <div className="space-y-3">
                            <div className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg uppercase tracking-wider text-center ${
                              isApproved
                                ? 'bg-neon-green/10 border border-neon-green/50 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                                : myTeamStatus === 'Pending'
                                ? 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                : 'bg-red-500/10 border border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            }`}>
                              {isApproved ? '🟢 Selected for Team' : 
                               myTeamStatus === 'Pending' ? '🟡 Application Pending' : 
                               '🔴 Rejected'}
                            </div>
                            {myTeamStatus !== 'Rejected' && (
                              <button
                                onClick={handleWithdraw}
                                disabled={processingActionId === 'withdraw'}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider bg-dark-800 border border-dark-600 text-gray-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {processingActionId === 'withdraw' ? 'Processing...' : (isApproved ? '🚪 Leave Team' : '❌ Withdraw Application')}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handleApplyTryout}
                            disabled={isFull || processingActionId === 'apply'}
                            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 uppercase tracking-wider ${
                              isFull
                                ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600'
                                : 'bg-gradient-to-r from-neon-pink to-orange-500 text-dark-900 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] disabled:opacity-50'
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
                      <div className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-neon-blue bg-neon-blue/10 text-center border border-neon-blue/30 uppercase tracking-wider shadow-[inset_0_0_10px_rgba(0,243,255,0.1)]">
                        You are Commander
                      </div>
                      <button
                        onClick={handleDeleteEvent}
                        className="w-full py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 uppercase tracking-wider bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        🗑 Delete Event
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Discussion Section */}
            <div className="mt-12 pt-8 border-t border-dark-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-neon-pink">💬</span> Discussion
              </h2>

              <div className="bg-dark-900/50 p-6 rounded-2xl border border-dark-700 mb-8 shadow-inner">
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Join the conversation..."
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl p-4 text-white focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink resize-none transition-colors"
                    rows="3"
                    required
                  ></textarea>
                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isCommenting}
                      className="bg-neon-pink text-dark-900 px-6 py-2 rounded-xl font-bold hover:bg-white hover:text-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                    >
                      {isCommenting ? 'Transmitting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {(!event.comments || event.comments.length === 0) ? (
                  <p className="text-gray-500 text-center py-6 italic bg-dark-900/30 rounded-xl border border-dark-700/50">
                    No comms yet. Be the first to initiate contact!
                  </p>
                ) : (
                  event.comments.map((comment, idx) => (
                    <div key={comment._id || idx} className="bg-dark-800/60 p-5 rounded-2xl border border-dark-600 hover:border-dark-500 transition-all duration-300 flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-dark-900 border border-dark-500 flex items-center justify-center text-neon-pink font-bold uppercase flex-shrink-0">
                        {comment.user?.name ? comment.user.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-white text-sm">{comment.user?.name || 'Unknown User'}</h4>
                          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
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
        <div className="mt-2 text-[10px] text-yellow-400 bg-dark-900 px-2 py-1 rounded inline-block border border-yellow-400/20 font-medium">
          Rating: {Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')} ({reqData.rating}/5)
        </div>
      );
    }
    return null;
  }

  // Host view
  return (
    <div className="mt-3 bg-dark-900/50 p-3 rounded-lg border border-dark-600 w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="text-neon-blue">📊</span> Performance Rating
        </span>
        {reqData.rating > 0 && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-[10px] text-neon-pink hover:text-white transition-colors">Edit</button>
        )}
      </div>
      
      {(!reqData.rating || isEditing) ? (
        <div className="space-y-2">
          <div className="flex gap-1 text-lg">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                onClick={() => setRating(star)} 
                className={`focus:outline-none transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback (optional)..."
            className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-xs text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue resize-none transition-colors"
            rows="2"
          />
          <div className="flex justify-end gap-2">
            {isEditing && <button onClick={() => { setIsEditing(false); setRating(reqData.rating); setFeedback(reqData.feedback); }} className="text-[10px] text-gray-400 hover:text-white transition-colors px-2">Cancel</button>}
            <button 
              onClick={() => { onRate(userId, rating, feedback); setIsEditing(false); }}
              disabled={rating === 0 || processingActionId === userId + '-rate'}
              className="px-3 py-1 bg-neon-blue/10 text-neon-blue text-xs font-bold rounded hover:bg-neon-blue hover:text-dark-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.1)]"
            >
              {processingActionId === userId + '-rate' ? '...' : 'Save Rating'}
            </button>
          </div>
        </div>
      ) : (
        <div className="group">
          <div className="text-yellow-400 text-sm mb-1">{Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')}</div>
          {reqData.feedback && <p className="text-xs text-gray-300 italic">"{reqData.feedback}"</p>}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
