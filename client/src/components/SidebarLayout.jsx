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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950 border-l border-slate-800/85 z-55 flex flex-col shadow-2xl animate-slide-in-right">
            <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🔔</span>
                <h3 className="font-bold text-sm text-white">Notifications</h3>
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
                    className="text-[10px] font-bold text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    CLEAR ALL
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2.5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                  <FiCheckCircle className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-xs font-semibold">All caught up!</p>
                  <p className="text-[10px] text-slate-600 mt-1">No pending notifications at this moment.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 hover:border-slate-800 rounded-xl transition-all duration-200 group relative flex gap-3">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1 pr-6">
                      <p className="text-xs text-slate-350 leading-relaxed font-medium">{notif.message}</p>
                    </div>
                    <button 
                      onClick={() => removeNotification(notif.id)}
                      className="absolute top-3.5 right-4 text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer text-xs"
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
