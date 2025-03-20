import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AllowanceTracker from "./components/AllowanceTracker";
import GoalTracker from "./components/GoalTracker";
import TaskList from "./components/TaskList";
import BadgesPage from "./components/BadgesPage";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";

// Create custom page components for each route
const AllowancePage = () => (
  <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
    <Navbar />
    <div className="container max-w-4xl px-4 py-8">
      <AllowanceTracker />
    </div>
  </div>
);

const GoalsPage = () => (
  <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
    <Navbar />
    <div className="container max-w-4xl px-4 py-8">
      <GoalTracker />
    </div>
  </div>
);

const TasksPage = () => (
  <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
    <Navbar />
    <div className="container max-w-4xl px-4 py-8">
      <TaskList />
    </div>
  </div>
);

// Badge page component
const BadgesPageRoute = () => (
  <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
    <Navbar />
    <div className="container max-w-4xl px-4 py-8">
      <BadgesPage />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/allowance" element={<AllowancePage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/badges" element={<BadgesPageRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
