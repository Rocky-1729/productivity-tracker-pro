import React, { useState } from "react";
import { KeyRound, Mail, Loader2, ArrowRight } from "lucide-react";
import { Api } from "../api.ts";

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  onNavigateToSignUp: () => void;
}

export default function LoginView({ onLoginSuccess, onNavigateToSignUp }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await Api.auth.login(email, password);
      if (rememberMe) {
        localStorage.setItem("prod_tracker_remembered_email", email);
      } else {
        localStorage.removeItem("prod_tracker_remembered_email");
      }
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(
      `Password recovery email sent (mock simulation) to ${
        email || "your email address"
      }.\nPlease check your personal inbox to reset password.`
    );
  };

  // Autoload remembered email if appropriate
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("prod_tracker_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-8 shadow-xl animate-fade-in" id="login-card">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
          Sign in to view your daily productivity and streaks
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="e.g. name@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-450 mb-1">
            Account Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-blue-500 focus:ring-blue-500 w-3.5 h-3.5 dark:bg-neutral-800"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-blue-500 hover:underline font-semibold"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-800/80 text-center">
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          Don't have an account yet?{" "}
          <button
            onClick={onNavigateToSignUp}
            className="text-blue-500 font-semibold hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
