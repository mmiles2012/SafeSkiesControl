import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AircraftFilters } from '@/types/aircraft';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: AircraftFilters;
  onUpdateFilters: (filters: Partial<AircraftFilters>) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onUpdateFilters
}) => {
  const [filters, setFilters] = useState<AircraftFilters>({...currentFilters});
  
  // Update local state when props change
  useEffect(() => {
    setFilters({...currentFilters});
  }, [currentFilters]);
  
  const handleSave = () => {
    onUpdateFilters(filters);
    onClose();
  };
  
  const handleReset = () => {
    const resetFilters = {
      verificationStatus: 'all',
      needsAssistance: undefined,
      searchTerm: '',
      type: undefined
    };
    
    setFilters(resetFilters);
    onUpdateFilters(resetFilters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border-gray-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Aircraft</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Verification Status</Label>
            <RadioGroup 
              value={filters.verificationStatus} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, verificationStatus: value as any }))}
              className="flex space-x-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="verified" id="verified" />
                <Label htmlFor="verified">Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partially_verified" id="partially" />
                <Label htmlFor="partially">Partial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unverified" id="unverified" />
                <Label htmlFor="unverified">Unverified</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Search</Label>
            <Input 
              value={filters.searchTerm || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search by callsign, type, origin..."
              className="bg-surface-light border-gray-700 text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="needsAssistance" 
              checked={filters.needsAssistance === true}
              onCheckedChange={(checked) => {
                setFilters(prev => ({ 
                  ...prev, 
                  needsAssistance: checked === true ? true : undefined 
                }))
              }}
            />
            <Label htmlFor="needsAssistance">Show only aircraft needing assistance</Label>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="bg-surface-light hover:bg-surface text-white"
          >
            Reset Filters
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
