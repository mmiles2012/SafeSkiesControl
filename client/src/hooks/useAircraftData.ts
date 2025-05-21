// Hook for managing aircraft data

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aircraft, AircraftFilters } from "../types/aircraft";
import { fetchAircraft, generateSampleAircraft } from "../lib/dataIntegration";
import wsClient from "../lib/webSocket";

export function useAircraftData() {
  const queryClient = useQueryClient();
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [dataMode, setDataMode] = useState<'sample' | 'live'>('sample');
  const [filters, setFilters] = useState<AircraftFilters>({
    verificationStatus: "all",
    needsAssistance: undefined,
    searchTerm: "",
    type: undefined
  });
  
  // Fetch all aircraft
  const { data: aircraft = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/aircraft"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Initialize WebSocket connection
  useEffect(() => {
    wsClient.connect();
    
    // Subscribe to aircraft updates
    const unsubscribeUpdates = wsClient.onAircraftUpdates((updatedAircraft) => {
      queryClient.setQueryData(["/api/aircraft"], updatedAircraft);
    });
    
    // Subscribe to single aircraft updates
    const unsubscribeSingle = wsClient.onSingleAircraftUpdate((updatedAircraft) => {
      queryClient.setQueryData(["/api/aircraft"], (oldData: Aircraft[] = []) => {
        const newData = [...oldData];
        const index = newData.findIndex(a => a.id === updatedAircraft.id);
        
        if (index >= 0) {
          newData[index] = updatedAircraft;
        } else {
          newData.push(updatedAircraft);
        }
        
        return newData;
      });
      
      // Update selected aircraft if it's the one that was updated
      if (selectedAircraft && selectedAircraft.id === updatedAircraft.id) {
        setSelectedAircraft(updatedAircraft);
      }
    });
    
    return () => {
      unsubscribeUpdates();
      unsubscribeSingle();
    };
  }, [queryClient, selectedAircraft]);
  
  // Generate sample aircraft for specific ARTCC regions
  const generateARTCCSampleData = useCallback(async (artccId: string) => {
    try {
      const response = await fetch('/api/sample-data/artcc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artccIds: [artccId] })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate ARTCC sample data');
      }
      
      await refetch();
      setDataMode('sample');
      return await response.json();
    } catch (error) {
      console.error("Error generating ARTCC sample data:", error);
      throw error;
    }
  }, [refetch]);
  
  // Fetch live data from FlightAware
  const fetchLiveData = useCallback(async () => {
    try {
      const response = await fetch('/api/adsb/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch live flight data');
      }
      
      await refetch();
      setDataMode('live');
      return await response.json();
    } catch (error) {
      console.error("Error fetching live data:", error);
      throw error;
    }
  }, [refetch]);
  
  // Toggle between sample and live data
  const toggleDataMode = useCallback(async (newMode: 'sample' | 'live', artccId: string) => {
    try {
      if (newMode === 'sample') {
        await generateARTCCSampleData(artccId);
      } else {
        await fetchLiveData();
      }
      return true;
    } catch (error) {
      console.error(`Error toggling to ${newMode} data:`, error);
      return false;
    }
  }, [generateARTCCSampleData, fetchLiveData]);
  
  // Apply filters to aircraft data
  const filteredAircraft = useCallback(() => {
    if (!aircraft) return [];
    
    return aircraft.filter(ac => {
      // Verification status filter
      if (filters.verificationStatus && filters.verificationStatus !== "all") {
        if (ac.verificationStatus !== filters.verificationStatus) {
          return false;
        }
      }
      
      // Needs assistance filter
      if (filters.needsAssistance !== undefined) {
        if (ac.needsAssistance !== filters.needsAssistance) {
          return false;
        }
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const callsignMatch = ac.callsign.toLowerCase().includes(searchLower);
        const typeMatch = ac.aircraftType.toLowerCase().includes(searchLower);
        const originMatch = ac.origin?.toLowerCase().includes(searchLower) || false;
        const destMatch = ac.destination?.toLowerCase().includes(searchLower) || false;
        
        if (!(callsignMatch || typeMatch || originMatch || destMatch)) {
          return false;
        }
      }
      
      // Aircraft type filter
      if (filters.type) {
        if (ac.aircraftType !== filters.type) {
          return false;
        }
      }
      
      return true;
    });
  }, [aircraft, filters]);
  
  // Select an aircraft
  const selectAircraft = useCallback((aircraft: Aircraft | null) => {
    setSelectedAircraft(aircraft);
  }, []);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AircraftFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  return {
    aircraft,
    filteredAircraft: filteredAircraft(),
    isLoading,
    error,
    selectedAircraft,
    selectAircraft,
    filters,
    updateFilters,
    dataMode,
    toggleDataMode,
    generateARTCCSampleData,
    fetchLiveData,
    refetch
  };
}
