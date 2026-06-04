import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosInstance';
import { SPORTS } from '../constants/sports';


const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('hosting'); // 'hosting' or 'joined'
  const [favoriteSports, setFavoriteSports] = useState([]);
  const [isSavingFavorites, setIsSavingFavorites] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    sportsInterests: '',
    preferredSports: [],
    preferredPosition: '',
    experienceLevel: 'Beginner',
  });

  useEffect(() => {
    const fetchProfile = async () => {
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

        const { data } = await axiosInstance.get('/api/users/profile');
        setProfileData(data);
        setFavoriteSports(data.favoriteSports || []);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          sportsInterests: data.sportsInterests?.join(', ') || '',
          preferredSports: data.preferredSports || [],
          preferredPosition: data.preferredPosition || '',
          experienceLevel: data.experienceLevel || 'Beginner',
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
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

  const toggleFavoriteSport = (sport) => {
    setFavoriteSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const togglePreferredSport = (sport) => {
    setFormData((prev) => {
      const isSelected = prev.preferredSports.includes(sport);
      if (isSelected) {
        return { ...prev, preferredSports: prev.preferredSports.filter((s) => s !== sport) };
      }
      if (prev.preferredSports.length >= 3) {
        toast.error('Maximum 3 preferred sports allowed.', { icon: '⚠️' });
        return prev;
      }
      return { ...prev, preferredSports: [...prev.preferredSports, sport] };
    });
  };

  const handleSaveFavorites = async () => {
    setIsSavingFavorites(true);
    try {
      const { data } = await axiosInstance.put('/api/users/favorite-sports', {
        favoriteSports
      });
      setProfileData({ ...profileData, favoriteSports: data.favoriteSports });
      toast.success('Favorite sports updated!', { icon: '⚡' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorites');
    } finally {
      setIsSavingFavorites(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        bio: formData.bio,
        sportsInterests: formData.sportsInterests.split(',').map(s => s.trim()).filter(s => s !== ''),
        preferredSports: formData.preferredSports,
        preferredPosition: formData.preferredPosition,
        experienceLevel: formData.experienceLevel,
      };

      const { data } = await axiosInstance.put('/api/users/profile', payload);
      
      login({ ...user, name: data.name });
      setProfileData({ ...profileData, name: data.name, bio: data.bio, sportsInterests: data.sportsInterests, preferredSports: data.preferredSports, preferredPosition: data.preferredPosition, experienceLevel: data.experienceLevel });
      setIsEditing(false);
      toast.success('Profile updated successfully!', { icon: '✨' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const getSportBadgeColor = (sport) => {
    if(!sport) return '';
    const s = sport.toLowerCase();
    if (s.includes('basket')) return 'text-orange-400 border-orange-400/35 bg-orange-400/10 shadow-[0_0_15px_rgba(251,146,60,0.1)]';
    if (s.includes('foot') || s.includes('soccer')) return 'text-neon-green border-neon-green/35 bg-neon-green/10 shadow-[0_0_15px_rgba(57,255,20,0.1)]';
    if (s.includes('badminton')) return 'text-yellow-400 border-yellow-400/35 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.1)]';
    if (s.includes('volley')) return 'text-neon-pink border-neon-pink/35 bg-neon-pink/10 shadow-[0_0_15px_rgba(255,0,255,0.1)]';
    if (s.includes('cricket')) return 'text-neon-blue border-neon-blue/35 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.1)]';
    if (s.includes('kabaddi')) return 'text-red-500 border-red-500/35 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
    return 'text-neon-blue border-neon-blue/35 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.1)]';
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

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-dark-800/40 rounded-3xl p-8 border border-dark-700/80 animate-pulse h-[500px]">
                <div className="h-28 w-28 rounded-2xl mx-auto mb-6 bg-dark-900/60 animate-pulse border border-dark-700"></div>
                <div className="h-8 w-3/4 mx-auto rounded mb-2 bg-dark-900/60 animate-pulse"></div>
                <div className="h-4 w-1/2 mx-auto rounded mb-8 bg-dark-900/60 animate-pulse"></div>
                <div className="h-24 w-full rounded-xl mb-6 bg-dark-900/60 animate-pulse"></div>
                <div className="h-10 w-full rounded-xl bg-dark-900/60 animate-pulse"></div>
              </div>
            </div>
            {/* Right Column Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-dark-800/40 rounded-3xl p-8 border border-dark-700/80 animate-pulse min-h-[500px]">
                <div className="flex gap-4 mb-8">
                  <div className="h-12 flex-1 rounded-xl bg-dark-900/60 animate-pulse"></div>
                  <div className="h-12 flex-1 rounded-xl bg-dark-900/60 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {Array(3).fill().map((_, i) => (
                    <div key={i} className="h-24 w-full rounded-2xl bg-dark-900/60 animate-pulse border border-dark-700/60"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const eventsToDisplay = activeTab === 'hosting' ? (profileData?.hostedEvents || []) : (profileData?.joinedEvents || []);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans pb-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-neon-pink/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-800/30 backdrop-blur-md p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-dark-700/80 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neon-pink/10 to-neon-blue/10"></div>
              <div className="relative h-28 w-28 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center text-white text-5xl font-extrabold uppercase mx-auto mb-6 shadow-inner z-10 group hover:border-neon-blue/60 transition-all duration-300">
                {profileData?.name?.charAt(0) || ''}
                <div className="absolute inset-0 rounded-2xl border border-neon-pink/20 shadow-[inset_0_0_12px_rgba(255,0,255,0.15)] group-hover:border-neon-pink/45 transition-colors"></div>
              </div>
              
              {!isEditing ? (
                <div className="relative z-10 animate-fade-in-up">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{profileData?.name || ''}</h2>
                  <p className="text-xs font-bold text-neon-blue tracking-wider uppercase mt-1.5 mb-6">{profileData?.college || ''}</p>
                  
                  <div className="text-left mt-6 space-y-5">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neon-blue"></span> Intel / Bio</h3>
                      <p className="text-xs md:text-sm text-gray-300 leading-relaxed bg-dark-900/50 p-4 rounded-xl border border-dark-700/60 shadow-inner">
                        {profileData?.bio || 'No operations bio briefing logged.'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neon-pink"></span> Combat Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {(profileData?.sportsInterests || []).length > 0 ? (
                          profileData.sportsInterests.map((sport, idx) => (
                            <span key={idx} className="bg-dark-900/60 border border-dark-700/60 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-inner">
                              {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">None specified.</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3.5 mt-4">
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 col-span-2 shadow-inner">
                          <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">Favored Sports</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(profileData?.preferredSports || []).length > 0 ? (
                              profileData.preferredSports.map((sport, idx) => (
                                <span key={idx} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getSportBadgeColor(sport)}`}>
                                  {getSportEmoji(sport)} {sport}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 shadow-inner">
                          <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Position</span>
                          <span className="text-xs text-gray-300 font-bold">{profileData?.preferredPosition || 'N/A'}</span>
                        </div>
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 shadow-inner">
                          <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-1.5">Tier / Rank</span>
                          <span className="text-xs text-neon-blue font-bold">{profileData?.experienceLevel || 'Beginner'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-8 w-full bg-dark-850 hover:bg-dark-750 text-white border border-dark-700 hover:border-neon-blue/40 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider"
                  >
                    Edit Credentials
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="text-left space-y-4 mt-4 relative z-10 animate-fade-in-up">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neon-pink focus:border-neon-pink text-white transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Operational Bio</label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue text-white transition-all text-xs resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Combat Specialties (comma separated)</label>
                    <input
                      type="text"
                      name="sportsInterests"
                      value={formData.sportsInterests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neon-green focus:border-neon-green text-white transition-all text-xs"
                      placeholder="e.g., Basketball, Tennis"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Favored Sports (Max 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {SPORTS.map(sport => {
                          const isSelected = formData.preferredSports.includes(sport);
                          return (
                            <button
                              key={sport}
                              type="button"
                              onClick={() => togglePreferredSport(sport)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                isSelected 
                                  ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/40 shadow-[0_0_10px_rgba(0,243,255,0.15)]' 
                                  : 'bg-dark-900 text-gray-400 border-dark-700/60 hover:border-dark-600'
                              }`}
                            >
                              {getSportEmoji(sport)} {sport}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Preferred Position</label>
                      <input
                        type="text"
                        name="preferredPosition"
                        value={formData.preferredPosition}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue text-white transition-all text-xs"
                        placeholder="e.g., Striker"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tier / Experience</label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 bg-dark-900/60 border border-dark-700/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue text-white transition-all text-xs [color-scheme:dark]"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-3 text-xs font-bold text-gray-300 bg-dark-800 border border-dark-700 rounded-xl hover:bg-dark-750 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-xs font-bold text-dark-900 bg-gradient-to-r from-neon-pink to-neon-blue rounded-xl hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Save Data
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Favorite Sports Section */}
            <div className="bg-dark-800/30 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-dark-700/80 relative overflow-hidden">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-neon-pink">⚡</span> Preferences
              </h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Select favorite sports to filter notifications and dashboard feeds automatically.
              </p>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {SPORTS.map(sport => {
                  const isSelected = favoriteSports.includes(sport);
                  return (
                    <button
                      key={sport}
                      onClick={() => toggleFavoriteSport(sport)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                        isSelected
                          ? 'bg-neon-pink/15 text-neon-pink border-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.15)]'
                          : 'bg-dark-900 text-gray-400 border-dark-700/80 hover:text-white hover:border-dark-600'
                      }`}
                    >
                      {getSportEmoji(sport)} {sport}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSaveFavorites}
                disabled={isSavingFavorites}
                className="w-full bg-dark-850 hover:bg-neon-pink hover:text-dark-900 border border-dark-700 hover:border-neon-pink text-white px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widest"
              >
                {isSavingFavorites ? 'Saving Preferences...' : 'Save Preferences'}
              </button>
            </div>
          </div>
 
          {/* Right Column: Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800/30 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-dark-700/80 overflow-hidden">
              <div className="flex border-b border-dark-700/80 bg-dark-900/40 p-2 rounded-t-3xl gap-2">
                <button
                  onClick={() => setActiveTab('hosting')}
                  className={`flex-1 py-4 text-xs md:text-sm font-bold text-center rounded-2xl transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                    activeTab === 'hosting' ? 'text-neon-blue bg-dark-800/80 border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.05)]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Deployed Ops ({profileData?.hostedEvents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 py-4 text-xs md:text-sm font-bold text-center rounded-2xl transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                    activeTab === 'joined' ? 'text-neon-pink bg-dark-800/80 border border-neon-pink/30 shadow-[0_0_10px_rgba(255,0,255,0.05)]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Joined Squads ({profileData?.joinedEvents?.length || 0})
                </button>
              </div>
 
              <div className="p-6 md:p-8">
                {eventsToDisplay?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6 opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🏅</div>
                    <h3 className="text-xl text-white font-bold mb-2">Radar Clear</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                      {activeTab === 'hosting' 
                        ? "You haven't initiated any operations yet." 
                        : "You haven't enlisted in any operations yet."}
                    </p>
                    {activeTab === 'hosting' && (
                      <Link to="/dashboard" className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-neon-blue border border-neon-blue/40 hover:bg-neon-blue/10 transition-all duration-300 shadow-[0_0_10px_rgba(0,243,255,0.2)] cursor-pointer">
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
                        className="block bg-dark-900/40 hover:bg-dark-900/60 rounded-2xl p-5 border border-dark-700/60 hover:border-dark-600 transition-all duration-300 group hover:-translate-y-1 shadow-md hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)] animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2.5">
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest border ${getSportBadgeColor(event.sport)}`}>
                                {getSportEmoji(event.sport)} {event.sport}
                              </span>
                              <h4 className="font-extrabold text-base md:text-lg text-white group-hover:text-neon-blue transition-colors line-clamp-1">{event.title}</h4>
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-2 font-medium">
                              <span className="text-neon-pink">📅</span> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="self-start md:self-center">
                            <span className="text-[10px] font-bold text-gray-300 bg-dark-800 px-3 py-1.5 rounded-xl border border-dark-705 shadow-inner flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse-glow"></span>
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
