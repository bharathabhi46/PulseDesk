import { useEffect, useState } from "react";
import { http } from "../api/http";

export const Team = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    http.get("/auth/users").then(({ data }) => setUsers(data.users));
  }, []);

  return (
    <div className="overflow-hidden border border-line bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-ink/60">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b border-line last:border-b-0">
              <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
              <td className="px-4 py-3 text-ink/65">{user.email}</td>
              <td className="px-4 py-3 capitalize text-ink/65">{user.role}</td>
              <td className="px-4 py-3 text-ink/65">{user.isActive ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
