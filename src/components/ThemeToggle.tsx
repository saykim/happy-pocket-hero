
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full border-none hover:bg-accent"
      aria-label="테마 변경"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 text-yellow-200" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500" />
      )}
    </Button>
  );
};

export const ThemeToggleGroup = () => {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup 
      type="single" 
      value={theme} 
      onValueChange={(value: string) => {
        if (value === "light" || value === "dark") {
          setTheme(value);
        }
      }}
      className="dark:bg-gray-800 rounded-md border dark:border-gray-700"
    >
      <ToggleGroupItem 
        value="light" 
        aria-label="라이트 모드"
        className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 dark:data-[state=on]:bg-blue-900 dark:data-[state=on]:text-blue-100 dark:hover:bg-gray-700 dark:text-gray-200"
      >
        <Sun className="h-4 w-4 mr-2" />
        라이트
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="dark" 
        aria-label="다크 모드"
        className="data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700 dark:data-[state=on]:bg-indigo-900 dark:data-[state=on]:text-indigo-100 dark:hover:bg-gray-700 dark:text-gray-200"
      >
        <Moon className="h-4 w-4 mr-2" />
        다크
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
