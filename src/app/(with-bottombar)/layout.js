'use client'
import PlayerLayout from "../layout/playerLayout";
import { PlayerProvider } from "~/context/PlayerContext";

export default function WithPlayerLayout({ children }) {
  return (
    <PlayerProvider>
        <PlayerLayout>
            {children}
        </PlayerLayout>
    </PlayerProvider>
  );
}