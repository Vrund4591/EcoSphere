import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: 18 }}
        toastOptions={{
          duration: 2800,
          // Floating dark-forest pill — matches the sidebar / auth brand panels.
          style: {
            background: '#14231B',
            color: '#F3F1E9',
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontSize: '13.5px',
            fontWeight: 500,
            lineHeight: '1.45',
            padding: '11px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 12px 32px -10px rgba(20,30,24,0.5)',
            maxWidth: '440px',
          },
          success: {
            duration: 2500,
            iconTheme: { primary: '#5EA97E', secondary: '#14231B' }, // forest circle, dark check
          },
          error: {
            duration: 4200,
            iconTheme: { primary: '#D08363', secondary: '#14231B' }, // rust circle, dark X
          },
          loading: {
            iconTheme: { primary: '#C99A45', secondary: 'rgba(255,255,255,0.18)' }, // gold spinner
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
