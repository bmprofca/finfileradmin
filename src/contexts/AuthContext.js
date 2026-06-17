import { createContext, useContext, useState, useEffect } from "react";
import apiCall from "../utils/apiCall";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem("user_data");

    if (userDataStr) {
      try {
        const parsedData = JSON.parse(userDataStr);
        setUser(parsedData);
      } catch (e) {
        console.error("Failed to parse user_data", e);
      }
    }

    setLoading(false);
  }, []);

  const sendOtp = async ({ mobile }) => {
    const response = await apiCall("/api/admin/auth/login-send-otp", "POST", { mobile });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to send OTP");
    return data;
  };

  const login = async ({ mobile, otp }) => {
    const response = await apiCall("/api/admin/auth/login-verify-otp", "POST", { mobile, otp });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Login failed");
    localStorage.setItem("user_data", JSON.stringify(data.data));
    setUser(data.data);
    return data;
  };

  const logout = async () => {
    const userDataStr = localStorage.getItem("user_data");

    if (!userDataStr) {
      // No user_data, just clean up locally
      localStorage.removeItem("user_data");
      setUser(null);
      return;
    }

    try {
      const response = await apiCall("/api/admin/auth/logout", "POST");

      if (!response.ok) {
        console.error("Logout API call failed with status:", response.status);
        // Continue with local cleanup even if API call fails
      }

      // Clear local storage and state
      localStorage.removeItem("user_data");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local data even if API call fails
      localStorage.removeItem("user_data");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOtp,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
