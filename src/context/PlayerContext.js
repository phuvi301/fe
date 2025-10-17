"use client";
import { createContext, useContext, useRef } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const bottomBarRef = useRef(null);

  const playTrack = (songID) => {
    if (bottomBarRef.current) {
      bottomBarRef.current.playTrack(songID)
    }
  }

  return (
    <PlayerContext.Provider value={{ bottomBarRef, playTrack }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
