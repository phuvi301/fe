'use client'
import BottomBarLayout from "../layout/bottomBarLayout";
import { BottomBarProvider } from "~/context/BottombarContext";

export default function WithBottomBarLayout({ children }) {
  return (
    <BottomBarProvider>
        <BottomBarLayout>
            {children}
        </BottomBarLayout>
    </BottomBarProvider>
  );
}