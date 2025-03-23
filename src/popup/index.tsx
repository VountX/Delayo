import React from 'react';
import ReactDOM from 'react-dom/client';

// Importa a configuração do Font Awesome
import '../utils/fontAwesome';

import Popup from './Popup';

// Fix import path to point to the correct location
import '../index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
