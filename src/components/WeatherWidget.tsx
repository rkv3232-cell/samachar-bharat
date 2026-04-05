'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Cloud,
    CloudRain,
    Sun,
    CloudLightning,
    RefreshCw,
    AlertCircle,
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

// Updated Cache Key with version and site prefix to prevent collision on same domain
const CACHE_KEY = 'sb_weather_v2_gzp';
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes cache
const CITY_CACHE: Record<string, string> = {}; // In-memory session cache for Nominatim results

export default function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const isResolved = useRef(false);
    const retryCount = useRef(0);

    const getWeatherCondition = (code: number) => {
        if (code === 0) return 'clear';
        if (code <= 3) return 'cloudy';
        if (code <= 67) return 'rain';
        if (code <= 99) return 'storm';
        return 'clear';
    };

    // Load from cache on initial mount for instant UI
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as WeatherData;
                const isExpired = Date.now() - parsed.timestamp > CACHE_TIME;
                if (!isExpired) {
                    setWeather(parsed);
                    setWeatherLoading(false);
                }
            } catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, []);

    const fetchWeatherByCoords = useCallback(async (lat: number, lon: number, source: 'gps' | 'ip' = 'gps') => {
        try {
            setIsSyncing(true);
            const cityCacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

            // Nominatim fetch with safeguard for rate limits
            const fetchCity = async () => {
                if (CITY_CACHE[cityCacheKey]) return CITY_CACHE[cityCacheKey];
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
                    if (res.status === 429) throw new Error('Rate Limited');
                    const data = await res.json();
                    const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'आपका स्थान';
                    CITY_CACHE[cityCacheKey] = name;
                    return name;
                } catch { return 'आपका स्थान'; }
            };

            // Parallel fetch for weather and city name
            const [weatherRes, cityName] = await Promise.all([
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
                fetchCity()
            ]);

            const weatherData = await weatherRes.json();
            const newWeather: WeatherData = {
                temp: Math.round(weatherData.current_weather.temperature),
                condition: getWeatherCondition(weatherData.current_weather.weathercode),
                city: cityName,
                isLive: source === 'gps',
                timestamp: Date.now()
            };

            setWeather(newWeather);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newWeather));
            setWeatherError(null);
            isResolved.current = true;
        } catch (err) {
            console.error('[Weather] Fetch error:', err);
            throw err;
        } finally {
            setIsSyncing(false);
            setWeatherLoading(false);
        }
    }, []);

    const fetchWeatherByIP = useCallback(async () => {
        if (isResolved.current) return;
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) {
                await fetchWeatherByCoords(ipData.latitude, ipData.longitude, 'ip');
            } else {
                throw new Error('IP coordinates unavailable');
            }
        } catch (err) {
            // Absolute fallback Ghazipur if everything fails
            const fallback: WeatherData = { temp: 32, condition: 'clear', city: 'North India', isLive: false, timestamp: Date.now() };
            setWeather(fallback);
            setWeatherLoading(false);
        }
    }, [fetchWeatherByCoords]);

    const getLocation = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && weather && (Date.now() - weather.timestamp < CACHE_TIME)) {
            return; // Use existing valid data
        }

        setWeatherError(null);
        if (!weather) setWeatherLoading(true);
        else setIsSyncing(true);

        const geoOptions = {
            enableHighAccuracy: false, // Set to false for faster response
            timeout: 8000, // Reduced from 15s to 8s for speed
            maximumAge: 60000
        };

        const successHandler = (pos: GeolocationPosition) => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'gps');
        };

        const errorHandler = (err: GeolocationPositionError) => {
            console.log(`[Weather] GPS fail (${err.code}), falling back to IP`);
            fetchWeatherByIP();
        };

        if (!navigator.geolocation) {
            fetchWeatherByIP();
            return;
        }

        navigator.geolocation.getCurrentPosition(successHandler, errorHandler, geoOptions);
    }, [weather, fetchWeatherByCoords, fetchWeatherByIP]);

    useEffect(() => {
        getLocation();
    }, [getLocation]);

    const WeatherIcon = ({ condition }: { condition: string }) => {
        switch (condition) {
            case 'rain': return <CloudRain className="w-4 h-4 text-blue-500" />;
            case 'cloudy': return <Cloud className="w-4 h-4 text-slate-400" />;
            case 'storm': return <CloudLightning className="w-4 h-4 text-amber-600" />;
            default: return <Sun className="w-4 h-4 text-orange-400" />;
        }
    };

    return (
        <div className="w-full bg-[#fcfcfd] dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 h-10 md:h-11 shadow-sm transition-all overflow-hidden flex items-center">
            <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {weatherLoading && !weather ? (
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-red-600 animate-spin" />
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-tighter">Locating...</span>
                        </div>
                    ) : weather ? (
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] md:text-[13px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                    {weather.city}
                                </span>
                                {isSyncing && (
                                    <span className="flex items-center gap-1 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded animate-pulse font-black uppercase tracking-widest">
                                        <Zap size={8} className="fill-current" /> Syncing
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-4 border-l border-gray-100 dark:border-gray-800 pl-4">
                                <div className="flex items-center gap-2">
                                    <WeatherIcon condition={weather.condition} />
                                    <span className="text-gray-900 dark:text-white font-black text-xs md:text-sm">{weather.temp}°C</span>
                                </div>
                                <button
                                    onClick={() => getLocation(true)}
                                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                    title="Refresh weather"
                                >
                                    <RefreshCw className={`w-3 h-3 text-gray-400 group-hover:text-red-600 ${isSyncing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Visual Status Indicator */}
                {!weatherLoading && weather && (
                    <div className="hidden sm:flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${weather.isLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`} />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            {weather.isLive ? 'Live Location Enabled' : 'Stationary Data'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
