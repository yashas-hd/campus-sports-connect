import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

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
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
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
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payload = {
        name: formData.name,
        bio: formData.bio,
        sportsInterests: formData.sportsInterests.split(',').map(s => s.trim()).filter(s => s !== ''),
      };

      const { data } = await axios.put('http://localhost:5000/api/users/profile', payload, config);
      
      // Update local context and state
      login({ ...user, name: data.name });
      setProfileData({ ...profileData, name: data.name, bio: data.bio, sportsInterests: data.sportsInterests });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
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

  const eventsToDisplay = activeTab === 'hosting' ? profileData.hostedEvents : profileData.joinedEvents;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-4xl font-bold uppercase mx-auto mb-4">
                {profileData.name.charAt(0)}
              </div>
              
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{profileData.college}</p>
                  
                  <div className="text-left mt-6 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">About Me</h3>
                      <p className="text-sm text-gray-700">{profileData.bio || 'No bio added yet.'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sports Interests</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.sportsInterests?.length > 0 ? (
                          profileData.sportsInterests.map((sport, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                              {sport}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">None specified.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="mt-8 w-full bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="text-left space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sports Interests (comma separated)</label>
                    <input
                      type="text"
                      name="sportsInterests"
                      value={formData.sportsInterests}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="e.g., Basketball, Tennis"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Events */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('hosting')}
                  className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                    activeTab === 'hosting' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Events I'm Hosting ({profileData.hostedEvents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('joined')}
                  className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                    activeTab === 'joined' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Events I've Joined ({profileData.joinedEvents?.length || 0})
                </button>
              </div>

              <div className="p-6">
                {eventsToDisplay?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🏅</div>
                    <h3 className="text-gray-900 font-medium mb-1">No events yet</h3>
                    <p className="text-gray-500 text-sm">
                      {activeTab === 'hosting' 
                        ? "You haven't created any events yet." 
                        : "You haven't joined any events yet."}
                    </p>
                    {activeTab === 'hosting' && (
                      <Link to="/dashboard" className="inline-block mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-800">
                        Create one now &rarr;
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventsToDisplay.map((event) => (
                      <Link 
                        key={event._id} 
                        to={`/events/${event._id}`}
                        className="block bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                {event.sport}
                              </span>
                              <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                              {event.participants?.length} / {event.maxParticipants || '∞'} px
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
