import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import 'pdfjs-dist/web/pdf_viewer.css';
import '@/app/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
