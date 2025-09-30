'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import './login.css';

export default function Home() {
  const router = useRouter();

  const homeRouter = () => {
    router.push("/");
  }

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
      container.classList.add("right-panel-active");
    };

    const handleSignIn = () => {
      container.classList.remove("right-panel-active");
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

  return (
    <div className="background">
      {/* Container */}
      <div className="container" ref={containerRef}>
        {/* Sign up container */}
        <div className="form-container sign-up-container">
          <form action="#">
            {/* Logo web */}
            <div className="logo-container">
              <img className="logo_image" src="/logo&text.png" alt="Logo" />
            </div>
            {/* Social login */}
            <div className="social-container">
              <a href="#" className="social"><img className="facebook-icon" src="/facebook.png" alt="Facebook" /></a>
              <a href="#" className="social"><img className="google-icon" src="/google.png" alt="Google" /></a>
            </div>
            <span>or use your email for registration</span>
            {/* Input container */}
            <div className="input-container">
              {/* Email input */}
              <div className="email-input">
                <div className="email-border">
                  <img src="/mail.png" alt="Email Icon" className="email-icon" />
                </div>
                <input type="email" placeholder="Email" className="email" />
              </div>
              {/* Password input */}
              <div className="password-input">
                <div className="password-border">
                  <img src="/pw.png" alt="Password Icon" className="password-icon" />
                </div>
                <input type={showSignUpPassword ? "password" : "text"} placeholder="Password" className="password" />
                <button type="button" className="toggle-password" onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                  {showSignUpPassword ? <img src="/eye_off.svg" alt="Hide Password" /> : <img src="/eye.png" alt="Show Password" />}
                </button>              
              </div>
              {/* Confirm Password input */}
              <div className="confirm-password-input">
                <div className="confirm-password-border">
                  <img src="/tick.png" alt="Confirm Password Icon" className="confirm-password-icon" />
                </div>
                <input type={showConfirmPassword ? "password" : "text"} placeholder="Confirm Password" className="confirm-password" />
                <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <img src="/eye_off.svg" alt="Hide Password" /> : <img src="/eye.png" alt="Show Password" />}
                </button>
              </div>
            </div>
            <button type="button" onClick={homeRouter} ref={signUpButtonRef} style={{ marginTop: "20px" }}>Sign Up</button>
          </form>
        </div>
        {/* Sign in container */}
        <div className="form-container sign-in-container">
          <form action="#">
            <div className="logo-container">
              <img className="logo_image" src="/logo&text.png" alt="Logo" />
            </div>
            {/* Social login */}
            <div className="social-container">
              <a href="#" className="social"><img className="facebook-icon" src="/facebook.png" alt="Facebook" /></a>
              <a href="#" className="social"><img className="google-icon" src="/google.png" alt="Google" /></a>
            </div>
            <span>or use your account</span>
            {/* Input container */}
            <div className="input-container">
              {/* Email input */}
              <div className="email-input">
                <div className="email-border">
                  <img src="/mail.png" alt="Email Icon" className="email-icon" />
                </div>
                <input type="email" placeholder="Email" className="email" />
              </div>
              {/* Password input */}
              <div className="password-input">
                <div className="password-border">
                  <img src="/pw.png" alt="Password Icon" className="password-icon" />
                </div>
                <input type={showSignInPassword ? "password" : "text"} placeholder="Password" className="password" />
                <button type="button" className="toggle-password" onClick={() => setShowSignInPassword(!showSignInPassword)}>
                  {showSignInPassword ? <img src="/eye_off.svg" alt="Hide Password" /> : <img src="/eye.png" alt="Show Password" />}
                </button>              
              </div>
            </div>
            <a href="#">Forgot your password?</a>
            <button type="button" onClick={homeRouter} ref={signInButtonRef}>Sign In</button>
          </form>
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" id="signIn" ref={signInButtonRef}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" id="signUp" ref={signUpButtonRef}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}