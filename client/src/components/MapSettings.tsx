import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMapControls } from '@/hooks/useMapControls';

interface MapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapSettings: React.FC<MapSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { mapSettings, updateMapSettings } = useMapControls();
  
  const [localSettings, setLocalSettings] = useState({
    showGrid: mapSettings.showGrid,
    showRestrictions: mapSettings.showRestrictions,
    showSectors: mapSettings.showSectors,
    showVerifiedOnly: mapSettings.showVerifiedOnly,
    showLabels: mapSettings.showLabels,
    showFlightPaths: mapSettings.showFlightPaths
  });
  
  const handleSave = () => {
    updateMapSettings(localSettings);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Map Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showGrid" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z"/>
                <path d="M3 9h18"/>
                <path d="M3 15h18"/>
                <path d="M9 3v18"/>
                <path d="M15 3v18"/>
              </svg>
              <div className="flex flex-col">
                <span>Show Grid</span>
                <span className="text-xs text-muted-foreground">Show coordinate grid on map</span>
              </div>
            </Label>
            <Switch 
              id="showGrid" 
              checked={localSettings.showGrid} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showGrid: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showRestrictions" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex flex-col">
                <span>Show Restrictions</span>
                <span className="text-xs text-muted-foreground">Display airspace restriction zones</span>
              </div>
            </Label>
            <Switch 
              id="showRestrictions" 
              checked={localSettings.showRestrictions} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showRestrictions: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showSectors" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--partially-verified))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <div className="flex flex-col">
                <span>Show Sectors</span>
                <span className="text-xs text-muted-foreground">Display airspace sector boundaries</span>
              </div>
            </Label>
            <Switch 
              id="showSectors" 
              checked={localSettings.showSectors} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showSectors: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showVerifiedOnly" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--verified))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div className="flex flex-col">
                <span>Show Verified Only</span>
                <span className="text-xs text-muted-foreground">Hide unverified aircraft on map</span>
              </div>
            </Label>
            <Switch 
              id="showVerifiedOnly" 
              checked={localSettings.showVerifiedOnly} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showVerifiedOnly: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showLabels" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
                <path d="M8 14h8"/>
              </svg>
              <div className="flex flex-col">
                <span>Show Labels</span>
                <span className="text-xs text-muted-foreground">Display aircraft callsign labels</span>
              </div>
            </Label>
            <Switch 
              id="showLabels" 
              checked={localSettings.showLabels} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showLabels: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showFlightPaths" className="flex items-center space-x-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <div className="flex flex-col">
                <span>Show Flight Paths</span>
                <span className="text-xs text-muted-foreground">Display projected flight paths for selected aircraft</span>
              </div>
            </Label>
            <Switch 
              id="showFlightPaths" 
              checked={localSettings.showFlightPaths} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showFlightPaths: checked }))} 
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapSettings;
