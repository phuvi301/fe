'use client'
import BOTTOMBAR from "../bottom-bar"
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