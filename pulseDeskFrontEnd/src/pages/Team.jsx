import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../context/AuthContext";
import { UserPlus, UserCheck, UserX, Shield } from "lucide-react";

export const Team = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  
  // Create staff form state
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent", department: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = ["admin", "superadmin"].includes(currentUser?.role);

  const fetchUsers = async () => {
    try {
      const { data } = await http.get("/auth/users");
      setUsers(data.users);
    } catch (err) {
      console.error("Error loading team users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await http.post("/auth/users", form);
      setSuccess("Staff member created successfully!");
      setForm({ name: "", email: "", password: "", role: "agent", department: "" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create staff member.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await http.patch(`/auth/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await http.patch(`/auth/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user role.");
    }
  };

  const handleDepartmentChange = async (userId, newDept) => {
    try {
      await http.patch(`/auth/users/${userId}`, { department: newDept });
    } catch (err) {
      console.error("Failed to update department", err);
    }
  };

  return (
    <div className={`grid gap-6 ${isAdmin ? "xl:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
      {/* Users List Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="text-xl font-bold text-ink">Team Directory</h2>
          <span className="text-xs text-ink/45">{users.length} members</span>
        </div>
        <div className="overflow-x-auto border border-line bg-white shadow-soft rounded">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-line bg-surface text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {isAdmin && <th className="px-4 py-3 font-semibold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-line last:border-b-0 hover:bg-surface/20 transition">
                  <td className="px-4 py-3 font-medium text-ink">
                    <div className="flex items-center gap-1.5">
                      {user.role === "superadmin" && <Shield size={14} className="text-coral" />}
                      {user.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/65">{user.email}</td>
                  <td className="px-4 py-3 text-ink/65">
                    {isAdmin ? (
                      <input
                        type="text"
                        defaultValue={user.department || ""}
                        placeholder="e.g. Sales, Dev"
                        onBlur={(e) => handleDepartmentChange(user._id, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-line focus:border-ink outline-none px-1 py-0.5 max-w-28 text-sm transition"
                      />
                    ) : (
                      user.department || "General"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && user._id !== currentUser._id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-transparent border border-line focus:border-ink outline-none p-1 text-sm rounded"
                      >
                        <option value="customer">Customer</option>
                        <option value="agent">Agent</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    ) : (
                      <span className="capitalize px-2 py-0.5 text-xs font-semibold bg-surface border border-line text-ink rounded">
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/65">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                      user.isActive 
                        ? "bg-mint/10 border-mint/20 text-ink/80" 
                        : "bg-coral/10 border-coral/20 text-coral"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      {user._id !== currentUser._id ? (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 border rounded transition ${
                            user.isActive
                              ? "border-coral/20 text-coral hover:bg-coral/10"
                              : "border-mint/20 text-mint hover:bg-mint/10"
                          }`}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                          {user.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      ) : (
                        <span className="text-2xs text-ink/40 font-medium">Current User</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin User Management Sidebar */}
      {isAdmin && (
        <aside className="space-y-4">
          <form onSubmit={handleCreateStaff} className="border border-line bg-white p-5 shadow-soft rounded space-y-4">
            <div className="flex items-center gap-2 text-ink border-b border-line pb-2 mb-2">
              <UserPlus size={18} />
              <h3 className="font-bold text-base">Add Staff Member</h3>
            </div>
            
            <label className="block text-sm">
              <span className="text-ink/60 font-semibold">Name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded text-sm text-ink"
                placeholder="Full Name"
              />
            </label>

            <label className="block text-sm">
              <span className="text-ink/60 font-semibold">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded text-sm text-ink"
                placeholder="email@pulsedesk.dev"
              />
            </label>

            <label className="block text-sm">
              <span className="text-ink/60 font-semibold">Temp Password</span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded text-sm text-ink"
                placeholder="Password (min 8 chars)"
              />
            </label>

            <div className="grid gap-2 grid-cols-2">
              <label className="block text-sm">
                <span className="text-ink/60 font-semibold text-xs">Role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="focus-ring mt-1 w-full border border-line bg-surface px-2 py-2 rounded text-sm text-ink"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-ink/60 font-semibold text-xs">Department</span>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="focus-ring mt-1 w-full border border-line bg-surface px-2 py-2 rounded text-sm text-ink"
                  placeholder="e.g. Success"
                />
              </label>
            </div>

            {error && (
              <p className="border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 rounded whitespace-pre-wrap">
                {error}
              </p>
            )}

            {success && (
              <p className="border border-mint bg-mint/10 p-2.5 text-xs text-ink/80 rounded">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full bg-ink hover:bg-ink/90 text-white font-semibold py-2.5 rounded text-sm disabled:opacity-60 transition"
            >
              {loading ? "Adding..." : "Add Staff Member"}
            </button>
          </form>
        </aside>
      )}
    </div>
  );
};
