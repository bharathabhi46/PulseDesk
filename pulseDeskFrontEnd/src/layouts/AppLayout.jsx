import { Bell, LayoutDashboard, LogOut, Menu, MessageSquarePlus, Ticket, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/tickets/new", label: "New Ticket", icon: MessageSquarePlus },
  { to: "/notifications", label: "Alerts", icon: Bell, hasBadge: true },
  { to: "/team", label: "Team", icon: Users, staffOnly: true }
];

export const AppLayout = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const { data } = await http.get("/notifications");
      const count = data.notifications.filter((n) => !n.readAt).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Error loading notification count", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]); // refetch when navigating to/from Alerts

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:created", handleNewNotification);
    return () => {
      socket.off("notification:created", handleNewNotification);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderNavLinks = () => (
    <nav className="space-y-1.5">
      {navItems
        .filter((item) => !item.staffOnly || isStaff)
        .map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 text-sm font-medium transition duration-200 rounded ${
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              {item.label}
            </div>
            {item.hasBadge && unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-2xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white p-5 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-mint animate-pulse" />
            <div className="text-2xl font-black tracking-tight text-ink">PulseDesk</div>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink/45">
            {user?.role} workspace
          </p>
          <div className="mt-8">{renderNavLinks()}</div>
        </div>
        <button
          onClick={handleLogout}
          className="focus-ring flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink/65 hover:text-ink hover:bg-ink/5 transition rounded"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      {/* Mobile Drawer (Backdrop + Content) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-white p-5 border-r border-line transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-mint" />
              <div className="text-xl font-black text-ink">PulseDesk</div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 text-ink/60 hover:text-ink"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink/45">
            {user?.role} workspace
          </p>
          <div className="mt-8">{renderNavLinks()}</div>
        </div>
        <button
          onClick={handleLogout}
          className="focus-ring flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-ink/65 hover:text-ink hover:bg-ink/5 transition rounded"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 border border-line text-ink hover:bg-ink/5 lg:hidden transition"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mint">
                  AI Customer Support
                </p>
                <h1 className="text-base font-semibold text-ink sm:text-lg">
                  Support Command Center
                </h1>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-ink leading-tight">{user?.name}</p>
              <p className="text-xs capitalize text-ink/55">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
