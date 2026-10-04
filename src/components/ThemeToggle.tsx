import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/theme";
import "./theme-toggle.css";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Color theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          title={label}
          aria-label={label}
          className={`theme-toggle__opt${preference === value ? " is-on" : ""}`}
          onClick={() => setTheme(value)}
        >
          <Icon size={compact ? 14 : 15} strokeWidth={2.2} aria-hidden />
          {!compact && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}
