'use client';

import { useState } from 'react';
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

  return (
    <div className="background">
      <div className="card">
        <div className="main-flex">
          {/* Left Panel - Login Form */}
          <div className="left-panel">
            <div>
              {/* Logo */}
              <div className="logo-container">
                <img src="/logo&text.png" alt="Logo"/>
              </div>

              {/* Login Form */}
              <div className="login-form">
                {/* Email Input */}
                <div className="input-group">
                  <div className="icon-container">
                    <img src="/mail.png" alt="Mail Icon" id="email-icon" />
                  </div>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password Input */}
                <div className="input-group">
                  <div className="icon-container">
                    <img src="/pw.png" alt="Lock Icon" id="password-icon" />
                  </div>
                  <input
                    className="login-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                {/* Button Container */}
                <div className="button-container">
                  {/* Login Button */}
                  <button className="login-button" onClick={handleLogin}>
                    Login
                  </button>
                  {/* Login with Google */}
                  <button className="google-button">
                    <img src="/google.png" alt="Google Icon" className="google-icon" />
                    Login with Google
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Welcome */}
          <div className="right-panel">
            <div className="welcome-container">
              <h2 className="welcome-title">Hello, Friend!</h2>
              <p className="welcome-text">Don't have an account?</p>
              <button onClick={handleRegister} className="register-button">
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}