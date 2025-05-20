import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AircraftList from '@/components/AircraftList';
import MapView from '@/components/MapView';
import NotificationPanel from '@/components/NotificationPanel';
import AircraftDetailModal from '@/components/AircraftDetailModal';
import { useAircraftData } from '@/hooks/useAircraftData';
import { useNotifications } from '@/hooks/useNotifications';
import { useQuery } from '@tanstack/react-query';
import { Aircraft, DataSource } from '@/types/aircraft';
import FilterDialog from '@/components/FilterDialog';
import MapSettings from '@/components/MapSettings';

const Dashboard = () => {
  const [showAircraftDetail, setShowAircraftDetail] = useState(false);
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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
  };
  
  // Handle aircraft detail modal close
  const handleCloseAircraftDetail = () => {
    setShowAircraftDetail(false);
  };

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
    <div className="flex flex-col h-screen bg-background text-text-primary">
      <Header 
        title="NextGen ATC System"
        currentUser={{ displayName: "John Smith", initials: "JS" }}
        systemStatus={getSystemStatus()}
        dataSources={dataSources}
        onOpenSettings={() => setShowMapSettings(true)}
        onOpenFilters={() => setShowFilters(true)}
      />
      
      <main className="flex flex-1 overflow-hidden">
        <AircraftList 
          aircraft={filteredAircraft}
          isLoading={aircraftLoading}
          selectedAircraftId={selectedAircraft?.id}
          onSelectAircraft={handleSelectAircraft}
          filters={filters}
          onUpdateFilters={updateFilters}
        />
        
        <MapView 
          aircraft={aircraft}
          selectedAircraft={selectedAircraft}
          onSelectAircraft={handleSelectAircraft}
          dataSources={dataSources}
        />
        
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
