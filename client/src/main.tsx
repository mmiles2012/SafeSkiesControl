import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add CSS for Mapbox GL
import 'mapbox-gl/dist/mapbox-gl.css';

// Set global styles for toasts and aircraft markers
const style = document.createElement('style');
style.textContent = `
  .aircraft-marker {
    transition: transform 0.2s;
  }
  .aircraft-marker:hover {
    transform: scale(1.5);
    z-index: 100;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  .mapboxgl-popup {
    z-index: 10;
  }
  
  .mapboxgl-popup-content {
    background-color: #1E1E1E;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    border: 1px solid #3D3D3D;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1E1E1E;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3D3D3D;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
