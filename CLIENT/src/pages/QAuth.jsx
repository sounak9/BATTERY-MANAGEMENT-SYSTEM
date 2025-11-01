import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBackendOrigin, getApiUrl } from "../lib/backend";

export default function QAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const error = params.get("error");
  const errorMessage = params.get("message");
  const email = params.get("email");
  const name = params.get("name");

  const [loading, setLoading] = useState(false);
  // Get retry count from localStorage to persist across redirects
  const [retryCount, setRetryCount] = useState(() => {
    const stored = localStorage.getItem("oauth_retry_count");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [emailInfo, setEmailInfo] = useState(null);

  // Prevent infinite retries
  const MAX_RETRIES = 1; // Reduced to 1 retry attempt

  const backend = getBackendOrigin();
  const apiBase = getApiUrl();

  useEffect(() => {
    async function handleAuth() {
      setLoading(true);

      // Log the current state for debugging
      console.log("QAuth state:", {
        token,
        error,
        email,
        name,
        currentUrl: window.location.href,
      });

      try {
        // Case 1: Successful OAuth with token
        if (token) {
          console.log("Processing successful OAuth with token");
          localStorage.setItem("token", token);
          localStorage.setItem("isAuthenticated", "true");
          navigate("/", { replace: true });
          return;
        }

        // Case 2: Handle OAuth errors
        if (error) {
          console.log(
            "Handling OAuth error:",
            error,
            errorMessage,
            "Retry count:",
            retryCount
          );

          // If we haven't exceeded max retries and it's a recoverable error
          if (
            retryCount < MAX_RETRIES &&
            (error === "oauth_state_mismatch" || error === "auth_failed")
          ) {
            console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
            const newCount = retryCount + 1;
            setRetryCount(newCount);
            localStorage.setItem("oauth_retry_count", newCount.toString());

            // Clear ALL state
            Object.keys(localStorage)
              .filter((key) => key !== "oauth_retry_count")
              .forEach((key) => localStorage.removeItem(key));
            sessionStorage.clear();

            // Start a fresh OAuth flow after a short delay
            setTimeout(() => {
              console.log("Starting fresh OAuth flow");
              window.location.href = `${apiBase}/auth/google`;
            }, 1500);
            return;
          } else {
            // Max retries exceeded or unrecoverable error
            console.log("Auth failed after retries or unrecoverable error");
            navigate("/login", {
              replace: true,
              state: {
                error: "Authentication failed. Please try signing in again.",
                details: errorMessage,
              },
            });
            return;
          }
        }

        // Log if we hit neither case above
        if (!token && !error) {
          console.log("No token and no error - unexpected state");
        }

        // Case 3: Email exists but no token (registration flow)
        if (email) {
          try {
            const res = await fetch(
              `${apiBase}/auth/check-email?email=${encodeURIComponent(email)}`,
              {
                credentials: "include",
                headers: {
                  Accept: "application/json",
                },
              }
            );

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.exists) {
              // User exists - redirect to login
              navigate("/login", {
                replace: true,
                state: {
                  message: "Please log in with your existing account",
                  email,
                },
              });
            } else {
              // New user - redirect to register
              const qs = new URLSearchParams();
              if (email && email !== "null" && email !== "undefined") {
                qs.set("email", email);
              }
              if (name && name !== "null" && name !== "undefined") {
                qs.set("name", name);
              }
              navigate(`/register?${qs.toString()}`, { replace: true });
            }
          } catch (err) {
            console.error("Error checking email:", err);
            navigate("/login", {
              replace: true,
              state: { error: "Authentication failed. Please try again." },
            });
          }
        } else {
          // Case 4: No token, no error, no email - something went wrong
          navigate("/login", {
            replace: true,
            state: { error: "Authentication failed. Please try again." },
          });
        }
      } finally {
        setLoading(false);
      }
    }

    handleAuth();
  }, [token, email, error, navigate, apiBase]);

  // Show more detailed error states
  const getErrorMessage = () => {
    if (error === "oauth_state_mismatch") {
      return retryCount < MAX_RETRIES
        ? `OAuth sync issue. Retrying... (Attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        : "OAuth sync failed. Please try signing in again.";
    }
    if (error === "auth_failed") {
      return errorMessage || "Authentication failed. Please try again.";
    }
    return error || "Unknown authentication error";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A2B5B] text-white">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          <p>Processing Google Sign-in...</p>
        </div>
      ) : error ? (
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
        <p>Redirecting...</p>
      )}
      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 text-xs opacity-50 text-left">
          <pre>
            {JSON.stringify(
              {
                token: token ? "✓" : "✗",
                error,
                email: email ? "✓" : "✗",
                name: name ? "✓" : "✗",
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
