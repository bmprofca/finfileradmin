import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
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

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;