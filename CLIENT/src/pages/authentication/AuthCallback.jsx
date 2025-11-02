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
      // remove token from URL and redirect
      navigate("/", { replace: true });
    } else {
      // no token — go to login
      navigate("/login", { replace: true });
    }
  }, [search, navigate]);

  return <div className="p-8 text-center text-white">Signing you in...</div>;
}
