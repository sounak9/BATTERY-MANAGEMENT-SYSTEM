import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBackendOrigin, getApiUrl } from "../../lib/backend";

export default function QAuth() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query parameters
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const error = params.get("error");
  const errorMessage = params.get("message");
  const email = params.get("email");
  const name = params.get("name");

  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(() => {
    const stored = localStorage.getItem("oauth_retry_count");
    return stored ? parseInt(stored, 10) : 0;
  });

  const MAX_RETRIES = 1;
  const apiBase = getApiUrl();

  useEffect(() => {
    async function handleAuth() {
      console.log("🔹 QAuth params:", { token, error, email, name });

      // ✅ Case 1: Token received → Successful login
      if (token) {
        console.log("✅ OAuth success, storing token");
        localStorage.setItem("token", token);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.removeItem("oauth_retry_count");
        navigate("/", { replace: true });
        return;
      }

      // 🚨 Case 2: OAuth error handling
      if (error) {
        console.warn("⚠️ OAuth error:", error, errorMessage);

        // Retry only once for recoverable errors
        if (
          retryCount < MAX_RETRIES &&
          (error === "oauth_state_mismatch" || error === "auth_failed")
        ) {
          console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
          const newCount = retryCount + 1;
          setRetryCount(newCount);
          localStorage.setItem("oauth_retry_count", newCount.toString());

          // Clear session/local storage except retry count
          Object.keys(localStorage)
            .filter((key) => key !== "oauth_retry_count")
            .forEach((key) => localStorage.removeItem(key));
          sessionStorage.clear();

          // Retry after short delay
          setTimeout(() => {
            console.log("🔄 Retrying Google OAuth flow...");
            window.location.href = `${apiBase}/auth/google`;
          }, 1500);
          return;
        }

        // After retries fail → go back to login
        console.error("❌ OAuth failed after retries");
        localStorage.removeItem("oauth_retry_count");
        navigate("/login", {
          replace: true,
          state: {
            error:
              errorMessage ||
              "Authentication failed. Please try signing in again.",
          },
        });
        return;
      }

      // 👤 Case 3: No token but have email → Check user registration
      if (email) {
        console.log("ℹ️ Checking if user exists:", email);
        try {
          const res = await fetch(
            `${apiBase}/auth/check-email?email=${encodeURIComponent(email)}`,
            { credentials: "include" }
          );
          const data = await res.json();

          if (data.exists) {
            console.log("User exists → Redirecting to login");
            navigate("/login", {
              replace: true,
              state: {
                message: "Please log in with your existing account.",
                email,
              },
            });
          } else {
            console.log("New user → Redirecting to register");
            const qs = new URLSearchParams();
            if (email) qs.set("email", email);
            if (name) qs.set("name", name);
            navigate(`/register?${qs.toString()}`, { replace: true });
          }
        } catch (err) {
          console.error("Error verifying email:", err);
          navigate("/login", {
            replace: true,
            state: {
              error: "Authentication failed. Please try again later.",
            },
          });
        }
        return;
      }

      // ❓ Case 4: No token, no error, no email
      console.warn("Unexpected OAuth state, redirecting to login");
      navigate("/login", {
        replace: true,
        state: { error: "Authentication failed. Please try again." },
      });
    }

    handleAuth();
  }, [token, error, email, name, retryCount, navigate, apiBase]);

  // UI for different states
  const getErrorMessage = () => {
    if (error === "oauth_state_mismatch") {
      return retryCount < MAX_RETRIES
        ? `OAuth sync issue. Retrying... (${retryCount + 1}/${MAX_RETRIES})`
        : "OAuth sync failed. Please try again.";
    }
    if (error === "auth_failed") {
      return errorMessage || "Authentication failed. Please try again.";
    }
    return error || "Unknown authentication error.";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A2B5B] text-white">
      {loading ? (
        error ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">{getErrorMessage()}</p>
            <button
              onClick={() => (window.location.href = `${apiBase}/auth/google`)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Retry Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            <p>Processing Google Sign-in...</p>
          </div>
        )
      ) : (
        <p>Redirecting...</p>
      )}

      {/* Debug info for development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 text-xs opacity-50 text-left">
          <pre>
            {JSON.stringify(
              {
                token: token ? "✓" : "✗",
                error,
                email: email ? "✓" : "✗",
                name: name ? "✓" : "✗",
                retryCount,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
