
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, PiggyBank, Target, ListTodo, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("home");

  // Update active tab based on current URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("home");
    } else {
      const tab = path.split("/")[1];
      if (tab) setActiveTab(tab);
    }
  }, [location]);

  const navItems = [
    { id: "home", label: "홈", icon: Home },
    { id: "allowance", label: "용돈", icon: PiggyBank },
    { id: "goals", label: "목표", icon: Target },
    { id: "tasks", label: "할일", icon: ListTodo },
    { id: "analytics", label: "통계", icon: Award },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-2 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-lg md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.id === "home" ? "/" : `/${item.id}`}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-all duration-300",
                activeTab === item.id
                  ? "text-primary scale-110"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
                  activeTab === item.id && "animate-bounce-soft"
                )}
              />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
