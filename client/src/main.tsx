import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';

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
  
  /* Resizable panel improvements */
  .resize-handle {
    width: 4px !important;
    background: #3D3D3D;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .resize-handle:hover {
    background: #555;
  }
  
  .resize-handle:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 20px;
    background: #666;
    border-radius: 1px;
  }
  
  /* Map container responsive styles */
  .map-container {
    width: 100%;
    height: 100%;
    transition: all 0.3s ease;
  }
  
  /* Ensure proper map sizing during panel resize */
  .mapboxgl-map {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Panel transition smoothing */
  [data-panel-group] {
    transition: all 0.2s ease;
  }
  
  /* Improve panel resize visual feedback */
  [data-panel-resize-handle-enabled] {
    cursor: col-resize;
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  </QueryClientProvider>
);
