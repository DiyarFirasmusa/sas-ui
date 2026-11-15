import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { DocsSettingsProvider } from './docs-settings';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root');
}
createRoot(container).render(
  <StrictMode>
    <DocsSettingsProvider>
      <App />
    </DocsSettingsProvider>
  </StrictMode>,
);
