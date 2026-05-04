import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('hosting'); // 'hosting' or 'joined'
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    sportsInterests: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get('/api/users/profile');
        setProfileData(data);
        setFormData({
          name: data.name,
          bio: data.bio || '',
          sportsInterests: data.sportsInterests ? data.sportsInterests.join(', ') : '',
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        bio: formData.bio,
        sportsInterests: formData.sportsInterests.split(',').map(s => s.trim()).filter(s => s !== ''),
      };

      const { data } = await axiosInstance.put('/api/users/profile', payload);
      
      login({ ...user, name: data.name });
      setProfileData({ ...profileData, name: data.name, bio: data.bio, sportsInterests: data.sportsInterests });
      setIsEditing(false);
      toast.success('Profile updated successfully!', { icon: '✨' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 font-sans flex flex-col relative">
        <Navbar />
        <div className="flex-1 flex justify-center items-center relative z-10">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.5)]"></div>
        </div>
      </div>
    );
  }

  const eventsToDisplay = activeTab === 'hosting' ? profileData.hostedEvents : profileData.joinedEvents;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-neon-pink rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob"></div>
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-neon-blue rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob" style={{ animationDelay: '2s' }}></div>

      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-dark-700 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neon-pink/20 to-neon-blue/20"></div>
              <div className="relative h-28 w-28 rounded-full bg-dark-900 border-4 border-dark-800 flex items-center justify-center text-white text-5xl font-extrabold uppercase mx-auto mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10">
                {profileData.name.charAt(0)}
                <div className="absolute inset-0 rounded-full border border-neon-pink/50 shadow-[inset_0_0_10px_rgba(255,0,255,0.3)]"></div>
              </div>
              
              {!isEditing ? (
                <div className="relative z-10 animate-fade-in-up">
                  <h2 className="text-2xl font-extrabold text-white">{profileData.name}</h2>
                  <p className="text-sm font-medium text-neon-blue mt-1 mb-6">{profileData.college}</p>
                  
                  <div className="text-left mt-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mission Briefing</h3>
                      <p className="text-sm text-gray-300 leading-relaxed bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                        {profileData.bio || 'No bio provided. Update your profile to tell others about yourself.'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Combat Expertise (Sports)</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.sportsInterests?.length > 0 ? (
                          profileData.sportsInterests.map((sport, idx) => (
                            <span key={idx} className="bg-dark-900 border border-dark-600 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg">
                              {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">None specified.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-8 w-full bg-dark-700 text-white border border-dark-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-dark-600 hover:border-gray-500 transition-all duration-300"
                  >
                    Edit Credentials
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="text-left space-y-5 mt-4 relative z-10 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-white transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Bio</label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue text-white transition-all text-sm resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sports (comma separated)</label>
                    <input
                      type="text"
                      name="sportsInterests"
                      value={formData.sportsInterests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-neon-green text-white transition-all text-sm"
                      placeholder="e.g., Basketball, Tennis"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-300 bg-dark-700 border border-dark-600 rounded-lg hover:bg-dark-600 transition-all"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-sm font-bold text-dark-900 bg-gradient-to-r from-neon-pink to-neon-blue rounded-lg hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all"
                    >
                      Save Data
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-dark-700 overflow-hidden">
              <div className="flex border-b border-dark-700">
                <button
                  onClick={() => setActiveTab('hosting')}
                  className={`flex-1 py-5 text-sm font-bold text-center transition-all duration-300 uppercase tracking-wider ${
                    activeTab === 'hosting' ? 'text-neon-blue border-b-2 border-neon-blue bg-dark-700/50' : 'text-gray-500 hover:text-gray-300 hover:bg-dark-800'
                  }`}
                >
                  Deployed Events ({profileData.hostedEvents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 py-5 text-sm font-bold text-center transition-all duration-300 uppercase tracking-wider ${
                    activeTab === 'joined' ? 'text-neon-pink border-b-2 border-neon-pink bg-dark-700/50' : 'text-gray-500 hover:text-gray-300 hover:bg-dark-800'
                  }`}
                >
                  Joined Events ({profileData.joinedEvents?.length || 0})
                </button>
              </div>

              <div className="p-8">
                {eventsToDisplay?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6 opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🏅</div>
                    <h3 className="text-xl text-white font-bold mb-2">Radar Clear</h3>
                    <p className="text-gray-400 text-base max-w-sm mx-auto mb-6">
                      {activeTab === 'hosting' 
                        ? "You haven't initiated any operations yet." 
                        : "You haven't enlisted in any operations yet."}
                    </p>
                    {activeTab === 'hosting' && (
                      <Link to="/dashboard" className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold text-neon-blue border border-neon-blue hover:bg-neon-blue/10 transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                        Initialize One Now &rarr;
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventsToDisplay.map((event, index) => (
                      <Link 
                        key={event._id} 
                        to={`/events/${event._id}`}
                        className="block bg-dark-900/80 rounded-2xl p-5 border border-dark-700 hover:border-dark-500 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-[0_5px_15px_rgba(0,0,0,0.5)] animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${getSportBadgeColor(event.sport)}`}>
                                {event.sport}
                              </span>
                              <h4 className="font-extrabold text-lg text-white group-hover:text-neon-blue transition-colors line-clamp-1">{event.title}</h4>
                            </div>
                            <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                              <span className="text-neon-pink">📅</span> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="self-start md:self-center">
                            <span className="text-xs font-bold text-gray-300 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-600 shadow-inner flex items-center gap-2">
                              <span className="text-neon-blue">👥</span>
                              {event.participants?.length || 1} / {event.maxParticipants || '∞'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Profile;
