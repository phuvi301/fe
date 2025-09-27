'use client';

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Xử lý đăng nhập ở đây
    console.log('Login:', { email, password });
  };

  const handleRegister = () => {
    // Xử lý đăng ký ở đây
    console.log('Navigate to register');
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/background.jpg)',
    backgroundSize: 'cover',
    padding: '1rem',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '64rem',
    borderRadius: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  };

  const mainFlexStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '500px'
  };

  const leftPanelStyle: React.CSSProperties = {
    flex: 1,
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #8b5cf6 100%)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    opacity: 0.8
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3rem',
    position: 'relative',
    zIndex: 10
  };

  const soundBarsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginRight: '0.75rem'
  };

  const barStyle = (height: string, color: string): React.CSSProperties => ({
    width: '0.25rem',
    height,
    backgroundColor: color,
    borderRadius: '0.125rem'
  });

  const logoTextStyle: React.CSSProperties = {
    color: 'white',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    position: 'relative',
    zIndex: 10
  };

  const inputGroupStyle: React.CSSProperties = {
    position: 'relative',
  };

  const iconContainerStyle: React.CSSProperties = {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: '2.5rem',
    height: '2.5rem',
    backgroundColor: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const inputStyle: React.CSSProperties = {
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

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '1rem',
  };

  const loginButtonStyle: React.CSSProperties = {
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
    fontWeight: '500',
    fontFamily: 'inherit'
  };

  const rightPanelStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const welcomeContainerStyle: React.CSSProperties = {
    textAlign: 'center'
  };

  const welcomeTitleStyle: React.CSSProperties = {
    fontSize: '2.25rem',
    color: '#2563eb',
    marginBottom: '1.5rem',
    margin: 0
  };

  const welcomeTextStyle: React.CSSProperties = {
    color: '#6b7280',
    marginBottom: '2rem',
    margin: '0 0 2rem 0'
  };

  const registerButtonStyle: React.CSSProperties = {
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
    fontWeight: '500',
    fontFamily: 'inherit'
  };

  return (
    <div className="background" style={containerStyle}>
      <div className="card" style={cardStyle}>
        <div className="main-flex" style={mainFlexStyle}>
          {/* Left Panel - Login Form */}
          <div className="left-panel" style={leftPanelStyle}>            
            <div>
              {/* Logo */}
              <div style={logoContainerStyle}>
                <div>
                  <img src="/logo&text.png" alt="Logo" style={{ height: '100%', width: '75%', display: 'flex'}} />
                </div>
              </div>

              {/* Login Form */}
              <div style={formStyle}>
                {/* Email Input */}
                <div style={inputGroupStyle}>
                  <div style={iconContainerStyle}>
                    <Mail size={20} color="white" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Password Input */}
                <div style={inputGroupStyle}>
                  <div style={iconContainerStyle}>
                    <Lock size={20} color="white" />
                  </div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Login Button */}
                <div style={buttonContainerStyle}>
                  <button
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
          <div style={rightPanelStyle}>
            <div style={welcomeContainerStyle}>
              <h2 style={welcomeTitleStyle}>Hello, Welcome!</h2>
              <p style={welcomeTextStyle}>Don't have an account?</p>
              <button
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