
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label="테마 변경"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};

export const ThemeToggleGroup = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <ToggleGroup type="single" value={theme} onValueChange={(value) => {
      if (value) toggleTheme();
    }}>
      <ToggleGroupItem value="light" aria-label="라이트 모드">
        <Sun className="h-4 w-4 mr-2" />
        라이트
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="다크 모드">
        <Moon className="h-4 w-4 mr-2" />
        다크
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
