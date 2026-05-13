import { Bell, LayoutDashboard, LogOut, MessageSquarePlus, Ticket, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/tickets/new", label: "New Ticket", icon: MessageSquarePlus },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/team", label: "Team", icon: Users, staffOnly: true }
];

export const AppLayout = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white p-5 lg:block">
        <div className="text-2xl font-black tracking-tight text-ink">PulseDesk</div>
        <p className="mt-1 text-sm capitalize text-ink/55">{user?.role} workspace</p>
        <nav className="mt-8 space-y-1">
          {navItems
            .filter((item) => !item.staffOnly || isStaff)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-surface hover:text-ink"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <button onClick={handleLogout} className="focus-ring absolute bottom-5 flex items-center gap-3 px-3 py-2 text-sm text-ink/65">
          <LogOut size={18} />
          Sign out
        </button>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-mint">AI customer operations</p>
              <h1 className="text-xl font-semibold text-ink">Support command center</h1>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-ink">{user?.name}</p>
              <p className="capitalize text-ink/55">{user?.role}</p>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
