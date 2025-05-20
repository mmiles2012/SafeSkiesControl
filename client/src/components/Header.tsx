import React, { useState } from 'react';
import { DataSource } from '../types/aircraft';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  currentUser: {
    displayName: string;
    initials: string;
  };
  systemStatus: 'operational' | 'degraded' | 'offline';
  dataSources: DataSource[];
  onOpenSettings: () => void;
  onOpenFilters: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  currentUser,
  systemStatus,
  dataSources,
  onOpenSettings,
  onOpenFilters
}) => {
  const [showLiveDataDialog, setShowLiveDataDialog] = useState(false);
  const [isFetchingLiveData, setIsFetchingLiveData] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    aircraftCount?: number;
  } | null>(null);
  
  const { toast } = useToast();
  
  // Function to fetch live flight data from FlightAware
  const fetchLiveFlightData = async () => {
    setIsFetchingLiveData(true);
    setSyncResult(null);
    
    try {
      const response = await axios.post('/api/adsb/sync');
      setSyncResult(response.data);
      
      toast({
        title: "Live data loaded",
        description: `Successfully loaded ${response.data.aircraftCount} aircraft from FlightAware.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error fetching live flight data:', error);
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch live flight data'
      });
      
      // Show different message based on whether the API returned sample data
      if (error.response?.data?.usingSampleData) {
        toast({
          title: "Using sample data",
          description: "Live flight data unavailable. Displaying sample aircraft instead.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error loading data",
          description: "Could not fetch flight data. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsFetchingLiveData(false);
    }
  };
  
  // Determine overall system status
  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-success';
      case 'degraded':
        return 'bg-warning';
      case 'offline':
        return 'bg-danger';
      default:
        return 'bg-muted';
    }
  };

  const getSystemStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'System Performance Degraded';
      case 'offline':
        return 'System Offline';
      default:
        return 'Status Unknown';
    }
  };

  return (
    <>
      <header className="bg-muted/30 py-2 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              <path d="M14.05 2a9 9 0 0 1 8 7.94"></path>
              <path d="M14.05 6A5 5 0 0 1 18 10"></path>
            </svg>
            <span className="text-xl font-semibold">{title}</span>
          </div>
          <div className="ml-6 flex space-x-2">
            <button 
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-md bg-secondary hover:bg-accent/50 text-sm font-medium transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Map Settings
            </button>
            <button 
              onClick={onOpenFilters}
              className="px-3 py-1.5 rounded-md bg-secondary hover:bg-accent/50 text-sm font-medium transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filters
            </button>
            <button 
              onClick={() => setShowLiveDataDialog(true)}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Live Data
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="system-status">
            <span className="flex items-center">
              {systemStatus === 'operational' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : systemStatus === 'degraded' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {getSystemStatusText(systemStatus)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm">Controller: {currentUser.displayName}</span>
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {currentUser.initials}
            </div>
          </div>
        </div>
      </header>

      {/* Live Data Dialog */}
      <Dialog open={showLiveDataDialog} onOpenChange={setShowLiveDataDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fetch Live Flight Data</DialogTitle>
            <DialogDescription>
              Retrieve real-time aircraft data from FlightAware. This will replace the current aircraft in the system with live data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${
                  dataSources.find(ds => ds.name === 'FlightAware ADS-B')?.status === 'online' 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
                }`}></div>
                <span>FlightAware ADS-B Data Source</span>
              </div>
              
              {syncResult && (
                <div className={`p-3 rounded-md ${syncResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                  <p className="text-sm">{syncResult.message}</p>
                  {syncResult.success && syncResult.aircraftCount && (
                    <p className="text-sm mt-1">Loaded {syncResult.aircraftCount} aircraft</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowLiveDataDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={fetchLiveFlightData}
              disabled={isFetchingLiveData}
            >
              {isFetchingLiveData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Live Data'  
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;