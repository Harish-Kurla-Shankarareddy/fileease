import React, { useEffect, useState } from 'react';
import ReactGA from 'react-ga4';
import { HomePage } from './pages/HomePage';
import { ConverterPage } from './pages/ConverterPage';

const GA_MEASUREMENT_ID = 'G-180XW1N3Z0'; // Replace with your actual GA4 ID

type Page = 'home' | 'converter';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  useEffect(() => {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
    console.log('✅ Google Analytics initialized');
  }, []);

  return (
    <div className="App">
      {currentPage === 'home' && (
        <HomePage onNavigateToConverter={() => setCurrentPage('converter')} />
      )}
      {currentPage === 'converter' && (
        <ConverterPage onNavigateHome={() => setCurrentPage('home')} />
      )}
    </div>
  );
}

export default App;
