import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("onwardpath_session_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
