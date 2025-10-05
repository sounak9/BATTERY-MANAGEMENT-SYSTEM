import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBackendOrigin, getApiUrl } from "../lib/backend";

export default function QAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const error = params.get("error");
  const email = params.get("email");
  const name = params.get("name");

  const [loading, setLoading] = useState(false);
  const [emailInfo, setEmailInfo] = useState(null);

  const backend = getBackendOrigin();
  const apiBase = getApiUrl();

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/", { replace: true });
      return;
    }

    async function checkEmail() {
      if (!email) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${apiBase}/auth/check-email?email=${encodeURIComponent(email)}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        setEmailInfo(data);
        // Auto-redirect immediately based on existence
        if (data && typeof data.exists === "boolean") {
          if (data.exists) {
            // If registered, go straight to dashboard
            navigate("/", { replace: true });
            return;
          } else {
            // If not registered, go to register with prefilled email/name
            const qs = new URLSearchParams();
            if (email && email !== "null" && email !== "undefined")
              qs.set("email", email);
            if (name && name !== "null" && name !== "undefined")
              qs.set("name", name);
            const qsStr = qs.toString();
            navigate(qsStr ? `/register?${qsStr}` : "/register", {
              replace: true,
            });
            return;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (error === "oauth_state_mismatch") checkEmail();
  }, [token, email, error, navigate, backend]);

  const startGoogle = () => (window.location.href = `${apiBase}/auth/google`);
  const goRegister = () => {
    const qs = new URLSearchParams();
    if (email && email !== "null" && email !== "undefined")
      qs.set("email", email);
    if (name && name !== "null" && name !== "undefined") qs.set("name", name);
    const qsStr = qs.toString();
    navigate(qsStr ? `/register?${qsStr}` : "/register");
  };
  const goLogin = () => navigate("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A2B5B] p-6">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full text-black">
        <h2 className="text-xl font-bold mb-4">Google Sign-in</h2>
        {loading ? (
          <p>Checking your account...</p>
        ) : token ? (
          <p>Signing you in...</p>
        ) : error === "oauth_state_mismatch" ? (
          <div>
            <p className="mb-4">
              Google sign-in session mismatch. Retry or continue to register.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={startGoogle}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Retry Google Sign-in
              </button>
              {emailInfo && emailInfo.exists ? (
                <button
                  onClick={goLogin}
                  className="px-4 py-2 bg-gray-600 text-white rounded"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  onClick={goRegister}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Continue to Register
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={startGoogle}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
