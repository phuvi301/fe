'use client';

import { useRef, useEffect, useState } from 'react';
import { Montserrat } from 'next/font/google';
import './globals.css';
import './login.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Login:', { email, password });
  };

  const handleRegister = () => {
    console.log('Navigate to register');
  };

  // Slider login template
  const signUpButtonRef = useRef(null);
  const signInButtonRef = useRef(null);
  const containerRef = useRef(null);

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
      <div className="container" id="container" ref={containerRef}>
        <div className="form-container sign-up-container">
          <form action="#">
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><img id="facebook-icon" src="/facebook.png" alt="Facebook" /></a>
              <a href="#" className="social"><img id="google-icon" src="/google.png" alt="Google" /></a>
            </div>
            <span>or use your email for registration</span>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button ref={signUpButtonRef}>Sign Up</button>
          </form>
        </div>
        <div className="form-container sign-in-container">
          <form action="#">
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><img id="facebook-icon" src="/facebook.png" alt="Facebook" /></a>
              <a href="#" className="social"><img id="google-icon" src="/google.png" alt="Google" /></a>
            </div>
            <span>or use your account</span>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <a href="#">Forgot your password?</a>
            <button ref={signInButtonRef}>Sign In</button>
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