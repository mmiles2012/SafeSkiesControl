import { useState, useEffect } from 'react';
import { NOTAM } from '@/types/aircraft';
import { useQuery } from '@tanstack/react-query';

// Hook to manage NOTAMs data
export function useNOTAMs() {
  // Sample data for demonstration - in a real app, this would come from an API
  const sampleNOTAMs: NOTAM[] = [
    {
      id: 1,
      title: 'Runway 27L Closure at KMCI',
      message: 'Runway 27L at Kansas City International Airport is closed for maintenance. Expected reopening on May 25, 2025.',
      location: 'ZKC',
      type: 'airport',
      startDate: new Date('2025-05-18T00:00:00'),
      endDate: new Date('2025-05-25T23:59:59'),
      isActive: true,
      severity: 'medium',
      coordinates: {
        latitude: 39.2976,
        longitude: -94.7139
      }
    },
    {
      id: 2,
      title: 'Temporary Flight Restriction',
      message: 'Temporary flight restriction in effect due to presidential movement. All aircraft must maintain 30nm distance from designated area.',
      location: 'ZKC',
      type: 'airspace',
      startDate: new Date('2025-05-20T08:00:00'),
      endDate: new Date('2025-05-20T16:00:00'),
      isActive: true,
      severity: 'high',
      affectedAltitude: {
        min: 0,
        max: 12000
      },
      coordinates: {
        latitude: 39.0997,
        longitude: -94.5786,
        radius: 30
      }
    },
    {
      id: 3,
      title: 'ARTCC Radar System Maintenance',
      message: 'ZKC ARTCC radar systems undergoing maintenance. Expect reduced radar coverage in northwestern sectors.',
      location: 'ZKC',
      type: 'navigation',
      startDate: new Date('2025-05-21T01:00:00'),
      endDate: new Date('2025-05-21T05:00:00'),
      isActive: true,
      severity: 'medium'
    },
    {
      id: 4,
      title: 'Navigation Aid Outage',
      message: 'VOR at KDEN is out of service until further notice. Pilots should use alternative navigation methods.',
      location: 'ZDV',
      type: 'navigation',
      startDate: new Date('2025-05-15T00:00:00'),
      isActive: true,
      severity: 'medium',
      coordinates: {
        latitude: 39.8617,
        longitude: -104.6732
      }
    },
    {
      id: 5,
      title: 'GPS Signal Interference',
      message: 'Military exercises may cause GPS signal degradation across multiple ARTCCs. Pilots should be prepared to use alternative navigation.',
      location: 'ALL',
      type: 'navigation',
      startDate: new Date('2025-05-22T10:00:00'),
      endDate: new Date('2025-05-23T18:00:00'),
      isActive: true,
      severity: 'high'
    }
  ];

  // State for filtered NOTAMs
  const [filteredNOTAMs, setFilteredNOTAMs] = useState<NOTAM[]>(sampleNOTAMs);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, this would be a query to fetch NOTAMs from your backend
  // const { data: notams = [], isLoading } = useQuery<NOTAM[]>({
  //   queryKey: ['/api/notams'],
  //   refetchInterval: 60000, // Refresh every minute
  // });

  // Function to filter NOTAMs by ARTCC
  const filterByARTCC = (artccId: string) => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const filtered = sampleNOTAMs.filter(
        notam => notam.isActive && (notam.location === artccId || notam.location === 'ALL')
      );
      setFilteredNOTAMs(filtered);
      setIsLoading(false);
    }, 300);
  };

  // Function to get NOTAM by ID
  const getNOTAMById = (id: number): NOTAM | undefined => {
    return sampleNOTAMs.find(notam => notam.id === id);
  };

  return {
    notams: filteredNOTAMs,
    isLoading,
    filterByARTCC,
    getNOTAMById
  };
}