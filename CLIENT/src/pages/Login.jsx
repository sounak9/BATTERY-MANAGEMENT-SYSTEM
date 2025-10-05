import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getApiUrl } from "../lib/backend";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err === "oauth_state_mismatch") {
      // If Google OAuth failed due to state mismatch, send user to register
      // page so they can either retry or register manually. Preserve email/name
      // if present.
      const email = params.get("email");
      const name = params.get("name");
      const qs = new URLSearchParams();
      if (email) qs.set("email", email);
      if (name) qs.set("name", name);
      qs.set("error", "oauth_state_mismatch");
      navigate(`/register?${qs.toString()}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleGoogleLogin = () => {
    // REACT_APP_API_URL may include a trailing '/api' (some setups), so
    // normalize it to the backend origin (no trailing '/api') before
    // building the oauth redirect URL.
    const apiBase = getApiUrl();
    window.location.href = `${apiBase}/auth/google`;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        navigate("/"); // redirect to dashboard
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1A2B5B]">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4 text-black">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-center mt-2">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded mt-4"
          >
            Continue with Google
          </button>
        </form>

        <div className="text-center mt-2 text-black">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
