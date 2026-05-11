import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthScreen, Input } from "./Login";

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account");
    }
  };

  return (
    <AuthScreen title="Create account" subtitle="Start a customer workspace or join as invited staff.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="focus-ring flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 font-semibold text-white">
          Create account
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="mt-5 text-sm text-ink/60">
        Already have an account? <Link className="font-semibold text-ink" to="/login">Sign in</Link>
      </p>
    </AuthScreen>
  );
};
