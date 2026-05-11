import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-surface text-sm">Loading PulseDesk...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
