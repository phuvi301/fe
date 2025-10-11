"use client";
import { useState } from "react";
import styles from "./Account.module.scss";
import clsx from "clsx";
import User from "./User";
import Security from "./Security";
import Artist from "./Artist";

const sidebarList = [
    {
        tab: "Tài khoản",
    },
    {
        tab: "Thông tin cá nhân",
    },
    {
        tab: "Phương thức bảo mật",
    },
];

const AccountManager = () => {
    const [tabChoosing, setTabChoosing] = useState(0);

    const handleTabChoosing = (index) => setTabChoosing(index)

    return (
        <div className={clsx(styles["overview"])}>
            <header className={clsx(styles["header"])}></header>
            <div className={clsx(styles["main"])}>
                <div className={clsx(styles["sidebar-list"])}>
                    {sidebarList.map((item, index) => <button key={index} val={index} className={clsx(styles["sidebar-item"], {
                        [styles["active"]]: index === tabChoosing
                    })} onClick={() => handleTabChoosing(index)}>{item.tab}</button>)}
                </div>
                <div className={clsx(styles["main-wrapper"])}>
                    {tabChoosing === 0 ? <Artist /> : tabChoosing === 1 ? <User /> : <Security />}
                </div>
            </div>
        </div>
    );
};

export default AccountManager;
