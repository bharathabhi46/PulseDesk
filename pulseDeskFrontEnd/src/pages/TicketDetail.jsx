import { Bot, Paperclip, Send, Sparkles, X } from "lucide-react";
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
  const [files, setFiles] = useState([]);
  const [typing, setTyping] = useState(null);
  const [sending, setSending] = useState(false);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    if (isStaff) {
      http.get("/auth/users").then(({ data }) => {
        const staff = data.users.filter((u) =>
          ["superadmin", "admin", "manager", "agent"].includes(u.role)
        );
        setStaffList(staff);
      }).catch((err) => console.error("Failed to load staff list", err));
    }
  }, [isStaff]);

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
    if (!reply.trim() && files.length === 0) return;
    setSending(true);

    try {
      if (files.length > 0) {
        const payload = new FormData();
        payload.append("body", reply);
        files.forEach((file) => payload.append("attachments", file));
        
        const { data } = await http.post(`/tickets/${id}/messages`, payload);
        if (!socket) {
          setMessages((items) => [...items, data.message]);
        }
        setFiles([]);
      } else {
        socket?.emit("message:send", { ticketId: id, body: reply });
        if (!socket) {
          const { data } = await http.post(`/tickets/${id}/messages`, { body: reply });
          setMessages((items) => [...items, data.message]);
        }
      }
      setReply("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const updateTicket = async (field, value) => {
    const { data } = await http.patch(`/tickets/${id}`, { [field]: value });
    setTicket(data.ticket);
  };

  const handleAssignChange = async (value) => {
    try {
      const { data } = await http.patch(`/tickets/${id}/assign`, { agentId: value || null });
      setTicket(data.ticket);
    } catch (err) {
      console.error("Failed to assign ticket", err);
    }
  };

  if (!ticket) return <p className="text-sm text-ink/60 p-6">Loading ticket...</p>;

  // Helper to draw sentiment emoji
  const getSentimentEmoji = (label) => {
    switch (label) {
      case "positive": return "😊";
      case "neutral": return "😐";
      case "negative": return "☹️";
      case "angry": return "😡";
      default: return "😐";
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        {/* Ticket Header & Description */}
        <div className="border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">{ticket.title}</h2>
              <p className="mt-2 text-sm text-ink/65 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusClass[ticket.status]}>{ticket.status}</Badge>
              <Badge className={priorityClass[ticket.priority]}>{ticket.priority}</Badge>
            </div>
          </div>
          
          <div className="mt-4 grid gap-3 text-sm text-ink/60 sm:grid-cols-2">
            <span>Customer: <strong>{ticket.customer?.name}</strong></span>
            <span>Assigned: <strong>{ticket.assignedTo?.name || "Unassigned"}</strong></span>
            <span>Created: {formatDate(ticket.createdAt)}</span>
            <span>Updated: {formatDate(ticket.updatedAt)}</span>
          </div>

          {/* Ticket Level Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-5 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Ticket Attachments</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ticket.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-line bg-surface hover:bg-ink/5 px-2.5 py-1.5 text-xs font-medium text-ink transition rounded"
                  >
                    <span className="truncate max-w-40">{file.originalName || "Attachment"}</span>
                    <span className="text-[10px] text-ink/40">({Math.round(file.size / 1024)} KB)</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat / Messages Panel */}
        <div className="border border-line bg-white shadow-soft flex flex-col">
          <div className="border-b border-line p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">Live Chat Log</h3>
              {typing && <p className="text-xs text-mint animate-pulse">{typing} is typing...</p>}
            </div>
          </div>
          
          {/* Scrollable messages */}
          <div className="max-h-[500px] min-h-[220px] space-y-3 overflow-y-auto p-4 bg-surface/30">
            {messages.map((message) => {
              const senderIsStaff = ["superadmin", "admin", "manager", "agent"].includes(message.sender?.role);
              return (
                <div
                  key={message._id}
                  className={`max-w-[85%] p-3.5 border border-line ${
                    senderIsStaff ? "bg-white ml-auto" : "bg-surface mr-auto"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-2xs text-ink/40">
                    <span className="font-bold capitalize text-ink">
                      {message.sender?.name} · {message.sender?.role}
                    </span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink/80 whitespace-pre-wrap">{message.body}</p>

                  {/* Message Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-line/40 pt-2">
                      {message.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 border border-line bg-white hover:bg-ink/5 px-2 py-1 text-2xs text-ink transition rounded"
                        >
                          <span className="truncate max-w-36">{file.originalName || "File"}</span>
                          <span className="text-[10px] text-ink/40">({Math.round(file.size / 1024)} KB)</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!messages.length && (
              <p className="text-center text-sm text-ink/50 py-8">No messages in this chat yet.</p>
            )}
          </div>

          {/* Form with Attachments Upload */}
          <form onSubmit={sendReply} className="border-t border-line p-4 space-y-2 bg-white">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {files.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 border border-line bg-surface px-2.5 py-1 text-xs text-ink rounded"
                  >
                    <span className="truncate max-w-40">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="text-ink/50 hover:text-ink"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label className="focus-ring flex items-center justify-center p-3 border border-line bg-surface hover:bg-ink/5 text-ink/65 hover:text-ink cursor-pointer transition rounded">
                <Paperclip size={18} />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setFiles([...files, ...event.target.files])}
                />
              </label>
              <input
                className="focus-ring flex-1 border border-line bg-surface px-3 py-3 text-sm text-ink rounded"
                placeholder="Type a response..."
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);
                  socket?.emit("typing", { ticketId: id, isTyping: Boolean(event.target.value) });
                }}
                disabled={sending}
              />
              <button
                disabled={sending}
                className="focus-ring bg-ink hover:bg-ink/90 px-4 text-white disabled:opacity-60 transition rounded"
                aria-label="Send reply"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Sidebar AI assist & controls */}
      <aside className="space-y-4">
        {/* AI Assist Box */}
        <div className="border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2 text-coral border-b border-line pb-2">
            <Sparkles size={18} />
            <h3 className="font-semibold text-ink">AI Assistant</h3>
          </div>
          <Info label="Summary" value={ticket.ai?.summary || "No summary available"} />
          <Info
            label="Sentiment"
            value={
              ticket.ai?.sentiment?.label ? (
                <span className="flex items-center gap-1.5 font-medium">
                  <span>{getSentimentEmoji(ticket.ai.sentiment.label)}</span>
                  <span className="capitalize">{ticket.ai.sentiment.label}</span>
                  <span className="text-xs text-ink/40">({ticket.ai.sentiment.score})</span>
                </span>
              ) : (
                "Neutral"
              )
            }
          />
          <Info label="Auto Detected Priority" value={ticket.ai?.detectedPriority || "medium"} />
          <Info label="Suggested reply" value={ticket.ai?.suggestedReply || "No suggestion"} />
          
          {ticket.ai?.suggestedReply && (
            <button
              type="button"
              onClick={() => setReply(ticket.ai.suggestedReply)}
              className="focus-ring mt-4 flex w-full items-center justify-center gap-2 border border-ink hover:bg-ink/5 px-3 py-2.5 text-xs font-semibold transition"
            >
              <Bot size={16} />
              Copy suggested reply to chat
            </button>
          )}
        </div>

        {/* Ticket Controls for Staff */}
        {isStaff && (
          <div className="border border-line bg-white p-5 shadow-soft">
            <h3 className="font-semibold text-ink border-b border-line pb-2 mb-4">Ticket Controls</h3>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Status</span>
              <select
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded"
                value={ticket.status}
                onChange={(event) => updateTicket("status", event.target.value)}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_on_customer">Waiting on customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Priority</span>
              <select
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded"
                value={ticket.priority}
                onChange={(event) => updateTicket("priority", event.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Assigned To</span>
              <select
                className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-2 rounded"
                value={ticket.assignedTo?._id || ticket.assignedTo || ""}
                onChange={(event) => handleAssignChange(event.target.value)}
              >
                <option value="">Unassigned</option>
                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </aside>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="border-b border-line/65 py-3 last:border-b-0">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ink/45">{label}</p>
    <div className="mt-1 text-sm text-ink/75 whitespace-pre-wrap">{value}</div>
  </div>
);
