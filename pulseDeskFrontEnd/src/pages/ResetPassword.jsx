import { ArrowRight, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { AuthScreen, Input } from "./Login";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing password reset token.");
    }
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await http.post("/auth/reset-password", { token, password });
      setMessage("Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Reset password"
      subtitle="Enter your new password below. Passwords must be at least 8 characters."
    >
      {message ? (
        <p className="border border-mint bg-mint/10 p-3 text-sm text-ink/80 rounded">
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            disabled={!token || loading}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            disabled={!token || loading}
          />
          {error && (
            <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700 rounded">
              {error}
            </p>
          )}
          <button
            disabled={!token || loading}
            className="focus-ring flex w-full items-center justify-center gap-2 bg-ink hover:bg-ink/90 px-4 py-3 font-semibold text-white disabled:opacity-60 transition"
          >
            <Key size={16} />
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}
    </AuthScreen>
  );
};
