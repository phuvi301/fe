"use client";
import { useState } from "react";
import styles from "./Account.module.scss";
import clsx from "clsx";

function Security() {
    const [passwordInput, setPasswordInput] = useState("");
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [enable2FA, setEnable2FA] = useState(false);

    const handlePasswordInput = (e) => setPasswordInput(e.target.value);
    const handleNewPasswordInput = (e) => setNewPasswordInput(e.target.value);
    const handleConfirmPassword = (e) => setConfirmPassword(e.target.value);
    const handleClick2FA = () => setEnable2FA((prev) => !prev);

    return (
        <>
            <h2 className={clsx(styles["security-title"])}>Phương thức bảo mật</h2>
            <div className={clsx(styles["security-wrapper"])}>
                <div className={clsx(styles["security-item"])}>
                    <div className={clsx(styles["security-item-wrapper"])}>
                        <label className={clsx(styles["security-item-name"])}>Xác thực 2 lớp (2FA)</label>
                        <button
                            className={clsx(styles["security-item-btn"], {
                                [styles["active"]]: enable2FA,
                            })}
                            onClick={handleClick2FA}
                        ></button>
                    </div>
                    <span className={clsx(styles["security-item-desc"])}>
                        Khi bật, bạn sẽ cần nhập mã xác minh từ ứng dụng điện thoại mỗi khi đăng nhập.
                    </span>
                </div>
                <div className={clsx(styles["security-item"])}>
                    <div className={clsx(styles["security-item-password"])}>
                        <p className={clsx(styles["security-item-name"], styles["security-item-title"])}>
                            Đổi mật khẩu
                        </p>
                        <form className={clsx(styles["user-form-wrapper"])}>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])} htmlFor="password">
                                    Mật khẩu hiện tại <span>*</span>
                                </label>
                                <input
                                    className={clsx(styles["user-form-input"])}
                                    value={passwordInput}
                                    onChange={handlePasswordInput}
                                    id="password"
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])} htmlFor="new-password">
                                    Mật khẩu mới <span>*</span>
                                </label>
                                <input
                                    className={clsx(styles["user-form-input"])}
                                    value={newPasswordInput}
                                    onChange={handleNewPasswordInput}
                                    id="new-password"
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])} htmlFor="confirm-password">
                                    Nhập lại mật khẩu mới <span>*</span>
                                </label>
                                <input
                                    className={clsx(styles["user-form-input"])}
                                    value={confirmPassword}
                                    onChange={handleConfirmPassword}
                                    id="confirm-password"
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <button className={clsx(styles["user-form-submit"])}>Save changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Security;
