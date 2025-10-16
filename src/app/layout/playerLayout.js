'use client'
import BOTTOMBAR from "../components/BottomBar"
import { usePlayer } from "~/context/PlayerContext"

export default function PlayerLayout({ children }) {
  const {bottomBarRef} = usePlayer();

  return (
    <>
      {children}
      <BOTTOMBAR ref={bottomBarRef}/>
    </>
  )
}