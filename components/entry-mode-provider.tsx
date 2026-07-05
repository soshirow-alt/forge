"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearEntryMode,
  readEntryMode,
  writeEntryModeGuest,
  type EntryMode,
} from "@/lib/entry-mode";

type EntryModeContextValue = {
  entryMode: EntryMode | null;
  entryModeResolved: boolean;
  isGuestEntry: boolean;
  isEntryUnset: boolean;
  setGuestEntryMode: () => void;
  clearGuestEntryMode: () => void;
};

const EntryModeContext = createContext<EntryModeContextValue | null>(null);

export function EntryModeProvider({ children }: { children: ReactNode }) {
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [entryModeResolved, setEntryModeResolved] = useState(false);

  useEffect(() => {
    setEntryMode(readEntryMode());
    setEntryModeResolved(true);
  }, []);

  const setGuestEntryMode = useCallback(() => {
    writeEntryModeGuest();
    setEntryMode("guest");
    setEntryModeResolved(true);
  }, []);

  const clearGuestEntryMode = useCallback(() => {
    clearEntryMode();
    setEntryMode(null);
    setEntryModeResolved(true);
  }, []);

  const value = useMemo(
    () => ({
      entryMode,
      entryModeResolved,
      isGuestEntry: entryMode === "guest",
      isEntryUnset: entryModeResolved && entryMode === null,
      setGuestEntryMode,
      clearGuestEntryMode,
    }),
    [entryMode, entryModeResolved, setGuestEntryMode, clearGuestEntryMode],
  );

  return (
    <EntryModeContext.Provider value={value}>{children}</EntryModeContext.Provider>
  );
}

export function useEntryMode() {
  const context = useContext(EntryModeContext);
  if (!context) {
    throw new Error("useEntryMode must be used within EntryModeProvider");
  }
  return context;
}

