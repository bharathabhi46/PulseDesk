import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../api/http";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { formatDate, priorityClass, statusClass } from "../utils/format";

export const TicketDetail = () => {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [typing, setTyping] = useState(null);

  useEffect(() => {
    http.get(`/tickets/${id}`).then(({ data }) => {
      setTicket(data.ticket);
      setMessages(data.messages);
    });
  }, [id]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit("ticket:join", id);
    const onMessage = (message) => setMessages((items) => [...items.filter((item) => item._id !== message._id), message]);
    const onTicket = (updated) => setTicket(updated);
    const onTyping = (event) => setTyping(event.isTyping ? event.user.name : null);
    socket.on("message:created", onMessage);
    socket.on("ticket:updated", onTicket);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message:created", onMessage);
      socket.off("ticket:updated", onTicket);
      socket.off("typing", onTyping);
    };
  }, [socket, id]);

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    socket?.emit("message:send", { ticketId: id, body: reply });
    if (!socket) {
      const { data } = await http.post(`/tickets/${id}/messages`, { body: reply });
      setMessages((items) => [...items, data.message]);
    }
    setReply("");
  };

  const updateTicket = async (field, value) => {
    const { data } = await http.patch(`/tickets/${id}`, { [field]: value });
    setTicket(data.ticket);
  };

  if (!ticket) return <p className="text-sm text-ink/60">Loading ticket...</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-ink">{ticket.title}</h2>
              <p className="mt-2 text-sm text-ink/65">{ticket.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusClass[ticket.status]}>{ticket.status}</Badge>
              <Badge className={priorityClass[ticket.priority]}>{ticket.priority}</Badge>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-ink/60 sm:grid-cols-2">
            <span>Customer: {ticket.customer?.name}</span>
            <span>Assigned: {ticket.assignedTo?.name || "Unassigned"}</span>
            <span>Created: {formatDate(ticket.createdAt)}</span>
            <span>Updated: {formatDate(ticket.updatedAt)}</span>
          </div>
        </div>

        <div className="border border-line bg-white shadow-soft">
          <div className="border-b border-line p-4">
            <h3 className="font-semibold text-ink">Live chat</h3>
            {typing && <p className="text-xs text-mint">{typing} is typing</p>}
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message._id} className="border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-3 text-xs text-ink/50">
                  <span className="font-semibold capitalize text-ink">{message.sender?.name} · {message.sender?.role}</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-ink/75">{message.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendReply} className="flex gap-2 border-t border-line p-4">
            <input
              className="focus-ring flex-1 border border-line bg-surface px-3 py-3"
              placeholder="Reply to conversation"
              value={reply}
              onChange={(event) => {
                setReply(event.target.value);
                socket?.emit("typing", { ticketId: id, isTyping: Boolean(event.target.value) });
              }}
            />
            <button className="focus-ring bg-ink px-4 text-white" aria-label="Send reply">
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="border border-line bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-coral" />
            <h3 className="font-semibold text-ink">AI assist</h3>
          </div>
          <Info label="Summary" value={ticket.ai?.summary || "No summary yet"} />
          <Info label="Suggested reply" value={ticket.ai?.suggestedReply || "No suggestion yet"} />
          <Info label="Sentiment" value={`${ticket.ai?.sentiment?.label || "neutral"} (${ticket.ai?.sentiment?.score ?? 0})`} />
          <Info label="Detected priority" value={ticket.ai?.detectedPriority || ticket.priority} />
          <button type="button" onClick={() => setReply(ticket.ai?.suggestedReply || "")} className="focus-ring mt-3 flex items-center gap-2 border border-ink px-3 py-2 text-sm font-semibold">
            <Bot size={16} />
            Use suggested reply
          </button>
        </div>

        {isStaff && (
          <div className="border border-line bg-white p-4 shadow-soft">
            <h3 className="font-semibold text-ink">Ticket controls</h3>
            <label className="mt-3 block text-sm">
              <span className="text-ink/60">Status</span>
              <select className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2" value={ticket.status} onChange={(event) => updateTicket("status", event.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_on_customer">Waiting on customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-ink/60">Priority</span>
              <select className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2" value={ticket.priority} onChange={(event) => updateTicket("priority", event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
        )}
      </aside>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="border-b border-line py-3 last:border-b-0">
    <p className="text-xs font-semibold uppercase text-ink/45">{label}</p>
    <p className="mt-1 text-sm text-ink/75">{value}</p>
  </div>
);
