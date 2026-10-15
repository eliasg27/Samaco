import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {ProfesionalProvider} from './profesionales/context';
import {BrowserRouter} from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProfesionalProvider>
        <App />
      </ProfesionalProvider>
    </BrowserRouter>
  </StrictMode>,
);
