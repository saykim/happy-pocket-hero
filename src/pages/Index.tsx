
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <div className="container max-w-4xl px-4 py-8">
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
