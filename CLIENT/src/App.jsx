import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import DataLogs from "./pages/DataLogs";
import Sensors from "./pages/Sensors";
import Login from "./pages/authentication/Login";
import Register from "./pages/authentication/Register";
import Profile from "./components/UserProfile";
import ForgotPassword from "./pages/authentication/ForgotPassword";
import AuthCallback from "./pages/authentication/AuthCallback";
import QAuth from "./pages/authentication/QAuth";
import FaultLogs from "./pages/FaultLogs";

// Simple auth check using localStorage
function RequireAuth({ children }) {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/qauth" element={<QAuth />} />
        <Route path="/oauth-callback" element={<AuthCallback />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="min-h-screen bg-[#1A2B5B] text-white">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6 md:p-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/data-logs" element={<DataLogs />} />
                      <Route path="/sensors" element={<Sensors />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/fault-logs" element={<FaultLogs />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
