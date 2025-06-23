
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import AircraftList from '@/components/AircraftList';
import MapView from '@/components/MapView';
import { useToast } from '@/hooks/use-toast';
import AircraftDetailModal from '@/components/AircraftDetailModal';
import { useAircraftData } from '@/hooks/useAircraftData';
import { useNotifications } from '@/hooks/useNotifications';
import { useNOTAMs } from '@/hooks/useNOTAMs';
import { useQuery } from '@tanstack/react-query';
import { Aircraft, DataSource } from '@/types/aircraft';
import FilterDialog from '@/components/FilterDialog';
import MapSettings from '@/components/MapSettings';
import { useParams, useLocation } from 'wouter';
import TabbedNotificationPanel from '@/components/TabbedNotificationPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const Dashboard = () => {
  const [showAircraftDetail, setShowAircraftDetail] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedARTCC, setSelectedARTCC] = useState("ZKC");
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const mapRef = useRef<any>(null);
  
  // Get aircraft data
  const {
    aircraft,
    filteredAircraft,
    isLoading: aircraftLoading,
    selectedAircraft,
    selectAircraft,
    filters,
    updateFilters,
    dataMode,
    toggleDataMode,
    generateARTCCSampleData
  } = useAircraftData();
  
  // Get notifications
  const {
    filteredNotifications,
    isLoading: notificationsLoading,
    resolveNotification
  } = useNotifications();
  
  // Get NOTAMs data
  const {
    notams,
    isLoading: notamsLoading,
    filterByARTCC
  } = useNOTAMs();
  
  // Get data sources status
  const { data: dataSources = [] } = useQuery<DataSource[]>({
    queryKey: ['/api/data-sources'],
    refetchInterval: 30000,
  });
  
  // Determine system status based on data sources
  const getSystemStatus = (): 'operational' | 'degraded' | 'offline' => {
    if (dataSources.length === 0) return 'offline';
    
    const onlineSources = dataSources.filter(src => src.status === 'online').length;
    
    if (onlineSources === dataSources.length) return 'operational';
    if (onlineSources > 0) return 'degraded';
    return 'offline';
  };

  // Handle panel resize - trigger map resize
  const handlePanelResize = () => {
    // Small delay to ensure the panel resize animation completes
    setTimeout(() => {
      if (mapRef.current?.getMap) {
        mapRef.current.getMap().resize();
      }
    }, 100);
  };

  // Handle aircraft selection
  const handleSelectAircraft = (aircraft: Aircraft) => {
    selectAircraft(aircraft);
    setShowAircraftDetail(true);
    navigate(`/aircraft/${aircraft.id}`);
  };
  
  // Handle ARTCC selection
  const handleARTCCChange = async (artccId: string) => {
    setSelectedARTCC(artccId);
    filterByARTCC(artccId);
    
    // When ARTCC changes, update the sample data for that region if in sample mode
    if (dataMode === 'sample') {
      try {
        await generateARTCCSampleData(artccId);
      } catch (error) {
        console.error('Error generating sample data for new ARTCC:', error);
      }
    }
    
    toast({
      title: `Switched to ${artccId} airspace`,
      duration: 2000
    });
  };
  
  // Handle data mode toggle (sample/live)
  const handleDataModeToggle = async (newMode: 'sample' | 'live') => {
    try {
      const success = await toggleDataMode(newMode, selectedARTCC);
      
      if (success) {
        toast({
          title: `Switched to ${newMode} data mode`,
          description: newMode === 'sample' ? 'Using generated aircraft data' : 'Using live FlightAware data',
          duration: 3000
        });
        return true;
      } else {
        throw new Error('Data mode toggle failed');
      }
    } catch (error) {
      toast({
        title: `Failed to switch to ${newMode} data`,
        description: 'An error occurred while changing data sources',
        variant: 'destructive',
        duration: 5000
      });
      return false;
    }
  };
  
  // Handle aircraft detail modal close
  const handleCloseAircraftDetail = () => {
    setShowAircraftDetail(false);
    navigate('/'); // Return to main dashboard
    
    // Force removal of all popups when the detail modal is closed
    // This prevents any lingering popups from appearing afterward
    setTimeout(() => {
      document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());
    }, 50);
  };

  // Check for aircraft ID in URL and select that aircraft
  useEffect(() => {
    if (params && params.id && Array.isArray(aircraft) && aircraft.length > 0) {
      const aircraftId = parseInt(params.id);
      const selectedAc = aircraft.find((a: Aircraft) => a.id === aircraftId);
      if (selectedAc) {
        selectAircraft(selectedAc);
        setShowAircraftDetail(true);
      }
    }
  }, [params, aircraft, selectAircraft]);

  // Generate ARTCC-specific sample data on first load
  useEffect(() => {
    const createSampleData = async () => {
      try {
        console.log(`Generating sample aircraft data for ${selectedARTCC}`);
        await generateARTCCSampleData(selectedARTCC);
        console.log("Sample data generated");
      } catch (error) {
        console.error("Error generating sample data:", error);
      }
    };
    
    if (!aircraftLoading && Array.isArray(aircraft) && aircraft.length === 0) {
      createSampleData();
    }
  }, [aircraftLoading, aircraft, generateARTCCSampleData, selectedARTCC]);

  useEffect(() => {
    // Load ARTCC-specific sample data when the component mounts
    const loadInitialData = async () => {
      if (dataMode === 'sample') {
        try {
          await generateARTCCSampleData(selectedARTCC);
        } catch (error) {
          console.error('Error loading initial sample data:', error);
        }
      }
    };
    
    loadInitialData();
  }, [selectedARTCC, dataMode, generateARTCCSampleData]);
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        title="NextGen ATC System"
        currentUser={{ displayName: "John Smith", initials: "JS" }}
        systemStatus={getSystemStatus()}
        dataSources={dataSources}
        onOpenSettings={() => setShowMapSettings(true)}
        onOpenFilters={() => setShowFilters(true)}
        dataMode={dataMode}
        onToggleDataMode={handleDataModeToggle}
      />
      
      <main className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full" onLayout={handlePanelResize}>
          {/* Left panel - Aircraft list */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full flex flex-col border-r border-border bg-card">
              <AircraftList 
                aircraft={Array.isArray(filteredAircraft) ? filteredAircraft : []}
                isLoading={aircraftLoading}
                selectedAircraftId={selectedAircraft?.id}
                onSelectAircraft={handleSelectAircraft}
                filters={filters || { showFilters: false, searchTerm: '', verificationStatus: 'all', needsAssistance: false }}
                onUpdateFilters={updateFilters}
              />
            </div>
          </ResizablePanel>
          
          {/* Resize handle for left panel */}
          <ResizableHandle className="resize-handle" />
          
          {/* Center panel - Map view */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full map-container">
              <MapView 
                ref={mapRef}
                aircraft={Array.isArray(aircraft) ? aircraft : []}
                selectedAircraft={selectedAircraft}
                onSelectAircraft={handleSelectAircraft}
                dataSources={dataSources}
                onARTCCChange={handleARTCCChange}
              />
            </div>
          </ResizablePanel>
          
          {/* Resize handle for right panel */}
          <ResizableHandle className="resize-handle" />
          
          {/* Right panel - Notifications */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full flex flex-col border-l border-border bg-card">
              <TabbedNotificationPanel
                notifications={filteredNotifications}
                notams={notams}
                isLoadingNotifications={notificationsLoading}
                isLoadingNOTAMs={notamsLoading}
                onResolveNotification={resolveNotification}
                onSelectAircraftFromNotification={(aircraftId) => {
                  const aircraft = Array.isArray(filteredAircraft) 
                    ? filteredAircraft.find((a: { id: number }) => a.id === aircraftId)
                    : null;
                  if (aircraft) {
                    handleSelectAircraft(aircraft);
                  }
                }}
                dataSources={dataSources}
                selectedARTCC={selectedARTCC}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
      
      {showAircraftDetail && selectedAircraft && (
        <AircraftDetailModal
          aircraft={selectedAircraft}
          isOpen={showAircraftDetail}
          onClose={handleCloseAircraftDetail}
          dataSources={dataSources}
          onHandoff={() => {
            // In a real app, this would call a handoff API
            // For now we just close the modal
            handleCloseAircraftDetail();
          }}
        />
      )}
      
      {showMapSettings && (
        <MapSettings
          isOpen={showMapSettings}
          onClose={() => setShowMapSettings(false)}
        />
      )}
      
      {showFilters && (
        <FilterDialog
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          currentFilters={filters}
          onUpdateFilters={updateFilters}
        />
      )}
    </div>
  );
};

export default Dashboard;
