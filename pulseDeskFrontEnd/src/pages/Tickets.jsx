import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { TicketCard } from "../components/TicketCard";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";

export const Tickets = () => {
  const socket = useSocket();
  const { user, isStaff } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [assignment, setAssignment] = useState("");

  useEffect(() => {
    http.get("/tickets").then(({ data }) => setTickets(data.tickets));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const upsert = (ticket) => setTickets((items) => [ticket, ...items.filter((item) => item._id !== ticket._id)]);
    socket.on("ticket:created", upsert);
    socket.on("ticket:updated", upsert);
    return () => {
      socket.off("ticket:created", upsert);
      socket.off("ticket:updated", upsert);
    };
  }, [socket]);

  const filtered = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesQuery = `${ticket.title} ${ticket.description}`.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = !status || ticket.status === status;
        
        let matchesAssignment = true;
        if (isStaff && assignment) {
          if (assignment === "assigned") {
            matchesAssignment = ticket.assignedTo?._id === user?._id;
          } else if (assignment === "unassigned") {
            matchesAssignment = !ticket.assignedTo;
          }
        }

        return matchesQuery && matchesStatus && matchesAssignment;
      }),
    [tickets, query, status, assignment, isStaff, user]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 border border-line bg-white px-3 py-2">
          <Search size={18} className="text-ink/45" />
          <input className="w-full bg-transparent outline-none" placeholder="Search tickets" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select className="focus-ring border border-line bg-white px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="waiting_on_customer">Waiting on customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {isStaff && (
          <select className="focus-ring border border-line bg-white px-3 py-2" value={assignment} onChange={(event) => setAssignment(event.target.value)}>
            <option value="">All tickets</option>
            <option value="assigned">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        )}
      </div>
      <div className="space-y-3">
        {filtered.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)}
        {!filtered.length && <p className="border border-line bg-white p-6 text-sm text-ink/60">No matching tickets.</p>}
      </div>
    </div>
  );
};
