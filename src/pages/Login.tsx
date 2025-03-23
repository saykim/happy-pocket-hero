
import { Navigate } from "react-router-dom";

export default function Login() {
  // Simply redirect to the signin page
  return <Navigate to="/signin" replace />;
}
