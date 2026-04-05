"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9" />;
    }

    const currentTheme = theme === 'system' ? systemTheme : theme;

    return (
        <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle Dark Mode"
        >
            <Sun className={`w-5 h-5 transition-transform duration-300 ${currentTheme === 'dark' ? 'rotate-90 opacity-0 absolute' : 'rotate-0 opacity-100'}`} />
            <Moon className={`w-5 h-5 transition-transform duration-300 ${currentTheme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`} />
        </button>
    );
}
