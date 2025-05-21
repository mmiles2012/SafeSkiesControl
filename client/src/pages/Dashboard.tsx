import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AircraftList from '@/components/AircraftList';
import MapView from '@/components/MapView';
import NotificationPanel from '@/components/NotificationPanel';
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
import NOTAMPanel from '@/components/NOTAMPanel';

const Dashboard = () => {
  const [showAircraftDetail, setShowAircraftDetail] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [rightPanelMinimized, setRightPanelMinimized] = useState(false);
  const [selectedARTCC, setSelectedARTCC] = useState("ZKC");
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  
  // Get aircraft data
  const {
    aircraft,
    filteredAircraft,
    isLoading: aircraftLoading,
    selectedAircraft,
    selectAircraft,
    filters,
    updateFilters,
    generateSampleData
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

  // Handle aircraft selection
  const handleSelectAircraft = (aircraft: Aircraft) => {
    selectAircraft(aircraft);
    setShowAircraftDetail(true);
    navigate(`/aircraft/${aircraft.id}`);
  };
  
  // Handle ARTCC selection
  const handleARTCCChange = (artccId: string) => {
    setSelectedARTCC(artccId);
    filterByARTCC(artccId);
    toast({
      title: `Switched to ${artccId} airspace`,
      duration: 2000
    });
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
    if (params && params.id && aircraft.length > 0) {
      const aircraftId = parseInt(params.id);
      const selectedAc = aircraft.find(a => a.id === aircraftId);
      if (selectedAc) {
        selectAircraft(selectedAc);
        setShowAircraftDetail(true);
      }
    }
  }, [params, aircraft, selectAircraft]);

  // Generate sample data on first load
  useEffect(() => {
    const createSampleData = async () => {
      try {
        console.log("Generating sample aircraft data");
        await generateSampleData();
        console.log("Sample data generated");
      } catch (error) {
        console.error("Error generating sample data:", error);
      }
    };
    
    if (!aircraftLoading && aircraft.length === 0) {
      createSampleData();
    }
  }, [aircraftLoading, aircraft.length, generateSampleData]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        title="NextGen ATC System"
        currentUser={{ displayName: "John Smith", initials: "JS" }}
        systemStatus={getSystemStatus()}
        dataSources={dataSources}
        onOpenSettings={() => setShowMapSettings(true)}
        onOpenFilters={() => setShowFilters(true)}
      />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel - Aircraft list with minimize */}
        <div className={`w-80 flex-shrink-0 border-r border-border flex-col-fixed overflow-container bg-card transition-all duration-300 ${
          leftPanelMinimized ? '-ml-80' : ''
        }`}>
          <div className="relative">
            <button 
              className="absolute -right-10 top-2 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-r shadow-md flex items-center justify-center"
              onClick={() => {
                setLeftPanelMinimized(!leftPanelMinimized);
                toast({
                  title: leftPanelMinimized ? "Aircraft panel expanded" : "Aircraft panel minimized",
                  duration: 2000,
                });
              }}
            >
              {leftPanelMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>
            <AircraftList 
              aircraft={filteredAircraft}
              isLoading={aircraftLoading}
              selectedAircraftId={selectedAircraft?.id}
              onSelectAircraft={handleSelectAircraft}
              filters={filters}
              onUpdateFilters={updateFilters}
            />
          </div>
        </div>
        
        {/* Center panel - Map view with flexible width */}
        <div className="flex-1 flex-col-fixed overflow-container relative">
          <MapView 
            aircraft={aircraft}
            selectedAircraft={selectedAircraft}
            onSelectAircraft={handleSelectAircraft}
            dataSources={dataSources}
            onARTCCChange={handleARTCCChange}
          />
        </div>
        
        {/* Right panel - Notifications with minimize */}
        <div className={`w-80 flex-shrink-0 border-l border-border flex-col-fixed overflow-container bg-card transition-all duration-300 ${
          rightPanelMinimized ? 'mr-80' : ''
        }`}>
          <div className="relative">
            <button 
              className="absolute -left-10 top-2 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-l shadow-md flex items-center justify-center"
              onClick={() => {
                setRightPanelMinimized(!rightPanelMinimized);
                toast({
                  title: rightPanelMinimized ? "Notifications panel expanded" : "Notifications panel minimized",
                  duration: 2000,
                });
              }}
            >
              {rightPanelMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
            <div className="space-y-4 p-2">
              <NotificationPanel 
                notifications={filteredNotifications}
                isLoading={notificationsLoading}
                onResolveNotification={resolveNotification}
                onSelectAircraftFromNotification={(aircraftId) => {
                  const aircraft = filteredAircraft.find(a => a.id === aircraftId);
                  if (aircraft) {
                    handleSelectAircraft(aircraft);
                  }
                }}
                dataSources={dataSources}
              />
              
              {/* NOTAM panel */}
              <NOTAMPanel 
                notams={notams}
                isLoading={notamsLoading}
                selectedARTCC={selectedARTCC}
              />
            </div>
          </div>
        </div>
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
