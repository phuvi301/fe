'use client';

import { useState } from 'react';
import { Montserrat } from 'next/font/google';
import './globals.css';

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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="main-flex">
          {/* Left Panel - Login Form */}
          <div className="left-panel">
            <div>
              {/* Logo */}
              <div className="logo-container">
                <div>
                  <img
                    src="/logo&text.png"
                    alt="Logo"
                  />
                </div>
              </div>

              {/* Login Form */}
              <div className="login-form">
                {/* Email Input */}
                <div className="input-group">
                  <div className="icon-container">
                    <img src="/Mail.png" alt="Mail Icon" className="mail-icon" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                  />
                </div>

                {/* Password Input */}
                <div className="input-group">
                  <div className="icon-container">
                    <img src="/Password.png" alt="Lock Icon" className="password-icon" />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                  />
                </div>

                {/* Login Button */}
                <div className="button-container">
                  <button
                    onClick={handleLogin}
                    className="login-button"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Welcome */}
          <div className="right-panel">
            <div className="welcome-container">
              <h2 className="welcome-title">Hello, Welcome!</h2>
              <p className="welcome-text">Don't have an account?</p>
              <button
                onClick={handleRegister}
                className="register-button"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
