import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GlobalSkeleton } from "./SkeletonComponent";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalSkeleton />;
  }

  if (user?.token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
