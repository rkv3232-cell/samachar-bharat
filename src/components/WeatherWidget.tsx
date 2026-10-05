'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Cloud,
    CloudRain,
    Sun,
    CloudLightning,
    RefreshCw,
    MapPin,
    Zap
} from 'lucide-react';

interface WeatherData {
    temp: number;
    condition: string;
    city: string;
    isLive: boolean;
    timestamp: number;
}

const CACHE_KEY = 'sb_weather_v2_gzp';
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes cache
const CITY_CACHE: Record<string, string> = {};

function WeatherIcon({ condition }: { condition: string }) {
    switch (condition) {
        case 'rain': return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
        case 'cloudy': return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
        case 'storm': return <CloudLightning className="w-3.5 h-3.5 text-amber-600" />;
        default: return <Sun className="w-3.5 h-3.5 text-orange-400" />;
    }
}

const DEFAULT_WEATHER: WeatherData = {
    temp: 28,
    condition: 'clear',
    city: 'Ghazipur',
    isLive: false,
    timestamp: 0,
};

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER);
    const [isSyncing, setIsSyncing] = useState(false);
    const isResolved = useRef(false);

    const getWeatherCondition = (code: number) => {
        if (code === 0) return 'clear';
        if (code <= 3) return 'cloudy';
        if (code <= 67) return 'rain';
        if (code <= 99) return 'storm';
        return 'clear';
    };

    // Load from cache on initial mount for instant 0ms UI
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached) as WeatherData;
                if (Date.now() - parsed.timestamp < CACHE_TIME) {
                    setWeather(parsed);
                }
            }
        } catch {
            // Ignore cache error
        }
    }, []);

    const fetchWeatherByCoords = useCallback(async (lat: number, lon: number, source: 'gps' | 'ip' = 'gps') => {
        try {
            setIsSyncing(true);
            const cityCacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

            const fetchCity = async () => {
                if (CITY_CACHE[cityCacheKey]) return CITY_CACHE[cityCacheKey];
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, { signal: AbortSignal.timeout(2500) });
                    if (res.status === 429) throw new Error('Rate Limited');
                    const data = await res.json();
                    const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'आपका स्थान';
                    CITY_CACHE[cityCacheKey] = name;
                    return name;
                } catch { return 'उत्तर प्रदेश'; }
            };

            const [weatherRes, cityName] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, { signal: AbortSignal.timeout(2500) }),
                fetchCity()
            ]);

            const weatherData = await weatherRes.json();
            if (weatherData && weatherData.current_weather) {
                const newWeather: WeatherData = {
                    temp: Math.round(weatherData.current_weather.temperature),
                    condition: getWeatherCondition(weatherData.current_weather.weathercode),
                    city: cityName,
                    isLive: source === 'gps',
                    timestamp: Date.now()
                };

                setWeather(newWeather);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(newWeather));
                } catch {
                    // Ignore storage error
                }
                isResolved.current = true;
            }
        } catch (err) {
            console.warn('[Weather] Background sync note:', err);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const fetchWeatherByIP = useCallback(async () => {
        if (isResolved.current) return;
        try {
            const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(2500) });
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) {
                await fetchWeatherByCoords(ipData.latitude, ipData.longitude, 'ip');
            }
        } catch {
            // Fallback remains default
        }
    }, [fetchWeatherByCoords]);

    const getLocation = useCallback((forceRefresh = false) => {
        if (!forceRefresh && weather.timestamp > 0 && (Date.now() - weather.timestamp < CACHE_TIME)) {
            return;
        }

        const geoOptions = {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000
        };

        const successHandler = (pos: GeolocationPosition) => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'gps');
        };

        const errorHandler = () => {
            fetchWeatherByIP();
        };

        const proceedWithGeo = () => {
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(successHandler, errorHandler, geoOptions);
            } else {
                fetchWeatherByIP();
            }
        };

        if (forceRefresh) {
            proceedWithGeo();
            return;
        }

        if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
                if (result.state === 'granted') {
                    proceedWithGeo();
                }
            }).catch(() => {
                // Ignore permissions query error
            });
        }
    }, [weather.timestamp, fetchWeatherByCoords, fetchWeatherByIP]);

    useEffect(() => {
        const timer = setTimeout(() => {
            getLocation();
        }, 100);

        return () => clearTimeout(timer);
    }, [getLocation]);

    return (
        <div className="w-full bg-white border-b border-gray-200/80 h-8 shadow-2xs overflow-hidden flex items-center">
            <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                        <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">
                            {weather.city}
                        </span>
                        {isSyncing && (
                            <span className="flex items-center gap-0.5 bg-red-600 text-white text-[7px] px-1 py-0.2 rounded font-black uppercase">
                                <Zap size={7} className="fill-current" /> Sync
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-200 pl-2.5">
                        <WeatherIcon condition={weather.condition} />
                        <span className="text-gray-800 font-bold text-[11px]">{weather.temp}°C</span>
                        <button
                            type="button"
                            onClick={() => getLocation(true)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="रिफ्रेश मौसम"
                            aria-label="Refresh Weather"
                        >
                            <RefreshCw className={`w-2.5 h-2.5 text-gray-400 hover:text-red-600 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${weather.isLive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {weather.isLive ? 'Live Location' : 'Local Edition'}
                    </span>
                </div>
            </div>
        </div>
    );
}
