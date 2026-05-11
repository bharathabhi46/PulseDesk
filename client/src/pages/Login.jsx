import { ArrowRight, Headphones } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@pulsedesk.dev", password: "Password123" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to manage tickets, chat, and AI support workflows.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="focus-ring flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 font-semibold text-white">
          Sign in
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="mt-5 text-sm text-ink/60">
        New here? <Link className="font-semibold text-ink" to="/signup">Create an account</Link>
      </p>
    </AuthScreen>
  );
};

export const AuthScreen = ({ title, subtitle, children }) => (
  <main className="grid min-h-screen bg-surface lg:grid-cols-[1fr_460px]">
    <section className="hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="text-3xl font-black">PulseDesk</div>
      <div>
        <Headphones size={56} className="mb-6 text-mint" />
        <h1 className="max-w-2xl text-5xl font-black leading-tight">Customer support that notices urgency before queues do.</h1>
        <p className="mt-5 max-w-xl text-lg text-white/70">
          AI summaries, suggested replies, sentiment triage, live collaboration, and clear operations metrics in one support console.
        </p>
      </div>
      <p className="text-sm text-white/50">MERN, Socket.IO, Cloudinary, Nodemailer, OpenAI-ready.</p>
    </section>
    <section className="flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-line bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase text-mint">PulseDesk</p>
          <h2 className="text-3xl font-bold text-ink">{title}</h2>
          <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  </main>
);

export const Input = ({ label, value, onChange, type = "text", ...props }) => (
  <label className="block">
    <span className="text-sm font-medium text-ink/70">{label}</span>
    <input
      className="focus-ring mt-1 w-full border border-line bg-surface px-3 py-3 text-ink"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  </label>
);
