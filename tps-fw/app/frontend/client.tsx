/**
 * Client-side entry point untuk frontend baru
 * File ini akan di-bundle menjadi frontend.js
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { HomePage } from './pages/HomePage';

// Get initial data from server
declare global {
  interface Window {
    __INITIAL_DATA__?: any;
    __ROUTE__?: string;
  }
}

// Simple client-side router
function App() {
  const initialData = window.__INITIAL_DATA__ || {};
  const route = window.__ROUTE__ || window.location.pathname;

  // Route matching
  if (route === '/' || route === '/new') {
    return <HomePage content={initialData} />;
  }

  // Fallback - tampilkan pesan bahwa halaman belum di-implement
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Halaman dalam pengembangan
        </h1>
        <p className="text-gray-600 mb-4">
          Route: <code className="bg-gray-200 px-2 py-1 rounded">{route}</code>
        </p>
        <a
          href="/"
          className="inline-block bg-[#0475BC] text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Kembali ke Home
        </a>
      </div>
    </div>
  );
}

// Mount app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
