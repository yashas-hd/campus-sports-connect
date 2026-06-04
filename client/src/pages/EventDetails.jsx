import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
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

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-[50vh] flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-4">Retrieving Operation Specs...</p>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !event) {
    return (
      <SidebarLayout>
        <div className="min-h-[50vh] flex justify-center items-center p-4">
          <div className="bg-dark-800/20 p-10 rounded-2xl border border-red-550/20 text-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-650"></div>
            <span className="text-4xl block mb-5">⚠️</span>
            <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">Operation Retrieval Failed</h2>
            <p className="text-zinc-400 mb-8 text-xs font-medium">{error || 'Event specifications not found'}</p>
            <Link to="/dashboard" className="bg-zinc-900 border border-zinc-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:text-blue-550 hover:border-blue-500 transition-all duration-200 inline-block cursor-pointer uppercase tracking-wider">
              Return to Radar
            </Link>
          </div>
        </div>
      </SidebarLayout>
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
    <SidebarLayout>
      <div className="max-w-5xl mx-auto animate-fade-in-up">
        <Link to="/dashboard" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-blue-550 mb-6 transition-colors uppercase tracking-wider cursor-pointer">
          &larr; Return to Radar
        </Link>
 
        <div className="bg-dark-800/20 rounded-2xl overflow-hidden shadow-sm border border-dark-700">
          {/* Header Banner */}
          <div className="min-h-56 bg-dark-850 p-8 md:p-10 flex flex-col justify-end relative overflow-hidden border-b border-dark-700">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent z-10"></div>
            
            <div className="relative z-20 animate-fade-in-up">
              <span className={`inline-block mb-3 border text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider ${getSportBadgeColor(event.sport)}`}>
                {getSportEmoji(event.sport)} {event.sport}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">{event.title}</h1>
            </div>
          </div>
 
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-dark-700/60 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-1 h-3 bg-blue-600 rounded-full"></span> Event Description
                  </h2>
                  <p className="text-slate-350 whitespace-pre-wrap leading-relaxed text-sm bg-dark-900/40 p-5 rounded-xl border border-dark-700/50">
                    {event.description}
                  </p>
                </section>
 
                <section>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-dark-700/60 pb-2 mb-4 flex items-center gap-2">
                    <span className="w-1 h-3 bg-blue-600 rounded-full"></span> Match Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start bg-dark-900/45 p-4 rounded-xl border border-dark-700/50 hover:border-slate-700 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-lg text-blue-500">
                        📅
                      </div>
                      <div className="ml-4">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Timeframe</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-blue-400 font-medium mt-0.5">
                          {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start bg-dark-900/45 p-4 rounded-xl border border-dark-700/50 hover:border-slate-700 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-lg text-blue-500">
                        📍
                      </div>
                      <div className="ml-4">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Location</p>
                        <p className="text-sm font-bold text-white">{event.location}</p>
                      </div>
                    </div>
 
                    <div className="flex items-start bg-dark-900/45 p-4 rounded-xl border border-dark-700/50 hover:border-slate-700 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-lg text-blue-500">
                        👑
                      </div>
                      <div className="ml-4">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Commander / Host</p>
                        <p className="text-sm font-bold text-white">{event.creator?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{event.creator?.college}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
 
              {/* Right Column: Participants & Action */}
              <div className="space-y-6">
                
                {/* Host Review Panel */}
                {isCreator && isCompetitiveTryout && (
                  <div className="bg-dark-900/40 p-5 rounded-xl border border-dark-700 shadow-sm">
                    <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                      <span>📋</span> Review Board ({event.teamRequests?.filter(r => r.teamStatus === 'Pending').length || 0})
                    </h3>
                    
                    {(!event.teamRequests || event.teamRequests.length === 0) ? (
                      <p className="text-slate-500 text-xs italic">No tryout applications yet.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                        {event.teamRequests?.map(req => (
                          <div key={req._id} className="bg-dark-850 p-3 rounded-lg border border-dark-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-xs font-bold text-white">{req.user?.name}</h4>
                                <p className="text-[9px] text-slate-400 truncate max-w-[125px]">{req.user?.college}</p>
                              </div>
                              {req.teamStatus === 'Pending' && <span className="text-[8px] font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pending</span>}
                              {req.teamStatus === 'Approved' && <span className="text-[8px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>}
                              {req.teamStatus === 'Rejected' && <span className="text-[8px] font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Rejected</span>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 mt-2 bg-dark-900 p-2 rounded-md border border-dark-700/60">
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase tracking-wider">Sports</span>
                                <span className="text-[9px] text-slate-300 font-semibold truncate block max-w-[70px]">{req.user?.preferredSports?.join(', ') || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase tracking-wider">Position</span>
                                <span className="text-[9px] text-slate-300 font-semibold truncate block max-w-[70px]">{req.user?.preferredPosition || 'N/A'}</span>
                              </div>
                              <div className="col-span-2 mt-1 border-t border-dark-700/40 pt-1 flex justify-between">
                                <span className="text-[8px] text-slate-500 uppercase tracking-wider">Experience</span>
                                <span className="text-[9px] text-blue-400 font-bold">{req.user?.experienceLevel || 'Beginner'}</span>
                              </div>
                            </div>
                            
                            {req.teamStatus === 'Pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApprovePlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {processingActionId === req.user._id + '-approve' ? '...' : 'Accept'}
                                </button>
                                <button 
                                  onClick={() => handleRejectPlayer(req.user._id)} 
                                  disabled={processingActionId === req.user._id + '-approve' || processingActionId === req.user._id + '-reject'}
                                  className="flex-1 py-1 text-[10px] font-semibold bg-red-650 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
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
 
                <div className="bg-dark-900/40 p-5 rounded-xl border border-dark-700 shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-white text-sm tracking-wide">
                      {isCompetitiveTryout ? '⭐ Team Roster' : 'Active Squad'}
                    </h3>
                    <span className="text-[10px] font-semibold bg-dark-800 px-2 py-0.5 rounded text-slate-350 border border-dark-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {event.participants?.length} / {event.maxParticipants || '∞'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {event.participants?.map(p => (
                      <div key={p._id} className="flex flex-col gap-2 bg-dark-800/30 p-3 rounded-lg border border-dark-700 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start w-full">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded bg-dark-950 border border-dark-700 flex items-center justify-center text-slate-300 text-xs font-bold uppercase flex-shrink-0 shadow-inner">
                              {p.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">
                                {p.name} 
                                {p._id === event.creator?._id && <span className="text-[8px] bg-blue-600/10 border border-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider font-semibold">Host</span>}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate mt-0.5">{p.college}</p>
                            </div>
                          </div>
                          {isCreator && p._id !== event.creator?._id && (
                            <button
                              onClick={() => handleRemovePlayer(p._id, p.name)}
                              disabled={processingActionId === p._id + '-remove'}
                              className="ml-2 w-6 h-6 flex-shrink-0 rounded bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-550 hover:text-white transition-colors disabled:opacity-50 cursor-pointer text-xs"
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
                          <div className="space-y-2">
                            <div className="w-full py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              ✓ Enlisted
                            </div>
                            <button
                              onClick={handleWithdraw}
                              disabled={processingActionId === 'withdraw'}
                              className="w-full py-2 px-4 rounded-lg text-[10px] font-bold transition-all duration-200 uppercase tracking-wider bg-dark-900 border border-dark-700 text-slate-400 hover:text-red-550 hover:border-red-550/40 hover:bg-red-550/5 disabled:opacity-50 cursor-pointer"
                            >
                              {processingActionId === 'withdraw' ? 'Leaving...' : '🚪 Leave Match'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleRSVP}
                            disabled={isFull || processingActionId === 'rsvp'}
                            className={`w-full py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all duration-250 uppercase tracking-wider cursor-pointer ${
                              isFull
                                ? 'bg-dark-750 text-slate-500 cursor-not-allowed border border-dark-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isFull ? 'Squad Full' : (processingActionId === 'rsvp' ? 'Enlisting...' : 'Enlist Now')}
                          </button>
                        )
                      ) : (
                        (hasApplied || isApproved) ? (
                          <div className="space-y-2">
                            <div className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider text-center border ${
                              isApproved
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-455'
                                : myTeamStatus === 'Pending'
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                              {isApproved ? '🟢 Selected for Team' : 
                               myTeamStatus === 'Pending' ? '🟡 Application Pending' : 
                               '🔴 Application Rejected'}
                            </div>
                            {myTeamStatus !== 'Rejected' && (
                              <button
                                onClick={handleWithdraw}
                                disabled={processingActionId === 'withdraw'}
                                className="w-full py-2 px-4 rounded-lg text-[10px] font-bold transition-all duration-200 uppercase tracking-wider bg-dark-900 border border-dark-700 text-slate-400 hover:text-red-550 hover:border-red-550/40 hover:bg-red-550/5 disabled:opacity-50 cursor-pointer"
                              >
                                {processingActionId === 'withdraw' ? 'Processing...' : (isApproved ? '🚪 Leave Team' : '❌ Withdraw Tryout')}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handleApplyTryout}
                            disabled={isFull || processingActionId === 'apply'}
                            className={`w-full py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all duration-250 uppercase tracking-wider cursor-pointer ${
                              isFull
                                ? 'bg-dark-750 text-slate-500 cursor-not-allowed border border-dark-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isFull ? 'Squad Full' : (processingActionId === 'apply' ? 'Applying...' : 'Apply for Tryout')}
                          </button>
                        )
                      )}
                    </>
                  )}
                  {isCreator && (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-blue-500 bg-blue-500/5 text-center border border-blue-500/10 uppercase tracking-wider">
                        You are Commander
                      </div>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={processingActionId === 'delete'}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 uppercase tracking-wider bg-red-650/15 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>💬</span> Discussion Feed
              </h2>
 
              <div className="bg-dark-900/40 p-5 rounded-xl border border-dark-700/60 mb-6">
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Join the conversation..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all duration-200 text-sm"
                    rows="3"
                    required
                  ></textarea>
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isCommenting}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCommenting ? 'Transmitting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
 
              <div className="space-y-3.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {(!event.comments || event.comments.length === 0) ? (
                  <p className="text-slate-500 text-center py-8 text-xs italic bg-dark-900/20 rounded-xl border border-dark-700/30">
                    No communications received yet. Be the first to initiate contact!
                  </p>
                ) : (
                  event.comments?.map((comment, idx) => (
                    <div key={comment._id || idx} className="bg-dark-800/20 p-4 rounded-xl border border-dark-700/50 hover:border-slate-700 transition-colors flex gap-4">
                      <div className="h-8 w-8 rounded bg-dark-900 border border-dark-700 flex items-center justify-center text-blue-500 font-bold uppercase flex-shrink-0 text-xs shadow-inner">
                        {comment.user?.name ? comment.user.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-white text-xs truncate max-w-[150px] md:max-w-none">{comment.user?.name || 'Unknown Player'}</h4>
                          <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
      </div>
      </div>
    </SidebarLayout>
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
        <div className="mt-2 text-[10px] text-yellow-550 bg-dark-900/60 px-2 py-1 rounded border border-yellow-500/20 font-semibold shadow-inner">
          Rating: {Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')} ({reqData.rating}/5)
        </div>
      );
    }
    return null;
  }

  // Host view
  return (
    <div className="mt-3 bg-dark-900/60 p-3 rounded-lg border border-dark-700/60 w-full shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
          <span className="text-blue-500">📊</span> Performance Card
        </span>
        {reqData.rating > 0 && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-[9px] text-blue-400 hover:text-white transition-colors cursor-pointer font-semibold">Edit</button>
        )}
      </div>
      
      {(!reqData.rating || isEditing) ? (
        <div className="space-y-2">
          <div className="flex gap-1 text-base">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                onClick={() => setRating(star)} 
                className={`focus:outline-none transition-transform hover:scale-120 cursor-pointer ${rating >= star ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-450/50'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Technical details & feedback (optional)..."
            className="w-full bg-dark-900 border border-dark-700/60 rounded-lg p-2 text-[11px] text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-all duration-200"
            rows="2"
          />
          <div className="flex justify-end gap-2">
            {isEditing && <button onClick={() => { setIsEditing(false); setRating(reqData.rating); setFeedback(reqData.feedback); }} className="text-[9px] text-slate-450 hover:text-white transition-colors px-2 cursor-pointer">Cancel</button>}
            <button 
              onClick={() => { onRate(userId, rating, feedback); setIsEditing(false); }}
              disabled={rating === 0 || processingActionId === userId + '-rate'}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {processingActionId === userId + '-rate' ? '...' : 'Save Rating'}
            </button>
          </div>
        </div>
      ) : (
        <div className="group">
          <div className="text-yellow-400 text-xs mb-1">{Array(reqData.rating).fill('★').join('')}{Array(5 - reqData.rating).fill('☆').join('')}</div>
          {reqData.feedback && <p className="text-[11px] text-slate-400 italic leading-relaxed">"{reqData.feedback}"</p>}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
