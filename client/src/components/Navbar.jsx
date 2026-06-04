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
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2 group">
              <div className="bg-blue-600 p-2 rounded-lg transition-all duration-200 group-hover:bg-blue-500">
                <MdSportsBasketball className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-100 tracking-tight transition-all duration-200">
                Campus Connect
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-blue-500 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 uppercase tracking-wider cursor-pointer">
                  Dashboard
                </Link>
                <Link to="/analytics" className="text-slate-300 hover:text-blue-500 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 uppercase tracking-wider cursor-pointer">
                  Analytics
                </Link>
                {/* Notification Bell */}
                <div className="relative">
                   <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-350 hover:text-blue-500 transition-colors focus:outline-none cursor-pointer"
                  >
                    <FaBell className="h-4.5 w-4.5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold leading-none text-white bg-blue-600 rounded-full border border-slate-900 shadow-sm">
                        {notifications.length}
                      </span>
                    )}
                  </button>
 
                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-up">
                      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          🔔 Notifications
                        </h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => {
                              setNotifications([]);
                              localStorage.removeItem('campus_notifications');
                              setShowNotifications(false);
                            }}
                            className="text-[10px] font-semibold text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-slate-500 text-xs font-medium">
                            No notifications logged.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-800/60">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-slate-800/20 transition-colors group relative">
                                <div className="flex gap-2">
                                  <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                  <p className="text-xs text-slate-300 pr-5 leading-relaxed">{notif.message}</p>
                                </div>
                                <button 
                                  onClick={() => removeNotification(notif.id)}
                                  className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer text-xs"
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
                  <button className="flex items-center gap-2 focus:outline-none cursor-pointer">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-200 shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div className="absolute right-0 w-56 mt-2.5 origin-top-right bg-slate-900 border border-slate-800 divide-y divide-slate-800/60 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Authenticated User</p>
                      <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2 text-xs text-slate-350 hover:bg-slate-800/40 hover:text-blue-500 transition-colors font-semibold uppercase tracking-wider"
                      >
                        Your Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-slate-800/40 hover:text-red-300 transition-colors font-semibold uppercase tracking-wider cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase tracking-wider">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm uppercase tracking-wider cursor-pointer"
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
