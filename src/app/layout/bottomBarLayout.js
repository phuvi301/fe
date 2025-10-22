'use client'
import BOTTOMBAR from "../components/BottomBar"
import { useBottomBar } from "~/context/BottombarContext"

export default function BottomBarLayout({ children }) {
  const {bottomBarRef} = useBottomBar();

  return (
    <>
      {children}
      <BOTTOMBAR ref={bottomBarRef}/>
    </>
  )
}