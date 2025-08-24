import React, { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { HomePage } from './pages/HomePage';

const GA_MEASUREMENT_ID = 'G-180XW1N3Z0'; // Replace with your actual GA4 ID

function App() {
  useEffect(() => {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
    console.log('✅ Google Analytics initialized');
  }, []);

  return (
    <div className="App">
      <HomePage />
    </div>
  );
}

export default App;