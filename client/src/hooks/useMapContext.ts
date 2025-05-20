import { createContext, useContext } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map) => void;
}

export const MapContext = createContext<MapContextType>({
  map: null,
  setMap: () => {},
});

export const useMapContext = () => useContext(MapContext);