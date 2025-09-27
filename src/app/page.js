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
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = () => {
    // Xử lý đăng nhập ở đây
    console.log('Login:', { email, password });
  };

  const handleRegister = () => {
    // Xử lý đăng ký ở đây
    console.log('Navigate to register');
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/background.jpg)',
    backgroundSize: 'cover',
    padding: '1rem',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '64rem',
    borderRadius: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  };

  const mainFlexStyle = {
    display: 'flex',
    minHeight: '500px',
  };

  const leftPanelStyle = {
    flex: 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    transition: 'backdrop-filter 0.5s',
    backdropFilter: isHovered ? 'blur(50px)' : 'blur(10px)'
  };

  const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'relative',
    zIndex: 10
  };

  const inputGroupStyle = {
    position: 'relative',
  };

  const iconContainerStyle = {
    position: 'absolute',
    left: '0rem',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    '--icon-size': '3rem',
    width: 'var(--icon-size)',
    height: 'var(--icon-size)',
    backgroundColor: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const inputStyle = {
    paddingLeft: '4rem',
    paddingRight: '1rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    height: '3rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '1.5rem',
    color: 'white',
    fontSize: '1rem',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '1rem',
  };

  const loginButtonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    paddingLeft: '3rem',
    paddingRight: '3rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    height: '3rem',
    borderRadius: '1.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '1rem',
    fontWeight: '900',
    fontFamily: 'inherit'
  };

  const rightPanelStyle = {
    flex: 1,
    backgroundColor: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const welcomeContainerStyle = {
    textAlign: 'center'
  };

  const welcomeTitleStyle = {
    fontSize: '2.25rem',
    color: '#2563eb',
    marginBottom: '1.5rem',
    margin: 0
  };

  const welcomeTextStyle = {
    color: '#6b7280',
    marginBottom: '2rem',
    margin: '0 0 2rem 0'
  };

  const registerButtonStyle = {
    border: '2px solid #2563eb',
    color: '#2563eb',
    backgroundColor: 'transparent',
    paddingLeft: '3rem',
    paddingRight: '3rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    height: '3rem',
    borderRadius: '1.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '1rem',
    fontWeight: '900',
    fontFamily: 'inherit'
  };

  return (
    <div className="background" style={containerStyle}>
      <div className="card" style={cardStyle}>
        <div 
          className="main-flex"
          style={mainFlexStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          {/* Left Panel - Login Form */}
          <div className="left-panel" style={leftPanelStyle}>
            <div className="left-content">
              {/* Logo */}
              <div className="logo-container" style={logoContainerStyle}>
                <img src="/logo&text.png" alt="Logo" style={{height: 'auto', width: '75%'}} />
              </div>

              {/* Login Form */}
              <div style={formStyle}>
                {/* Email Input */}
                <div className="input-group" style={inputGroupStyle}>
                  <div className="icon-container" style={iconContainerStyle}>
                    <img id="email-icon" src="/mail.png" alt="Email" style={{height: '100%', width: 'auto'}}/>
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Password Input */}
                <div className="input-group" style={inputGroupStyle}>
                  <div className="icon-container" style={iconContainerStyle}>
                    <img id="password-icon" src="/pw.png" alt="Password" style={{height: '90%', width: 'auto'}}/>
                  </div>
                  <input
                    id="password-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Login Button */}
                <div className="button-container" style={buttonContainerStyle}>
                  <button
                    id="login-button"
                    onClick={handleLogin}
                    style={loginButtonStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Welcome */}
          <div className="right-panel" style={rightPanelStyle}>
            <div className="welcome-container" style={welcomeContainerStyle}>
              <h2 id="welcome-title" style={welcomeTitleStyle}>Hello, Welcome!</h2>
              <p id="welcome-text" style={welcomeTextStyle}>Don't have an account?</p>
              <button
                id="register-button"
                onClick={handleRegister}
                style={registerButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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