import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const Register = ({ onSwitch }) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    company_id: "",
    security_qn: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${API_URL}/auth/register`, form);
      setSuccess("Registration successful! You can now login.");
      setForm({
        username: "",
        email: "",
        password: "",
        company_id: "",
        security_qn: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="text"
          name="company_id"
          placeholder="Company ID"
          value={form.company_id}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          type="text"
          name="security_qn"
          placeholder="Security Question (optional)"
          value={form.security_qn}
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded mb-2"
        >
          Register
        </button>
      </form>
      <div className="text-center mt-2">
        Already have an account?{" "}
        <button className="text-blue-600" onClick={onSwitch}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Register;
