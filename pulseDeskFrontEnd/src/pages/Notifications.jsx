import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { formatDate } from "../utils/format";

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    http.get("/notifications").then(({ data }) => setNotifications(data.notifications));
  }, []);

  const markRead = async (id) => {
    const { data } = await http.patch(`/notifications/${id}/read`);
    setNotifications((items) => items.map((item) => (item._id === id ? data.notification : item)));
  };

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification._id} className="flex flex-wrap items-center justify-between gap-3 border border-line bg-white p-4 shadow-soft">
          <Link to={notification.link || "#"}>
            <p className="font-semibold text-ink">{notification.title}</p>
            <p className="text-sm text-ink/65">{notification.body}</p>
            <p className="mt-1 text-xs text-ink/45">{formatDate(notification.createdAt)}</p>
          </Link>
          {!notification.readAt && (
            <button onClick={() => markRead(notification._id)} className="focus-ring flex items-center gap-2 border border-line px-3 py-2 text-sm">
              <CheckCheck size={16} />
              Mark read
            </button>
          )}
        </div>
      ))}
      {!notifications.length && <p className="border border-line bg-white p-6 text-sm text-ink/60">No notifications yet.</p>}
    </div>
  );
};
