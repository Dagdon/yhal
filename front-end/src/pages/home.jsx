import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

/**
 * Dashboard Home Page
 * Main dashboard accessible only to authenticated users
 * Features meal analysis and recent meals overview
 */
const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simple authentication check
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <a href="/" className="logo-link">
            <img 
              src="../../public/images/yhal-logo.jpg" 
              alt="YHAL Logo" 
              className="dashboard-logo"
            />
          </a>
          
          <nav className="dashboard-nav">
            <a href="/history" className="nav-button">See Meal History</a>
            <a href="/about" className="nav-button">About</a>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            Snap a meal.<br />
            Know what's inside.
          </h1>
          <a href="/analyze" className="analyze-button">
            ANALYZE MEAL
          </a>
        </section>

        {/* Recent Meals Section */}
        <section className="recent-meals-section">
          <h2 className="section-title">Recent Meals</h2>
          <div className="empty-state">
            <p className="empty-text">SCAN YOUR FIRST MEAL</p>
            <a href="/analyze" className="scan-button">
              Start Scanning
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
