import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react"; // clean close icon

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return null; // don't render if no user
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-[#1A2B5B] text-white w-full h-full overflow-y-auto p-8">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)} // go back to dashboard
          className="absolute top-4 right-6 text-gray-300 hover:text-white transition"
        >
          <X size={32} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-8 border-b border-gray-600 pb-4">
          User Profile
        </h2>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p>
              <span className="font-semibold text-lg">Username:</span>{" "}
              <span className="text-base">{user.username}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Email:</span>{" "}
              <span className="text-base">{user.email}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Phone:</span>{" "}
              <span className="text-base">{user.ph_no || "N/A"}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Role:</span>{" "}
              <span className="text-base">{user.role}</span>
            </p>
          </div>

          <div className="space-y-4">
            <p>
              <span className="font-semibold text-lg">Security Question:</span>{" "}
              <span className="text-base">{user.security_qn || "N/A"}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">IP:</span>{" "}
              <span className="text-base">{user.ip || "N/A"}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Company:</span>{" "}
              <span className="text-base">{user.company?.company_name}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Company Email:</span>{" "}
              <span className="text-base">{user.company?.email}</span>
            </p>
            <p>
              <span className="font-semibold text-lg">Company Status:</span>{" "}
              <span
                className={`px-2 py-1 text-sm rounded ${
                  user.company?.is_active
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {user.company?.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
