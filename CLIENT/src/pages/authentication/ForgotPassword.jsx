import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [securityQn, setSecurityQn] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("http://127.0.0.1:8000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (res.ok) {
      setSecurityQn(data.security_qn);
      setStep(2);
    } else {
      setMessage(data.error);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("http://127.0.0.1:8000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        security_ans: answer,
        new_password: newPassword,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1A2B5B]">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4 text-black">
          Forgot Password
        </h2>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-2 border rounded text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="space-y-3">
            <p className="text-black">Security Question: {securityQn}</p>
            <input
              type="text"
              placeholder="Your Answer"
              className="w-full p-2 border rounded text-black"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 border rounded text-black"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded"
            >
              Reset Password
            </button>
          </form>
        )}

        {message && <p className="text-center mt-3 text-red-500">{message}</p>}
      </div>
    </div>
  );
}
