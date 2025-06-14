import React from 'react';
import ReactDOM from 'react-dom/client';

import '../../utils/fontAwesome';

import Popup from './Popup';

import '../../index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
