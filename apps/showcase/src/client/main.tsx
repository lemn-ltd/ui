import { createRoot } from 'react-dom/client';
import '@appranks/ui/styles.css';
import '@appranks/showcase-kit/styles.css';
import './styles.css';
import { UiShowcaseApp } from './ui-showcase-app';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(<UiShowcaseApp />);
