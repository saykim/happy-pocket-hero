
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ThemeToggleGroup } from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isLoading, currentUser, switchUser } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/signin");
    }
  }, [isLoading, currentUser, navigate]);

  const handleLogout = async () => {
    // Find user with ID 0 or null to represent "logged out" state
    // This is a simplified logout since we're using a mock auth system
    await switchUser("");
    
    // Show a toast and redirect to login
    toast({
      title: "로그아웃 되었습니다",
      description: "다시 로그인하려면 로그인 페이지로 이동하세요.",
    });
    
    // Navigate to signin page
    navigate("/signin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20 dark:bg-gray-900">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex justify-between mb-4 items-center">
          <ThemeToggleGroup />
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentUser?.nickname || currentUser?.username}님 
              {currentUser?.isAdmin && <span className="ml-1 text-blue-600 dark:text-blue-400">(관리자)</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut size={14} />
              로그아웃
            </Button>
          </div>
        </div>
        
        {currentUser?.isAdmin ? (
          <AdminDashboard />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
};

export default Index;
