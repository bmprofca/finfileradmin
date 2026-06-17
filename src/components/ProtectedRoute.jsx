import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const userDataStr = localStorage.getItem("user_data");
  let isAuthenticated = false;

  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
      if (parsed && parsed.token) {
        isAuthenticated = true;
      }
    } catch (e) {}
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;