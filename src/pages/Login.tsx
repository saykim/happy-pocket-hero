
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import LoginForm from "@/components/LoginForm";
import { ThemeToggleGroup } from "@/components/ThemeToggle";

export default function Login() {
  const { currentUser, isLoading } = useUser();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate("/");
    }
  }, [currentUser, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <ThemeToggleGroup />
      </div>
      <div className="w-full max-w-md candy-card p-8">
        <LoginForm />
      </div>
    </div>
  );
}
