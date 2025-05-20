// Hook for managing aircraft data

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aircraft, AircraftFilters } from "../types/aircraft";
import { fetchAircraft, generateSampleAircraft } from "../lib/dataIntegration";
import wsClient from "../lib/webSocket";

export function useAircraftData() {
  const queryClient = useQueryClient();
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
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
  
  // Generate sample aircraft
  const generateSampleData = useCallback(async () => {
    try {
      await generateSampleAircraft(10);
      refetch();
    } catch (error) {
      console.error("Error generating sample data:", error);
    }
  }, [refetch]);
  
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
    generateSampleData,
    refetch
  };
}
