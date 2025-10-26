"use client";
import { createContext, useContext, useRef } from "react";

const BottomBarContext = createContext();

export function BottomBarProvider({ children }) {
  const bottomBarRef = useRef(null);

  return (
    <BottomBarContext.Provider value={{ bottomBarRef }}>
      {children}
    </BottomBarContext.Provider>
  );
}

export function useBottomBar() {
  return useContext(BottomBarContext);
}
