
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set document title programmatically
document.title = '행복한 용돈 관리';

createRoot(document.getElementById("root")!).render(<App />);
