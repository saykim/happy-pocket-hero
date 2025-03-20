
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

// Placeholder page for badges
const BadgesPage = () => (
  <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
    <Navbar />
    <div className="container max-w-4xl px-4 py-8">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">배지 페이지</h1>
        <p className="text-gray-600">열심히 미션을 완료하면 배지를 얻을 수 있어요!</p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="candy-card p-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <span className="text-gray-400 text-xs">곧 공개</span>
              </div>
              <p className="text-sm font-medium text-gray-500">???</p>
            </div>
          ))}
        </div>
      </div>
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
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
