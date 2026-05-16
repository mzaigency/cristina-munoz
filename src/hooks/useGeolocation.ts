import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const STORAGE_KEY = "glow_geo_v1";
const PERM_DENIED_KEY = "glow_geo_denied_v1";

function readPersisted(): Pick<GeolocationState, "latitude" | "longitude"> {
  if (typeof window === "undefined") return { latitude: null, longitude: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { latitude: null, longitude: null };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.lon === "number") {
      return { latitude: parsed.lat, longitude: parsed.lon };
    }
  } catch {}
  return { latitude: null, longitude: null };
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>(() => {
    const persisted = readPersisted();
    return {
      latitude: persisted.latitude,
      longitude: persisted.longitude,
      error: null,
      loading: false,
      permissionDenied: false,
    };
  });

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 300000 } = options;

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La geolocalización no está soportada en este navegador',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: position.coords.latitude, lon: position.coords.longitude, ts: Date.now() }));
          localStorage.removeItem(PERM_DENIED_KEY);
        } catch {}
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
        let permissionDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            permissionDenied = true;
            try { localStorage.setItem(PERM_DENIED_KEY, "1"); } catch {}
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }

        setState(prev => ({
          latitude: prev.latitude,
          longitude: prev.longitude,
          error: errorMessage,
          loading: false,
          permissionDenied,
        }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Auto-request on mount unless previously denied
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.latitude !== null && state.longitude !== null) return;
    try {
      if (localStorage.getItem(PERM_DENIED_KEY)) return;
    } catch {}
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback(
    (lat: number, lon: number): number | null => {
      if (state.latitude === null || state.longitude === null) return null;

      const R = 6371; // Earth's radius in km
      const dLat = ((lat - state.latitude) * Math.PI) / 180;
      const dLon = ((lon - state.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((state.latitude * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance;
    },
    [state.latitude, state.longitude]
  );

  // Format distance for display
  const formatDistance = useCallback((distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }, []);

  return {
    ...state,
    requestLocation,
    calculateDistance,
    formatDistance,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}

// City coordinates for distance calculation when salon doesn't have exact coords
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Madrid': { lat: 40.4168, lon: -3.7038 },
  'Barcelona': { lat: 41.3851, lon: 2.1734 },
  'Valencia': { lat: 39.4699, lon: -0.3763 },
  'Sevilla': { lat: 37.3891, lon: -5.9845 },
  'Zaragoza': { lat: 41.6488, lon: -0.8891 },
  'Málaga': { lat: 36.7213, lon: -4.4214 },
  'Murcia': { lat: 37.9922, lon: -1.1307 },
  'Palma': { lat: 39.5696, lon: 2.6502 },
  'Las Palmas': { lat: 28.1235, lon: -15.4363 },
  'Bilbao': { lat: 43.2630, lon: -2.9350 },
};
