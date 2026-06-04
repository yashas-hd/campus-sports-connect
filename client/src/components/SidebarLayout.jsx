import { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
  FiGrid, 
  FiCalendar, 
  FiTarget, 
  FiBarChart2, 
  FiBell, 
  FiUser, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiCheckCircle 
} from 'react-icons/fi';
import { MdSportsBasketball } from 'react-icons/md';

const SidebarLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('campus_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync notifications with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('campus_notifications');
      if (saved) setNotifications(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('campus_notify', handleStorageChange);

    return () => {
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

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('campus_notifications');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Events', path: '/dashboard?tab=events', icon: FiCalendar },
    { name: 'Tryouts', path: '/dashboard?tab=tryouts', icon: FiTarget },
    { name: 'Analytics', path: '/analytics', icon: FiBarChart2 },
    { name: 'Notifications', type: 'button', onClick: () => setShowNotifications(true), icon: FiBell, badge: notifications.length },
    { name: 'Profile', path: '/profile', icon: FiUser },
    { name: 'Logout', type: 'button', onClick: handleLogout, icon: FiLogOut }
  ];

  const checkIsActive = (item) => {
    if (item.type === 'button') return false;
    const currentPath = location.pathname + location.search;
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search.includes('tab=');
    }
    return currentPath.includes(item.path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <MdSportsBasketball className="h-5 w-5 text-white animate-spin-slow" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block">
            Campus Connect
          </span>
          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block">
            Sports Platform
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = checkIsActive(item);
          
          if (item.type === 'button') {
            return (
              <button
                key={item.name}
                onClick={() => {
                  item.onClick();
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer group border-l-2 border-l-transparent"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5 text-slate-400 group-hover:text-white transition-colors" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all group border-l-2 ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-500 border-l-blue-600' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white border-l-transparent'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-colors ${
                isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-white'
              }`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-dark-900 text-slate-100 font-sans">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-slate-800/80 shadow-md">
        <SidebarContent />
      </aside>

      {/* Main Content Layout Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Sticky Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-slate-950 border-b border-slate-800/85 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MdSportsBasketball className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Campus Connect
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Slide-in Sidebar */}
      {isMobileOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-850 z-50 animate-slide-in-left">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Notifications Side Drawer */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-900 border-l border-slate-700 z-[9999] flex flex-col shadow-2xl animate-slide-in-right">
            <div className="h-16 px-6 border-b border-slate-700 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-sm">🔔</span>
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] font-bold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3 bg-slate-900">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
                    <FiCheckCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">All caught up!</p>
                  <p className="text-[10px] text-slate-500 mt-1">No pending notifications at this moment.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-slate-950 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/60 rounded-xl transition-all duration-200 flex gap-3 items-start shadow-sm hover:shadow-md relative overflow-hidden group">
                    {/* Left Accent Indicator Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>

                    {/* Status Dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white leading-relaxed font-medium mb-1.5 break-words">
                        {notif.message}
                      </p>
                      {/* Secondary timestamp text */}
                      <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                        {new Date(notif.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.id).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Dismiss Button */}
                    <button 
                      onClick={() => removeNotification(notif.id)}
                      className="flex-shrink-0 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer text-xs"
                      title="Dismiss notification"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SidebarLayout;
