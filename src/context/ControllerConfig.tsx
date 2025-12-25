import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "controllerBaseUrl";
const DEFAULT_BASE_URL = "http://192.168.4.1";

type ControllerConfigValue = {
  baseUrl: string;
  setBaseUrl: (next: string) => Promise<void>;
  isReady: boolean;
};

const ControllerConfigContext = createContext<ControllerConfigValue | undefined>(undefined);

export function ControllerConfigProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_BASE_URL);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && !cancelled) {
          setBaseUrlState(stored);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setBaseUrl = useCallback(async (next: string) => {
    setBaseUrlState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn("Failed to persist base URL", err);
    }
  }, []);

  const value = useMemo(
    () => ({ baseUrl, setBaseUrl, isReady }),
    [baseUrl, setBaseUrl, isReady],
  );

  return <ControllerConfigContext.Provider value={value}>{children}</ControllerConfigContext.Provider>;
}

export function useControllerConfig() {
  const ctx = useContext(ControllerConfigContext);
  if (!ctx) {
    throw new Error("useControllerConfig must be used within ControllerConfigProvider");
  }
  return ctx;
}
