import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("isAuthenticated", "true");
      // try to decode basic user info from JWT payload (for UI only)
      try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(
          decodeURIComponent(
            atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          )
        );
        const user = {
          u_id: decoded.u_id || decoded.sub || null,
          username: decoded.username || decoded.name || decoded.email || null,
          email: decoded.email || null,
        };
        localStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        // ignore decode errors
      }
      // remove token from URL and redirect
      navigate("/", { replace: true });
    } else {
      // no token — go to login
      navigate("/login", { replace: true });
    }
  }, [search, navigate]);

  return <div className="p-8 text-center text-white">Signing you in...</div>;
}
