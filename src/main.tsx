import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for offline functionality only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        console.log('Service worker registered successfully');
      })
      .catch((registrationError) => {
        console.error('Service worker registration failed:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);
