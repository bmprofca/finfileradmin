import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const isAuthenticated = token && username;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;