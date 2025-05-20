import React, { useState } from 'react';
import { MapSettings } from '@/types/aircraft';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

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
  const [showLayersDialog, setShowLayersDialog] = useState(false);
  
  const handleSettingsChange = (key: keyof MapSettings, value: boolean) => {
    onUpdateSettings({ [key]: value });
  };
  
  return (
    <>
      <div className="map-controls absolute right-4 top-4 flex flex-col gap-2 z-10">
        <div className="bg-background/80 dark:bg-card/80 p-1 rounded-lg border border-border shadow-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="w-10 h-10 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                  onClick={onZoomIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
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
                  className="w-10 h-10 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary mt-1 transition-colors"
                  onClick={onZoomOut}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="bg-background/80 dark:bg-card/80 p-1 rounded-lg border border-border shadow-md">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="w-10 h-10 rounded-md hover:bg-accent/50 flex items-center justify-center transition-colors"
                  onClick={() => setShowLayersDialog(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
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
                  className="w-10 h-10 rounded-md hover:bg-accent/50 flex items-center justify-center mt-1 transition-colors"
                  onClick={onResetView}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
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
                  className={`w-10 h-10 rounded-md flex items-center justify-center mt-1 transition-colors ${
                    settings.showFlightPaths 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleSettingsChange('showFlightPaths', !settings.showFlightPaths)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="M3 9h18"></path>
                    <path d="M15 3v18"></path>
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Flight Paths</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Dialog open={showLayersDialog} onOpenChange={setShowLayersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Settings</DialogTitle>
            <DialogDescription>
              Customize the map display and visible elements
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid">Grid Lines</Label>
              <Switch 
                id="show-grid" 
                checked={settings.showGrid} 
                onCheckedChange={(checked) => handleSettingsChange('showGrid', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-restrictions">Restricted Areas</Label>
              <Switch 
                id="show-restrictions" 
                checked={settings.showRestrictions} 
                onCheckedChange={(checked) => handleSettingsChange('showRestrictions', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-sectors">Sector Boundaries</Label>
              <Switch 
                id="show-sectors" 
                checked={settings.showSectors} 
                onCheckedChange={(checked) => handleSettingsChange('showSectors', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-labels">Aircraft Labels</Label>
              <Switch 
                id="show-labels" 
                checked={settings.showLabels} 
                onCheckedChange={(checked) => handleSettingsChange('showLabels', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-verified-only">Show Verified Aircraft Only</Label>
              <Switch 
                id="show-verified-only" 
                checked={settings.showVerifiedOnly} 
                onCheckedChange={(checked) => handleSettingsChange('showVerifiedOnly', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-flight-paths">Show Flight Paths</Label>
              <Switch 
                id="show-flight-paths" 
                checked={settings.showFlightPaths} 
                onCheckedChange={(checked) => handleSettingsChange('showFlightPaths', checked)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowLayersDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapControls;
