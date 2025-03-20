
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { useUser } from "@/context/UserContext";
import UserSelector from "@/components/UserSelector";

const Index = () => {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex justify-end mb-4">
          <UserSelector />
        </div>
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
