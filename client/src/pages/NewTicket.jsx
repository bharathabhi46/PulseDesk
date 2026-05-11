import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";

export const NewTicket = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "General", priority: "" });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => value && payload.append(key, value));
    files.forEach((file) => payload.append("attachments", file));
    const { data } = await http.post("/tickets", payload);
    navigate(`/tickets/${data.ticket._id}`);
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5 border border-line bg-white p-5 shadow-soft">
      <div>
        <h2 className="text-xl font-semibold text-ink">Create support ticket</h2>
        <p className="mt-1 text-sm text-ink/55">AI will summarize, score sentiment, and detect urgency after submission.</p>
      </div>
      <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} required />
      <label className="block">
        <span className="text-sm font-medium text-ink/70">Description</span>
        <textarea
          className="focus-ring mt-1 min-h-40 w-full border border-line bg-surface px-3 py-3"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} />
        <label className="block">
          <span className="text-sm font-medium text-ink/70">Priority</span>
          <select className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-3" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            <option value="">Let AI detect</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 border border-dashed border-line bg-surface p-4">
        <span className="flex items-center gap-3 text-sm text-ink/65">
          <UploadCloud size={20} />
          {files.length ? `${files.length} file(s) selected` : "Upload screenshots, PDFs, or notes"}
        </span>
        <input className="hidden" type="file" multiple onChange={(event) => setFiles([...event.target.files])} />
      </label>
      <button disabled={saving} className="focus-ring bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60">
        {saving ? "Creating..." : "Create ticket"}
      </button>
    </form>
  );
};

const Field = ({ label, value, onChange, ...props }) => (
  <label className="block">
    <span className="text-sm font-medium text-ink/70">{label}</span>
    <input className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-3" value={value} onChange={(event) => onChange(event.target.value)} {...props} />
  </label>
);
