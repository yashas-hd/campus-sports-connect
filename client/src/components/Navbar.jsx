import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { MdSportsBasketball } from 'react-icons/md';
import { FaBell } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('campus_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    const handleStorageChange = () => {
      const saved = localStorage.getItem('campus_notifications');
      if (saved) setNotifications(JSON.parse(saved));
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('campus_notify', handleStorageChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('campus_notify', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const removeNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('campus_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center gap-3 group">
              <div className="bg-gradient-to-br from-neon-blue to-neon-green p-2.5 rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] transition-all duration-300">
                <MdSportsBasketball className="h-7 w-7 text-dark-900" />
              </div>
              <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-tight group-hover:from-neon-blue group-hover:to-neon-green transition-all duration-300">
                Campus Connect
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-neon-blue px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200">
                  Dashboard
                </Link>
                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-300 hover:text-neon-pink transition-colors focus:outline-none mt-1"
                  >
                    <FaBell className="h-6 w-6" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-neon-pink rounded-full border-2 border-dark-900 shadow-[0_0_10px_rgba(255,0,255,0.5)] animate-pulse-glow">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-dark-800/95 backdrop-blur-xl border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-dark-700 bg-dark-900/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="text-neon-pink">🔔</span> Notifications
                        </h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => {
                              setNotifications([]);
                              localStorage.removeItem('campus_notifications');
                              setShowNotifications(false);
                            }}
                            className="text-xs text-gray-400 hover:text-neon-blue transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">
                            No new notifications
                          </div>
                        ) : (
                          <div className="divide-y divide-dark-700">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-dark-700/50 transition-colors group relative">
                                <div className="flex gap-3">
                                  <div className="h-2 w-2 mt-1.5 rounded-full bg-neon-blue flex-shrink-0 animate-pulse-glow"></div>
                                  <p className="text-sm text-gray-300 pr-4">{notif.message}</p>
                                </div>
                                <button 
                                  onClick={() => removeNotification(notif.id)}
                                  className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-500 hover:text-neon-pink opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-2 focus:outline-none">
                    <div className="h-10 w-10 rounded-full bg-dark-800 border-2 border-dark-700 group-hover:border-neon-pink flex items-center justify-center text-white font-bold transition-colors duration-300 shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div className="absolute right-0 w-56 mt-3 origin-top-right bg-dark-800/95 backdrop-blur-md border border-dark-700 divide-y divide-dark-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-4 border-b border-dark-700">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-700 hover:text-neon-blue transition-colors"
                      >
                        Your Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-neon-blue to-neon-pink text-dark-900 px-5 py-2.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(0,243,255,0.2)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] animate-pulse-glow transition-all duration-300"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
