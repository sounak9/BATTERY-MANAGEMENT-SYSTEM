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
import AuthPage from "./pages/AuthPage";

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
        <Route path="/login" element={<AuthPage />} />
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
