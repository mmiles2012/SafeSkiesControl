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
      <DialogContent className="bg-surface border-gray-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showGrid" className="flex flex-col">
              <span>Show Grid</span>
              <span className="text-xs text-text-secondary">Show coordinate grid on map</span>
            </Label>
            <Switch 
              id="showGrid" 
              checked={localSettings.showGrid} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showGrid: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showRestrictions" className="flex flex-col">
              <span>Show Restrictions</span>
              <span className="text-xs text-text-secondary">Display airspace restriction zones</span>
            </Label>
            <Switch 
              id="showRestrictions" 
              checked={localSettings.showRestrictions} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showRestrictions: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showSectors" className="flex flex-col">
              <span>Show Sectors</span>
              <span className="text-xs text-text-secondary">Display airspace sector boundaries</span>
            </Label>
            <Switch 
              id="showSectors" 
              checked={localSettings.showSectors} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showSectors: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showVerifiedOnly" className="flex flex-col">
              <span>Show Verified Only</span>
              <span className="text-xs text-text-secondary">Hide unverified aircraft on map</span>
            </Label>
            <Switch 
              id="showVerifiedOnly" 
              checked={localSettings.showVerifiedOnly} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showVerifiedOnly: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showLabels" className="flex flex-col">
              <span>Show Labels</span>
              <span className="text-xs text-text-secondary">Display aircraft callsign labels</span>
            </Label>
            <Switch 
              id="showLabels" 
              checked={localSettings.showLabels} 
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, showLabels: checked }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="showFlightPaths" className="flex flex-col">
              <span>Show Flight Paths</span>
              <span className="text-xs text-text-secondary">Display projected flight paths for selected aircraft</span>
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
            className="bg-surface-light hover:bg-surface text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapSettings;
