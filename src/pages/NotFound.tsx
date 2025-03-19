
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import MascotGuide from "@/components/MascotGuide";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <MascotGuide message="잘못된 페이지에요! 다시 돌아갈까요?" className="mx-auto" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          앗! 페이지를 찾을 수 없어요
        </p>
        <Link
          to="/"
          className="candy-button inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
