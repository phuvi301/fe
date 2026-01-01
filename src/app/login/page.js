"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import axios from "axios";
import clsx from "clsx";
import style from "./login.module.css";

// --- Set Cookie an toàn ---
function setAuthCookie(token, expireTime) {
    const expires = new Date(expireTime).toUTCString();
    document.cookie = `accessToken=${token}; expires=${expires}; path=/; Secure; SameSite=Lax`;
}

const handleFocus = (e) => {
    e.target.removeAttribute('readonly');
};

export default function LoginPage() {
    const router = useRouter();
    const [oauthConfig, setOauthConfig] = useState(null);
    
    // State điều khiển hiệu ứng trượt 
    const [isSignUpActive, setIsSignUpActive] = useState(false);

    // State quản lý hiển thị password
    const [showSignInPass, setShowSignInPass] = useState(false);
    const [showSignUpPass, setShowSignUpPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // --- 1. Fetch OAuth Config ---
    useEffect(() => {
        localStorage.removeItem("userInfo");
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/oauth-config`)
            .then(res => setOauthConfig(res.data))
            .catch(err => console.error("OAuth config error:", err));
    }, []);

    // --- 2. Init Facebook SDK ---
    useEffect(() => {
        if (!oauthConfig?.facebookAppId) return;
        window.fbAsyncInit = function() {
            window.FB.init({
                appId: oauthConfig.facebookAppId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        };
    }, [oauthConfig]);

    // --- 3. Handlers ---
    const handleLoginSuccess = (data) => {
        console.log("Login success:", data);
        localStorage.setItem("userInfo", JSON.stringify(data));
        setAuthCookie(data.accessToken, data.accessExpireTime);
        router.push("/");
    };

    const handleSubmitSignUp = async (e) => {
        e.preventDefault();
        const email = e.target.signUpEmail.value;
        const password = e.target.signUpPassword.value;
        const confirmPassword = e.target.signUpConfirmPassword.value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, { email, password });
            alert("Registration successful! Please log in.");
            setIsSignUpActive(false); 
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Registration failed");
        }
    };

    const handleSubmitSignIn = async (e) => {
        e.preventDefault();
        const email = e.target.signInEmail.value;
        const password = e.target.signInPassword.value;

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`,
                { email, password },
                { withCredentials: true }
            );
            handleLoginSuccess(res.data.data);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Login failed");
        }
    };

    // --- OAuth Logic ---
    const handleGoogleAuth = (isRegistration = false) => {
        if (!oauthConfig || !window.google) {
            return alert("Google Service not ready. Please try again.");
        }
        window.google.accounts.oauth2.initTokenClient({
            client_id: oauthConfig.googleClientId,
            scope: 'email profile',
            callback: (response) => {
                if (response.access_token) {
                    const endpoint = isRegistration ? 'google-register' : 'google';
                    axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${endpoint}`,
                        { accessToken: response.access_token },
                        { withCredentials: true }
                    ).then((res) => {
                        handleLoginSuccess(res.data.data);
                    }).catch((error) => {
                        const msg = error.response?.data?.message;
                        if (error.response?.data?.requireRegistration) {
                            alert("Account not found. Switching to Register...");
                            setIsSignUpActive(true); 
                        } else {
                            alert(msg || "Google authentication failed");
                        }
                    });
                }
            },
        }).requestAccessToken();
    };

    const handleFacebookAuth = () => {
        if (!oauthConfig || !window.FB) {
            return alert("Facebook Service not ready.");
        }
        window.FB.login((response) => {
            if (response.authResponse) {
                axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facebook`,
                    { accessToken: response.authResponse.accessToken },
                    { withCredentials: true }
                ).then((res) => {
                    handleLoginSuccess(res.data.data);
                }).catch((error) => {
                    alert(error.response?.data?.message || "Facebook login failed");
                });
            }
        }, { scope: 'email' });
    };

    // --- Render ---
    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
            <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" />

            <div className={style.background}>
                <div className={clsx(style.container, isSignUpActive && style["right-panel-active"])}>
                    
                    {/* --- Sign Up Form --- */}
                    <div className={clsx(style["form-container"], style["sign-up-container"])}>
                        <form onSubmit={handleSubmitSignUp} autoComplete="off">
                            <input type="text" style={{opacity: 0, position: 'absolute', zIndex: -1, height: 0, width: 0}} />
                            <input type="password" style={{opacity: 0, position: 'absolute', zIndex: -1, height: 0, width: 0}} />

                            <div className={style["logo-container"]}>
                                <img className={style.logo_image} src="/logo&text.png" alt="Logo" />
                            </div>
                            <div className={style["social-container"]}>
                                <button type="button" onClick={handleFacebookAuth} className={style.social}>
                                    <img className={style["facebook-icon"]} src="/facebook.png" alt="FB" />
                                </button>
                                <button type="button" onClick={() => handleGoogleAuth(true)} className={style.social}>
                                    <img className={style["google-icon"]} src="/google.png" alt="GG" />
                                </button>
                            </div>
                            <span>or use your email for registration</span>
                            
                            <div className={style["input-container"]}>
                                <div className={style["email-input"]}>
                                    <div className={style["email-border"]}><img src="/mail.png" className={style["email-icon"]} alt="" /></div>
                                    <input 
                                        type="email" 
                                        placeholder="Email" 
                                        name="signUpEmail" 
                                        id="signUpEmail"
                                        autoComplete="off"
                                        readOnly
                                        onFocus={handleFocus}
                                        required 
                                    />
                                </div>
                                <div className={style["password-input"]}>
                                    <div className={style["password-border"]}><img src="/pw.png" className={style["password-icon"]} alt="" /></div>
                                    <input 
                                        type={showSignUpPass ? "text" : "password"} 
                                        placeholder="Password" 
                                        name="signUpPassword" 
                                        id="signUpPassword"
                                        autoComplete="new-password"
                                        className={style.password} 
                                        readOnly
                                        onFocus={handleFocus}
                                        required 
                                    />
                                    <button type="button" className={style["toggle-password"]} onClick={() => setShowSignUpPass(!showSignUpPass)}>
                                        <img src={showSignUpPass ? "/eye_off.svg" : "/eye.png"} alt="Toggle" />
                                    </button>
                                </div>
                                <div className={style["confirm-password-input"]}>
                                    <div className={style["confirm-password-border"]}><img src="/tick.png" className={style["confirm-password-icon"]} alt="" /></div>
                                    <input 
                                        type={showConfirmPass ? "text" : "password"} 
                                        placeholder="Confirm Password" 
                                        name="signUpConfirmPassword" 
                                        id="signUpConfirmPassword"
                                        autoComplete="new-password"
                                        className={style["confirm-password"]} 
                                        readOnly
                                        onFocus={handleFocus}
                                        required 
                                    />
                                    <button type="button" className={style["toggle-password"]} onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                        <img src={showConfirmPass ? "/eye_off.svg" : "/eye.png"} alt="Toggle" />
                                    </button>
                                </div>
                            </div>
                            <button type="submit" style={{ marginTop: "20px" }}>Sign Up</button>
                            
                            <button 
                                type="button" 
                                className={style["mobile-toggle-btn"]}
                                onClick={() => setIsSignUpActive(false)}
                            >
                                Already have an account? Sign In
                            </button>
                        </form>
                    </div>

                    {/* --- Sign In Form --- */}
                    <div className={clsx(style["form-container"], style["sign-in-container"])}>
                        <form onSubmit={handleSubmitSignIn} autoComplete="off">
                            <input type="text" style={{opacity: 0, position: 'absolute', zIndex: -1, height: 0, width: 0}} />
                            <input type="password" style={{opacity: 0, position: 'absolute', zIndex: -1, height: 0, width: 0}} />

                            <div className={style["logo-container"]}>
                                <img className={style.logo_image} src="/logo&text.png" alt="Logo" />
                            </div>
                            <div className={style["social-container"]}>
                                <button type="button" onClick={handleFacebookAuth} className={style.social}>
                                    <img className={style["facebook-icon"]} src="/facebook.png" alt="FB" />
                                </button>
                                <button type="button" onClick={() => handleGoogleAuth(false)} className={style.social}>
                                    <img className={style["google-icon"]} src="/google.png" alt="GG" />
                                </button>
                            </div>
                            <span>or use your account</span>
                            
                            <div className={style["input-container"]}>
                                <div className={style["email-input"]}>
                                    <div className={style["email-border"]}><img src="/mail.png" className={style["email-icon"]} alt="" /></div>
                                    <input 
                                        type="email" 
                                        placeholder="Email" 
                                        name="signInEmail" 
                                        id="signInEmail"
                                        autoComplete="off"
                                        readOnly
                                        onFocus={handleFocus}
                                        required 
                                    />
                                </div>
                                <div className={style["password-input"]}>
                                    <div className={style["password-border"]}><img src="/pw.png" className={style["password-icon"]} alt="" /></div>
                                    <input 
                                        type={showSignInPass ? "text" : "password"} 
                                        placeholder="Password" 
                                        name="signInPassword" 
                                        id="signInPassword"
                                        autoComplete="new-password"
                                        className={style.password} 
                                        readOnly
                                        onFocus={handleFocus}
                                        required 
                                    />
                                    <button type="button" className={style["toggle-password"]} onClick={() => setShowSignInPass(!showSignInPass)}>
                                        <img src={showSignInPass ? "/eye_off.svg" : "/eye.png"} alt="Toggle" />
                                    </button>
                                </div>
                            </div>
                            <a href="#">Forgot your password?</a>
                            <button type="submit">Sign In</button>

                            <button 
                                type="button" 
                                className={style["mobile-toggle-btn"]}
                                onClick={() => setIsSignUpActive(true)}
                            >
                                Don't have an account? Sign Up
                            </button>
                        </form>
                    </div>

                    {/* --- Overlay (Ẩn trên Mobile) --- */}
                    <div className={style["overlay-container"]}>
                        <div className={style.overlay}>
                            <div className={clsx(style["overlay-panel"], style["overlay-left"])}>
                                <h1>Welcome Back!</h1>
                                <p>To keep connected with us please login with your personal info</p>
                                <button className={style.ghost} onClick={() => setIsSignUpActive(false)}>
                                    Sign In
                                </button>
                            </div>
                            <div className={clsx(style["overlay-panel"], style["overlay-right"])}>
                                <h1>Hello, Friend!</h1>
                                <p>Enter your personal details and start journey with us</p>
                                <button className={style.ghost} onClick={() => setIsSignUpActive(true)}>
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <footer>
                    <p>© 2025 All Rights Reserved. Design by <span style={{ color: "#ff7f50", fontWeight: "600", fontSize: "14px" }}>MusicHub Team - HCMUT</span></p>
                </footer>
            </div>
        </>
    );
}