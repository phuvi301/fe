"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import style from "./login.module.css";
import clsx from "clsx";
import axios from "axios";

export default function Home() {
    const router = useRouter();

    const homeRouter = () => {
        router.push("/");
    };

    const handleSubmitSignUp = async (e) => {
        e.preventDefault();
        const { signUpEmail, signUpPassword, signUpConfirmPassword } = e.target;
        if (signUpPassword.value !== signUpConfirmPassword.value) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                {
                    email: signUpEmail.value,
                    password: signUpPassword.value,
                }
            );
            console.log("Registration successful:", response.data);
            alert("Registration successful! Please log in.");
        } catch (error) {
            console.error("There was an error registering!", error);
        }
    };

    const handleSubmitSignIn = async (e) => {
        e.preventDefault();
        const { signInEmail, signInPassword } = e.target;

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`,
                { email: signInEmail.value, password: signInPassword.value },
                {
                    withCredentials: true,
                }
            );
            console.log("Login successful:", response.data);
            localStorage.setItem("userInfo", JSON.stringify(response.data.data))
            document.cookie = `accessToken=${response.data.data.accessToken}; expires=${new Date(response.data.data.accessExpireTime).toUTCString()}; path=/;` ;
            homeRouter();
        } catch (error) {
            console.error("There was an error logging in!", error);
        }
    };

    // Slider login template
    const signUpButtonRef = useRef(null);
    const signInButtonRef = useRef(null);
    const containerRef = useRef(null);

    //Password visibility toggle
    const [showSignInPassword, setShowSignInPassword] = useState(true);
    const [showSignUpPassword, setShowSignUpPassword] = useState(true);
    const [showConfirmPassword, setShowConfirmPassword] = useState(true);

    // Sử dụng useEffect để thao tác DOM sau khi component mount
    useEffect(() => {
        const signUpButton = signUpButtonRef.current;
        const signInButton = signInButtonRef.current;
        const container = containerRef.current;

        const handleSignUp = () => {
            container.classList.add(style["right-panel-active"]);
        };

        const handleSignIn = () => {
            container.classList.remove(style["right-panel-active"]);
        };

        if (signUpButton && signInButton && container) {
            signUpButton.addEventListener("click", handleSignUp);
            signInButton.addEventListener("click", handleSignIn);
        }

        // Cleanup event listeners
        return () => {
            if (signUpButton && signInButton) {
                signUpButton.removeEventListener("click", handleSignUp);
                signInButton.removeEventListener("click", handleSignIn);
            }
        };
    }, []);

    // Khi đăng xuất thì xóa userInfo trong localStorage
    useEffect(() => {
        localStorage.removeItem("userInfo");
    }, []);

    return (
        <div className={style.background}>
            {/* Container */}
            <div className={style.container} ref={containerRef}>
                {/* Sign up container */}
                <div className={clsx(style["form-container"], style["sign-up-container"])}>
                    <form onSubmit={handleSubmitSignUp}>
                        {/* Logo web */}
                        <div className={style["logo-container"]}>
                            <img className={style.logo_image} src="/logo&text.png" alt="Logo" />
                        </div>
                        {/* Social login */}
                        <div className={style["social-container"]}>
                            <a href="#" className={style.social}>
                                <img className={style["facebook-icon"]} src="/facebook.png" alt="Facebook" />
                            </a>
                            <a href="#" className={style.social}>
                                <img className={style["google-icon"]} src="/google.png" alt="Google" />
                            </a>
                        </div>
                        <span>or use your email for registration</span>
                        {/* Input container */}
                        <div className={style["input-container"]}>
                            {/* Email input */}
                            <div className={style["email-input"]}>
                                <div className={style["email-border"]}>
                                    <img src="/mail.png" alt="Email Icon" className={style["email-icon"]} />
                                </div>
                                <input type="email" placeholder="Email" id="signUpEmail" />
                                <span className={style.nothing}></span>
                            </div>
                            {/* Password input */}
                            <div className={style["password-input"]}>
                                <div className={style["password-border"]}>
                                    <img src="/pw.png" alt="Password Icon" className={style["password-icon"]} />
                                </div>
                                <input
                                    type={showSignUpPassword ? "password" : "text"}
                                    placeholder="Password"
                                    className={style.password}
                                    id="signUpPassword"
                                />
                                <button
                                    type="button"
                                    className={style["toggle-password"]}
                                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                >
                                    {showSignUpPassword ? (
                                        <img src="/eye_off.svg" alt="Hide Password" />
                                    ) : (
                                        <img src="/eye.png" alt="Show Password" />
                                    )}
                                </button>
                            </div>
                            {/* Confirm Password input */}
                            <div className={style["confirm-password-input"]}>
                                <div className={style["confirm-password-border"]}>
                                    <img
                                        src="/tick.png"
                                        alt="Confirm Password Icon"
                                        className={style["confirm-password-icon"]}
                                    />
                                </div>
                                <input
                                    type={showConfirmPassword ? "password" : "text"}
                                    placeholder="Confirm Password"
                                    className={style["confirm-password"]}
                                    id="signUpConfirmPassword"
                                />
                                <button
                                    type="button"
                                    className={style["toggle-password"]}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <img src="/eye_off.svg" alt="Hide Password" />
                                    ) : (
                                        <img src="/eye.png" alt="Show Password" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <button type="submit" ref={signUpButtonRef} style={{ marginTop: "20px" }}>
                            Sign Up
                        </button>
                    </form>
                </div>
                {/* Sign in container */}
                <div className={clsx(style["form-container"], style["sign-in-container"])}>
                    <form onSubmit={handleSubmitSignIn}>
                        <div className={style["logo-container"]}>
                            <img className={style.logo_image} src="/logo&text.png" alt="Logo" />
                        </div>
                        {/* Social login */}
                        <div className={style["social-container"]}>
                            <a href="#" className={style.social}>
                                <img className={style["facebook-icon"]} src="/facebook.png" alt="Facebook" />
                            </a>
                            <a href="#" className={style.social}>
                                <img className={style["google-icon"]} src="/google.png" alt="Google" />
                            </a>
                        </div>
                        <span>or use your account</span>
                        {/* Input container */}
                        <div className={style["input-container"]}>
                            {/* Email input */}
                            <div className={style["email-input"]}>
                                <div className={style["email-border"]}>
                                    <img src="/mail.png" alt="Email Icon" className={style["email-icon"]} />
                                </div>
                                <input type="email" placeholder="Email" id="signInEmail" />
                                <span className={style.nothing}></span>
                            </div>
                            {/* Password input */}
                            <div className={style["password-input"]}>
                                <div className={style["password-border"]}>
                                    <img src="/pw.png" alt="Password Icon" className={style["password-icon"]} />
                                </div>
                                <input
                                    type={showSignInPassword ? "password" : "text"}
                                    placeholder="Password"
                                    className={style.password}
                                    id="signInPassword"
                                />
                                <button
                                    type="button"
                                    className={style["toggle-password"]}
                                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                                >
                                    {showSignInPassword ? (
                                        <img src="/eye_off.svg" alt="Hide Password" />
                                    ) : (
                                        <img src="/eye.png" alt="Show Password" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <a href="#">Forgot your password?</a>
                        <button type="submit" ref={signInButtonRef}>
                            Sign In
                        </button>
                    </form>
                </div>
                <div className={style["overlay-container"]}>
                    <div className={style.overlay}>
                        <div className={clsx(style["overlay-panel"], style["overlay-left"])}>
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button className={style.ghost} id={style.signIn} ref={signInButtonRef}>
                                Sign In
                            </button>
                        </div>
                        <div className={clsx(style["overlay-panel"], style["overlay-right"])}>
                            <h1>Hello, Friend!</h1>
                            <p>Enter your personal details and start journey with us</p>
                            <button className={style.ghost} id={style.signUp} ref={signUpButtonRef}>
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <footer>
                <p>
                    © 2025 All Rights Reserved. Design by{" "}
                    <span style={{ color: "#ff7f50", fontWeight: "600", fontSize: "14px" }}>MusicHub Team - HCMUT</span>
                </p>
            </footer>
        </div>
    );
}
