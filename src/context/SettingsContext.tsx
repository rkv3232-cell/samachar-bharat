"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchSettings } from "@/lib/firestore";
import type { SiteSettings } from "@/types";

interface SettingsContextType {
    settings: SiteSettings | null;
    loading: boolean;
    refresh: () => Promise<void>;
    t: (key: string) => string;
    language: string;
    setLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    refresh: async () => { },
    t: (key: string) => key,
    language: 'hi',
    setLanguage: () => { },
});

const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
        live_news: "LIVE NEWS",
        home: "Home",
        login: "Login",
        signup: "Signup",
        signout: "Sign Out",
        admin_panel: "Admin Panel",
        editor_panel: "Editor Panel",
        trending: "Trending Now",
        recent_posts: "Recent Posts",
        contact_us: "Contact Us",
        live_telecast: "Live Telecast",
        trending_updates: "Trending Updates",
        offline_msg: "We are not broadcasting live at the moment. Please check back later.",
        uttar_pradesh: "Uttar Pradesh",
        desh: "Nation",
        videsh: "World",
        karobar: "Business",
        crime: "Crime",
        dharm: "Religion",
        rajniti: "Politics",
        lifestyle: "Lifestyle",
    },
    hi: {
        live_news: "लाइव न्यूज़",
        home: "होम",
        login: "लॉगिन",
        signup: "साइनअप",
        signout: "साइन आउट",
        admin_panel: "एडमिन पैनल",
        editor_panel: "एडिटर पैनल",
        trending: "ट्रेंडिंग खबरें",
        recent_posts: "ताज़ा खबरें",
        contact_us: "संपर्क करें",
        live_telecast: "लाइव प्रसारण",
        trending_updates: "ट्रेंडिंग अपडेट्स",
        offline_msg: "हम अभी लाइव प्रसारण नहीं कर रहे हैं। कृपया बाद में चेक करें।",
        uttar_pradesh: "उत्तर प्रदेश",
        desh: "देश",
        videsh: "विदेश",
        karobar: "कारोबार",
        crime: "क्राइम",
        dharm: "धर्म",
        rajniti: "राजनीति",
        lifestyle: "लाइफस्टाइल",
    }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [localLanguage, setLocalLanguage] = useState<string>('hi');

    useEffect(() => {
        const savedLang = localStorage.getItem('user_lang');
        if (savedLang) setLocalLanguage(savedLang);
    }, []);

    const applySettings = (s: SiteSettings) => {
        // 1. Apply Primary Color
        if (s.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', s.primaryColor);
        }

        // 2. Apply Theme - handled by next-themes
        // if (s.theme === 'dark') {
        //     document.documentElement.classList.add('dark');
        // } else {
        //     document.documentElement.classList.remove('dark');
        // }

        // 3. Apply Language (html attribute)
        document.documentElement.setAttribute('lang', s.language || 'hi');
    };

    const loadSettings = async () => {
        try {
            const s = await fetchSettings();
            setSettings(s);
            if (s) applySettings(s);
        } catch (err) {
            console.error("Failed to load global settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const t = (key: string) => {
        const lang = localLanguage || settings?.language || 'hi';
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['hi']?.[key] || key;
    };

    const handleSetLanguage = (lang: string) => {
        setLocalLanguage(lang);
        localStorage.setItem('user_lang', lang);
        document.documentElement.setAttribute('lang', lang);
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh: loadSettings, t, language: localLanguage, setLanguage: handleSetLanguage }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
