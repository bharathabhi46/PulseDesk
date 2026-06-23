import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { AuthScreen, Input } from "./Login";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await http.post("/auth/forgot-password", { email });
      setMessage(data.message || "Password reset link sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Forgot password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      {message ? (
        <div className="space-y-4">
          <p className="border border-mint bg-mint/10 p-3 text-sm text-ink/80 rounded">
            {message}
          </p>
          <Link
            to="/login"
            className="focus-ring flex items-center justify-center gap-2 border border-line bg-surface hover:bg-ink/5 px-4 py-3 font-semibold text-ink"
          >
            <ArrowLeft size={16} />
            Back to Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="email@example.com"
          />
          {error && (
            <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700 rounded">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="focus-ring flex w-full items-center justify-center gap-2 bg-ink hover:bg-ink/90 px-4 py-3 font-semibold text-white disabled:opacity-60 transition"
          >
            <Mail size={16} />
            {loading ? "Sending..." : "Send reset link"}
          </button>
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm font-semibold text-ink inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              Back to Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthScreen>
  );
};
