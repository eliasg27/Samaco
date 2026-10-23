import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {ProfesionalProvider} from './profesionales/context';
import {ContenidoProvider} from './contenido';
import {BrowserRouter} from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContenidoProvider>
        <ProfesionalProvider>
          <App />
        </ProfesionalProvider>
      </ContenidoProvider>
    </BrowserRouter>
  </StrictMode>,
);
