import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import SupabaseGate from './components/SupabaseGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SupabaseGate>
        <App />
      </SupabaseGate>
    </AuthProvider>
  </StrictMode>,
);
