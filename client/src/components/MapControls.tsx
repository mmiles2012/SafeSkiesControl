import React from 'react';
import { MapSettings } from '@/types/aircraft';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLayers: () => void;
  settings: MapSettings;
  onUpdateSettings: (settings: Partial<MapSettings>) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleLayers,
  settings,
  onUpdateSettings
}) => {
  return (
    <div className="map-controls absolute right-4 top-4 flex flex-col space-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              onClick={onZoomIn}
            >
              <i className="material-icons">add</i>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              onClick={onZoomOut}
            >
              <i className="material-icons">remove</i>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="border-t border-gray-700 pt-2"></div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              onClick={onToggleLayers}
            >
              <i className="material-icons">layers</i>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Map Layers</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              onClick={onResetView}
            >
              <i className="material-icons">public</i>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset View</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                settings.showFlightPaths ? 'bg-primary' : ''
              }`}
              onClick={() => onUpdateSettings({ showFlightPaths: !settings.showFlightPaths })}
            >
              <i className="material-icons">timeline</i>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Toggle Flight Paths</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default MapControls;
