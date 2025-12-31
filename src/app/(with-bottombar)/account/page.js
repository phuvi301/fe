"use client";
import { useState } from "react";
import styles from "./Account.module.css";
import clsx from "clsx";
import User from "./User";
import Security from "./Security";
import Artist from "./Artist";
import Header from "../../components/Header";
import style from "~/app/homepage.module.scss";
import Sidebar from "../../components/Sidebar";

const sidebarList = [
    { icon: '/account.png', tab: "Account" }, // Đã sửa ./ thành / để đường dẫn ảnh chuẩn hơn
    { icon: '/info.png', tab: "Personal Information" },
    { icon: '/security.png', tab: "Security Methods" },
];

const AccountManager = () => {
    const [tabChoosing, setTabChoosing] = useState(0);

    return (
        <div className={style.background}>
            <Header/>
            <Sidebar/>
            <div className={clsx(styles["overview"])}>
                <div className={clsx(styles["main"])}>
                    {/* Left Panel: Content */}
                    <div className={clsx(styles["main-wrapper"])}>
                        {tabChoosing === 0 && <Artist />}
                        {tabChoosing === 1 && <User />}
                        {tabChoosing === 2 && <Security />}
                    </div>
                    
                    {/* Right Panel: Navigation */}
                    <div className={clsx(styles["sidebar-list"])}>
                        {sidebarList.map((item, index) => (
                            <button 
                                key={index} 
                                className={clsx(styles["sidebar-item"], {
                                    [styles["active"]]: index === tabChoosing
                                })} 
                                onClick={() => setTabChoosing(index)}
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