import React from 'react';
import '../../styles/index.css';

/**
 * Home Page Component
 * Main landing page featuring hero section with food analysis introduction
 */
const Home = () => {
  return (
    <div className="home-page">
      {/* Header directly included */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo-link">
            <img 
              src="/images/yhal-logo.jpg" 
              alt="YHAL Logo" 
              className="logo"
            />
          </a>
          
          <nav className="nav">
            <ul className="nav-list">
              <li className="nav-item">
                <a href="/signup" className="nav-link nav-link--primary">
                  GET STARTED
                </a>
              </li>
              <li className="nav-item">
                <a href="/login" className="nav-link nav-link--secondary">
                  LOG IN
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-container">
          <h1 className="hero-title">
            Snap a meal.<br />Know what's inside.
          </h1>
          
          <div className="divider"></div>
          
          {/* Hero Image */}
          <div className="hero-image-container">
            <img 
              src="/images/home-image.jpg" 
              alt="African cuisine examples" 
              className="hero-image"
              loading="lazy"
            />
          </div>
          
          {/* Subtitle */}
          <p className="hero-subtitle">
            Use AI to analyze your African food – identify the ingredients,
            learn about nutrition, and discover its cultural origin.
          </p>
          
          {/* Call-to-Action Button */}
          <div className="button-container">
            <a href="/signup" className="cta-button">
              GET STARTED
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
