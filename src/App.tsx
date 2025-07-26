import React, { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { ConverterPage } from './pages/ConverterPage';

type Page = 'home' | 'converter';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

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