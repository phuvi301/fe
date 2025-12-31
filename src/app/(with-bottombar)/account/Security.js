"use client";
import { useState } from "react";
import styles from "./Account.module.css";
import clsx from "clsx";
import axios from "axios";
import { useRouter } from "next/navigation";

// Helper lấy token
const getAccessToken = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    return match ? match[2] : null;
};

function Security() {
    const [form, setForm] = useState({ current: "", new: "", confirm: "" });
    const [enable2FA, setEnable2FA] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleClick2FA = () => setEnable2FA((prev) => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { current, new: newPass, confirm } = form;
        
        if (!current || !newPass || !confirm) return alert("Please fill all fields");
        if (newPass !== confirm) return alert("New passwords do not match");
        if (newPass.length < 6) return alert("Password must be at least 6 characters");

        setIsSubmitting(true);
        try {
            const token = getAccessToken();
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
                { password: current, newPassword: newPass },
                { headers: { token: `Bearer ${token}` } }
            );
            
            alert("Password changed successfully! Please login again.");
            setForm({ current: "", new: "", confirm: "" });
            // Logout user hoặc redirect
            // router.push("/login"); 
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to change password. Check your current password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = form.current && form.new && form.confirm && form.new === form.confirm;

    return (
        <>
            <h2 className={clsx(styles["security-title"])}>Security Methods</h2>
            <div className={clsx(styles["security-wrapper"])}>
                {/* 2FA Section */}
                <div className={clsx(styles["security-item"])}>
                    <div className={clsx(styles["security-item-wrapper"])}>
                        <label className={clsx(styles["security-item-name"])}>Two-factor authentication (2FA)</label>
                        <button
                            className={clsx(styles["security-item-btn"], { [styles["active"]]: enable2FA })}
                            onClick={handleClick2FA}
                        ></button>
                    </div>
                    <span className={clsx(styles["security-item-desc"])}>
                        Feature coming soon.
                    </span>
                </div>

                {/* Change Password Section */}
                <div className={clsx(styles["security-item"])}>
                    <div className={clsx(styles["security-item-password"])}>
                        <p className={clsx(styles["security-item-name"], styles["security-item-title"])}>
                            Change Password
                        </p>
                        <form className={clsx(styles["user-form-wrapper"])} onSubmit={handleSubmit}>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])}>Current Password <span>*</span></label>
                                <input
                                    className={clsx(styles["user-form-input"])}
                                    name="current"
                                    value={form.current}
                                    onChange={handleChange}
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])}>New Password <span>*</span></label>
                                <input
                                    className={clsx(styles["user-form-input"], { [styles["error"]]: form.new && form.current === form.new })}
                                    name="new"
                                    value={form.new}
                                    onChange={handleChange}
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <label className={clsx(styles["user-form-label"])}>Confirm New Password <span>*</span></label>
                                <input
                                    className={clsx(styles["user-form-input"], { [styles["error"]]: form.confirm && form.new !== form.confirm })}
                                    name="confirm"
                                    value={form.confirm}
                                    onChange={handleChange}
                                    type="password"
                                />
                            </div>
                            <div className={clsx(styles["user-form-group"])}>
                                <button
                                    className={clsx(styles["user-form-submit"], { [styles["changed"]]: isFormValid })}
                                    disabled={!isFormValid || isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
export default Security;