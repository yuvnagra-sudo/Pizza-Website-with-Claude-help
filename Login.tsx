import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back!");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Check your email and password.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Account created! Welcome to Johnny's Pizza.");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
      registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
    } else {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  return (
    <>
      <Helmet>
        <title>{mode === "login" ? "Sign In" : "Create Account"} - Johnny's Pizza & Wings</title>
      </Helmet>

      <div className="min-h-screen bg-[var(--brand-yellow)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / header */}
          <div className="text-center mb-8">
            <h1 className="font-['Bebas_Neue'] text-6xl text-black tracking-wide">
              Johnny's Pizza
            </h1>
            <p className="text-black font-bold text-lg">&amp; Wings — Airdrie, AB</p>
          </div>

          {/* Card */}
          <div className="bg-white border-6 border-black brutal-shadow p-8">
            {/* Mode tabs */}
            <div className="flex mb-8 border-4 border-black">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-3 font-['Bebas_Neue'] text-xl transition-colors ${
                  mode === "login"
                    ? "bg-black text-[var(--brand-yellow)]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-3 font-['Bebas_Neue'] text-xl transition-colors ${
                  mode === "register"
                    ? "bg-black text-[var(--brand-yellow)]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full border-4 border-black p-3 text-base focus:outline-none focus:border-[var(--brand-blue)]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full border-4 border-black p-3 text-base focus:outline-none focus:border-[var(--brand-blue)]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minimum 8 characters" : "Your password"}
                    required
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="w-full border-4 border-black p-3 pr-12 text-base focus:outline-none focus:border-[var(--brand-blue)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label className="block font-bold mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                    className="w-full border-4 border-black p-3 text-base focus:outline-none focus:border-[var(--brand-blue)]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[var(--brand-yellow)] border-4 border-black font-['Bebas_Neue'] text-2xl py-4 mt-2 hover:bg-yellow-300 transition-colors disabled:opacity-50 brutal-shadow"
              >
                {isPending
                  ? mode === "login" ? "Signing in…" : "Creating account…"
                  : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-bold underline text-[var(--brand-blue)]"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-bold underline text-[var(--brand-blue)]"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-sm text-black mt-6 font-semibold">
            Your order history is tied to your account.
          </p>
        </div>
      </div>
    </>
  );
}
