"use client";
import { useState } from "react";
import styles from "./Account.module.css";
import clsx from "clsx";
import User from "./User";
import Security from "./Security";
import Artist from "./Artist";
import Header from "../../components/Header";
import style from "~/app/homepage.module.css";
import Sidebar from "../../components/Sidebar";

const sidebarList = [
    {
        icon: './account.png',
        tab: "Account",
    },
    {
        icon: './info.png',
        tab: "Personal Information",
    },
    {
        icon: './security.png',
        tab: "Security Methods",
    },
];

const AccountManager = () => {
    const [tabChoosing, setTabChoosing] = useState(0);

    const handleTabChoosing = (index) => setTabChoosing(index);

    return (
        <div className={style.background}>
            <Header/>
            <Sidebar/>
            <div className={clsx(styles["overview"])}>
                <div className={clsx(styles["main"])}>
                    {/* Main wrapper nằm bên trái */}
                    <div className={clsx(styles["main-wrapper"])}>
                        {tabChoosing === 0 ? <Artist /> : tabChoosing === 1 ? <User /> : <Security />}
                    </div>
                    {/* Sidebar nằm bên phải */}
                    <div className={clsx(styles["sidebar-list"])}>
                        {sidebarList.map((item, index) => (
                            <button 
                                key={index} 
                                className={clsx(styles["sidebar-item"], {
                                    [styles["active"]]: index === tabChoosing
                                })} 
                                onClick={() => handleTabChoosing(index)}
                            >
                                <img 
                                    src={item.icon} 
                                    alt={item.tab} 
                                    className={styles["sidebar-icon"]} 
                                />
                                <span className={styles["sidebar-text"]}>{item.tab}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div> 
    );
};

export default AccountManager;
