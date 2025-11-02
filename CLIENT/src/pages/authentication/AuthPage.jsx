import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {showLogin ? (
        <Login onSwitch={() => setShowLogin(false)} />
      ) : (
        <Register onSwitch={() => setShowLogin(true)} />
      )}
    </div>
  );
};

export default AuthPage;
