
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";
import AllowanceTracker from "./components/AllowanceTracker";
import GoalTracker from "./components/GoalTracker";
import TaskList from "./components/TaskList";
import BadgesPage from "./components/BadgesPage";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useUser } from "./context/UserContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useUser();

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

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

// Create custom page components for each route
const AllowancePage = () => (
  <ProtectedRoute>
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <AllowanceTracker />
      </div>
    </div>
  </ProtectedRoute>
);

const GoalsPage = () => (
  <ProtectedRoute>
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <GoalTracker />
      </div>
    </div>
  </ProtectedRoute>
);

const TasksPage = () => (
  <ProtectedRoute>
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <TaskList />
      </div>
    </div>
  </ProtectedRoute>
);

// Badge page component
const BadgesPageRoute = () => (
  <ProtectedRoute>
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <BadgesPage />
      </div>
    </div>
  </ProtectedRoute>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/allowance" element={<AllowancePage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/badges" element={<BadgesPageRoute />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
