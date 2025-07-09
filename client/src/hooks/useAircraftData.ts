// Hook for managing aircraft data

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aircraft, AircraftFilters } from "../types/aircraft";
import { fetchAircraft, generateSampleAircraft } from "../lib/dataIntegration";
import wsClient from "../lib/webSocket";
import qs from "qs";

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

  // Fetch aircraft with filters from backend
  const { data: aircraft = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/aircraft", filters],
    queryFn: async () => {
      const query = qs.stringify({
        verificationStatus: filters.verificationStatus,
        needsAssistance: filters.needsAssistance,
        searchTerm: filters.searchTerm,
        type: filters.type
      }, { skipNulls: true }); // removed skipEmptyString, not supported by qs
      const res = await fetch(`/api/aircraft?${query}`);
      if (!res.ok) throw new Error("Failed to fetch aircraft");
      return res.json();
    },
    refetchInterval: 10000,
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
    filteredAircraft: aircraft, // for compatibility, but now backend-filtered
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
