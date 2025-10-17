"use client";
import { createContext, useContext, useRef } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const bottomBarRef = useRef(null);

  return (
    <PlayerContext.Provider value={{ bottomBarRef }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
