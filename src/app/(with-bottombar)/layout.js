"use client";
import BottomBarLayout from "../layout/bottomBarLayout";
import { BottomBarProvider } from "~/context/BottombarContext";
import Snowfall from "react-snowfall";

export default function WithBottomBarLayout({ children }) {
    return (
        <BottomBarProvider>
            <BottomBarLayout>
                <Snowfall color="#82C3D9" style={{ zIndex: 9999 }} />
                {children}
            </BottomBarLayout>
        </BottomBarProvider>
    );
}
