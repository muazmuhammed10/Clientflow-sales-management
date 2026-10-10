import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building2,
  DollarSign,
  Kanban,
  CheckSquare,
  BarChart3,
  ShieldAlert,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Plus,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Modal } from '../components/common/Modal';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    leads: any[];
    contacts: any[];
    companies: any[];
    deals: any[];
  }>({ leads: [], contacts: [], companies: [], deals: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadNotificationsCount(res.data.unreadCount || 0);
        }
      } catch {
        // Silently handle
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ leads: [], contacts: [], companies: [], deals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch {
        // Silently handle
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMarkNotificationRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      if (link) navigate(link);
    } catch {
      // Silently handle
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: UserPlus },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Deals', path: '/deals', icon: DollarSign },
    { name: 'Sales Pipeline', path: '/pipeline', icon: Kanban },
    { name: 'Tasks & Activities', path: '/tasks', icon: CheckSquare },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ...(user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN'
      ? [{ name: 'Team Management', path: '/team', icon: ShieldAlert }]
      : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#080d16] text-slate-100 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0f1b] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/25">
              CF
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base">ClientFlow</span>
              <span className="block text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Sales CRM
              </span>
            </div>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Name Card */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Workspace</div>
          <div className="text-xs font-bold text-white truncate mt-0.5">
            {user?.organizationName || 'Apex Enterprises'}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-brand-600/30 text-white border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-emerald-400 truncate capitalize font-medium">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0a0f1b]/90 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between z-10 backdrop-blur-md">
          {/* Left: Mobile hamburger + search bar */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick search input trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:border-emerald-500/40 hover:text-slate-200 bg-white/5 text-xs w-56 sm:w-72 transition-all duration-200"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex-1 text-left">Search CRM records...</span>
              <kbd className="hidden sm:inline-block font-sans px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick actions + notifications + profile */}
          <div className="flex items-center gap-3">
            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0a0f1b]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0e1628] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-xs font-bold text-white">
                      Notifications ({unreadNotificationsCount} unread)
                    </span>
                    <button
                      onClick={async () => {
                        await api.post('/notifications/read-all');
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                        setUnreadNotificationsCount(0);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotificationRead(n.id, n.link)}
                          className={`p-3 text-left cursor-pointer transition-colors hover:bg-white/5 ${
                            !n.isRead ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 text-slate-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0e1628] rounded-xl shadow-2xl border border-white/10 py-1.5 z-50 animate-scale-in">
                  <div className="px-3.5 py-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile & Settings</span>
                  </button>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#080d16]">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setSearchQuery('');
        }}
        title="Global CRM Search"
        description="Search across Leads, Contacts, Companies, and Deals"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-[#0a0f1b] text-white"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {isSearching ? (
              <p className="text-center text-xs text-slate-400 py-6">Searching records...</p>
            ) : searchQuery.length < 2 ? (
              <p className="text-center text-xs text-slate-400 py-6">
                Type at least 2 characters to search across your CRM...
              </p>
            ) : Object.values(searchResults).every((arr) => arr.length === 0) ? (
              <p className="text-center text-xs text-slate-400 py-6">
                No matching records found for "{searchQuery}"
              </p>
            ) : (
              <>
                {searchResults.leads.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Leads
                    </h4>
                    <div className="space-y-1">
                      {searchResults.leads.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSearchModalOpen(false);
                            navigate(item.url);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-white">{item.title}</span>
                            <span className="text-xs text-slate-400 ml-2">{item.subtitle}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.contacts.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-brand-400 uppercase tracking-wider mb-2">
                      Contacts
                    </h4>
                    <div className="space-y-1">
                      {searchResults.contacts.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSearchModalOpen(false);
                            navigate(item.url);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-white">{item.title}</span>
                            <span className="text-xs text-slate-400 ml-2">{item.subtitle}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.deals.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                      Deals
                    </h4>
                    <div className="space-y-1">
                      {searchResults.deals.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSearchModalOpen(false);
                            navigate(item.url);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-white">{item.title}</span>
                            <span className="text-xs text-slate-400 ml-2">{item.subtitle}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
