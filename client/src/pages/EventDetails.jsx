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
      
      // Update local state by refetching to get populated participants
      const updatedEvent = await axiosInstance.get(`/api/events/${event._id}`);
      setEvent(updatedEvent.data);
      toast.success('Successfully joined the event!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100 max-w-md w-full">
            <span className="text-4xl block mb-4">😕</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-500 mb-6">{error || 'Event not found'}</p>
            <Link to="/dashboard" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-block">
              Back to Dashboard
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
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          &larr; Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {/* Header Banner */}
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 p-8 flex flex-col justify-end relative">
            <span className="absolute top-6 left-8 bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {event.sport}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">{event.title}</h1>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Details */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">About the Event</h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Key Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mt-1">
                        📅
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Date & Time</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mt-1">
                        📍
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mt-1">
                        👑
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Organizer</p>
                        <p className="text-sm text-gray-500">{event.creator?.name}</p>
                        <p className="text-xs text-gray-400">{event.creator?.college}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Participants & Action */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Participants</h3>
                    <span className="text-sm font-medium bg-white px-2 py-1 rounded text-gray-600 shadow-sm border border-gray-200">
                      {event.participants?.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                    {event.participants?.map(p => (
                      <div key={p._id} className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold uppercase flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name} {p._id === event.creator?._id && <span className="text-xs text-indigo-600 ml-1">(Host)</span>}</p>
                          <p className="text-xs text-gray-500 truncate">{p.college}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isCreator && (
                    <button
                      onClick={handleRSVP}
                      disabled={isParticipating || isFull}
                      className={`w-full py-3 px-4 rounded-lg text-sm font-medium text-white shadow-sm transition-all ${
                        isParticipating
                          ? 'bg-green-500 hover:bg-green-600'
                          : isFull
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                    >
                      {isParticipating ? '✓ You are going' : isFull ? 'Event Full' : 'RSVP Now'}
                    </button>
                  )}
                  {isCreator && (
                    <div className="w-full py-3 px-4 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 text-center border border-indigo-100">
                      You are the host
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
