import React from 'react';
import { createRoot } from 'react-dom/client';
import '../i18n';

import Options from './Options';

import '../index.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  );
}
