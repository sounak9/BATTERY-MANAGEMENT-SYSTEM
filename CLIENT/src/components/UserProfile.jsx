import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../lib/backend";
import { X } from "lucide-react";

export default function Profile({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch user details from backend
    fetch(`${getApiUrl()}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        const userData = data.user || data;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  if (typeof open !== "undefined" && !open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-[#1A2B5B] text-white w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-6 text-gray-300 hover:text-white transition"
        >
          <X size={28} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-8 border-b border-gray-600 pb-4">
          User Profile
        </h2>

        {/* Content */}
        {loading ? (
          <p className="text-center py-6">Loading user details...</p>
        ) : !user ? (
          <p className="text-center py-6">No user data found.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <ProfileItem label="Username" value={user.username} />
              <ProfileItem label="Email" value={user.email} />
              <ProfileItem label="Phone" value={user.ph_no || "N/A"} />
              <ProfileItem label="Role" value={user.role || "N/A"} />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <ProfileItem
                label="Security Question"
                value={user.security_qn || "N/A"}
              />
              <ProfileItem label="IP" value={user.ip || "N/A"} />
              <ProfileItem
                label="Company"
                value={user.company?.company_name || "N/A"}
              />
              <ProfileItem
                label="Company Email"
                value={user.company?.email || "N/A"}
              />
              <ProfileItem
                label="Company Status"
                value={
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      user.company?.is_active ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {user.company?.is_active ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Helper Component ---------------- */
function ProfileItem({ label, value }) {
  return (
    <p>
      <span className="font-semibold text-lg">{label}:</span>{" "}
      <span className="text-base">{value}</span>
    </p>
  );
}
