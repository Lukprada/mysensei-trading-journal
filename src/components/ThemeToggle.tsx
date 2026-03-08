import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";

const options = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-secondary/50 border border-border/50">
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`relative p-1.5 rounded-md transition-all duration-200 ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            title={opt.label}
          >
            {active && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-md bg-primary/15 border border-primary/20"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <opt.icon className="h-3.5 w-3.5 relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
