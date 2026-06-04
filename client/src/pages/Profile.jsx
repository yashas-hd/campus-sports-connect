import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
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

  if (loading || !profileData) {
    return (
      <SidebarLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-800/40 rounded-2xl p-8 border border-zinc-800 h-[500px]">
              <div className="h-28 w-28 rounded-2xl mx-auto mb-6 bg-dark-900/60 border border-zinc-800"></div>
              <div className="h-8 w-3/4 mx-auto rounded mb-2 bg-dark-900/60"></div>
              <div className="h-4 w-1/2 mx-auto rounded mb-8 bg-dark-900/60"></div>
              <div className="h-24 w-full rounded-xl mb-6 bg-dark-900/60"></div>
              <div className="h-10 w-full rounded-xl bg-dark-900/60"></div>
            </div>
          </div>
          {/* Right Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800/40 rounded-2xl p-8 border border-zinc-800 min-h-[500px]">
              <div className="flex gap-4 mb-8">
                <div className="h-12 flex-1 rounded-xl bg-dark-900/60"></div>
                <div className="h-12 flex-1 rounded-xl bg-dark-900/60"></div>
              </div>
              <div className="space-y-4">
                {Array(3).fill().map((_, i) => (
                  <div key={i} className="h-24 w-full rounded-2xl bg-dark-900/60 border border-zinc-800"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const eventsToDisplay = activeTab === 'hosting' ? (profileData?.hostedEvents || []) : (profileData?.joinedEvents || []);

  return (
    <SidebarLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
          
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-800/30 p-8 rounded-2xl shadow-sm border border-dark-700 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/20"></div>
              <div className="relative h-28 w-28 rounded-2xl bg-dark-900 border border-dark-700 flex items-center justify-center text-white text-5xl font-extrabold uppercase mx-auto mb-6 shadow-inner z-10 hover:border-blue-500 transition-all duration-300">
                {profileData?.name?.charAt(0) || ''}
              </div>
              
              {!isEditing ? (
                <div className="relative z-10 animate-fade-in-up">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{profileData?.name || ''}</h2>
                  <p className="text-xs font-semibold text-blue-500 tracking-wider uppercase mt-1.5 mb-6">{profileData?.college || ''}</p>
                  
                  <div className="text-left mt-6 space-y-5">
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="w-1 h-3 bg-blue-600 rounded-full"></span> Bio Briefing</h3>
                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-dark-900/50 p-4 rounded-xl border border-dark-700/60 shadow-inner">
                        {profileData?.bio || 'No operations bio briefing logged.'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><span className="w-1 h-3 bg-blue-600 rounded-full"></span> Combat Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {(profileData?.sportsInterests || []).length > 0 ? (
                          profileData.sportsInterests.map((sport, idx) => (
                            <span key={idx} className="bg-dark-900 border border-dark-700/60 text-slate-300 text-[10px] font-semibold px-3 py-1 rounded-lg">
                              {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">None specified.</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3.5 mt-4">
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 col-span-2 shadow-inner">
                          <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-2.5">Favored Sports</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(profileData?.preferredSports || []).length > 0 ? (
                              profileData.preferredSports.map((sport, idx) => (
                                <span key={idx} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${getSportBadgeColor(sport)}`}>
                                  {getSportEmoji(sport)} {sport}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 shadow-inner">
                          <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Position</span>
                          <span className="text-xs text-slate-300 font-semibold">{profileData?.preferredPosition || 'N/A'}</span>
                        </div>
                        <div className="bg-dark-900/40 p-3.5 rounded-xl border border-dark-700/60 shadow-inner">
                          <span className="block text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Tier / Rank</span>
                          <span className="text-xs text-blue-500 font-bold">{profileData?.experienceLevel || 'Beginner'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-8 w-full bg-dark-850 hover:bg-dark-750 text-white border border-dark-700 hover:border-blue-500/40 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer uppercase tracking-wider"
                  >
                    Edit Credentials
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="text-left space-y-4 mt-4 relative z-10 animate-fade-in-up">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Display Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Operational Bio</label>
                    <textarea
                      name="bio"
                      rows="4"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-xs resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Combat Specialties (comma separated)</label>
                    <input
                      type="text"
                      name="sportsInterests"
                      value={formData.sportsInterests}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-xs"
                      placeholder="e.g., Basketball, Tennis"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Favored Sports (Max 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {SPORTS.map(sport => {
                          const isSelected = formData.preferredSports.includes(sport);
                          return (
                            <button
                              key={sport}
                              type="button"
                              onClick={() => togglePreferredSport(sport)}
                              className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-600/15 text-blue-400 border-blue-500/40 shadow-sm' 
                                  : 'bg-dark-900 text-slate-400 border-dark-700/60 hover:border-slate-500'
                              }`}
                            >
                              {getSportEmoji(sport)} {sport}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Position</label>
                      <input
                        type="text"
                        name="preferredPosition"
                        value={formData.preferredPosition}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-xs"
                        placeholder="e.g., Striker"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tier / Experience</label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-all text-xs [color-scheme:dark]"
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
                      className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-300 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-750 hover:text-white transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Save Data
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Favorite Sports Section */}
            <div className="bg-dark-800/30 p-6 rounded-2xl shadow-sm border border-dark-700 relative overflow-hidden">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>⚡</span> Preferences
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Select favorite sports to filter notifications and dashboard feeds automatically.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {SPORTS.map(sport => {
                  const isSelected = favoriteSports.includes(sport);
                  return (
                    <button
                      key={sport}
                      onClick={() => toggleFavoriteSport(sport)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15 text-blue-400 border-blue-500/40 shadow-sm'
                          : 'bg-dark-900 text-slate-400 border-dark-700/80 hover:text-white hover:border-slate-500'
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
                className="w-full bg-dark-850 hover:bg-blue-600 text-white hover:text-white border border-dark-700 hover:border-blue-600 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
              >
                {isSavingFavorites ? 'Saving Preferences...' : 'Save Preferences'}
              </button>
            </div>
          </div>
 
          {/* Right Column: Events */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800/30 rounded-2xl shadow-sm border border-dark-700 overflow-hidden">
              <div className="flex border-b border-dark-700/85 bg-dark-900/40 p-2 rounded-t-2xl gap-2">
                <button
                  onClick={() => setActiveTab('hosting')}
                  className={`flex-1 py-3 text-xs md:text-sm font-semibold text-center rounded-xl transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                    activeTab === 'hosting' ? 'text-blue-400 bg-dark-800 border border-blue-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Deployed Ops ({profileData?.hostedEvents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 py-3 text-xs md:text-sm font-semibold text-center rounded-xl transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                    activeTab === 'joined' ? 'text-blue-400 bg-dark-800 border border-blue-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Joined Squads ({profileData?.joinedEvents?.length || 0})
                </button>
              </div>
  
              <div className="p-6 md:p-8">
                {eventsToDisplay?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4 opacity-50">🏅</div>
                    <h3 className="text-lg text-white font-bold mb-1">Radar Clear</h3>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto mb-5">
                      {activeTab === 'hosting' 
                        ? "You haven't initiated any operations yet." 
                        : "You haven't enlisted in any operations yet."}
                    </p>
                    {activeTab === 'hosting' && (
                      <Link to="/dashboard" className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-blue-500 border border-blue-500/30 hover:bg-blue-500/5 transition-all duration-200 cursor-pointer">
                        Initialize One Now &rarr;
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {eventsToDisplay.map((event, index) => (
                      <Link 
                        key={event._id} 
                        to={`/events/${event._id}`}
                        className="block bg-dark-900/40 hover:bg-dark-900/60 rounded-xl p-4.5 p-5 border border-dark-700/60 hover:border-slate-700 transition-all duration-200 group hover:-translate-y-0.5 shadow-sm animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider border ${getSportBadgeColor(event.sport)}`}>
                                {getSportEmoji(event.sport)} {event.sport}
                              </span>
                              <h4 className="font-bold text-base text-white group-hover:text-blue-500 transition-colors line-clamp-1">{event.title}</h4>
                            </div>
                            <p className="text-xs text-slate-405 flex items-center gap-1.5 font-normal">
                              <span>📅</span> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="self-start md:self-center">
                            <span className="text-[10px] font-semibold bg-dark-800 px-2.5 py-1 rounded text-slate-350 border border-dark-700 shadow-inner flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
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
    </SidebarLayout>
  );
};
 
export default Profile;
