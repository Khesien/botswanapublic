import React, { createContext, useContext, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../lib/supabase';
import type { Bus } from '../types';

interface MapContextType {
  map: mapboxgl.Map | null;
  initializeMap: (container: HTMLElement) => void;
  trackBus: (busId: string) => void;
  stopTracking: () => void;
  currentBus: Bus | null;
  isTracking: boolean;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [currentBus, setCurrentBus] = useState<Bus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  const initializeMap = (container: HTMLElement) => {
    mapboxgl.accessToken = 'your_mapbox_token';

    const newMap = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [25.9231, -24.6282], // Botswana center
      zoom: 6
    });

    newMap.addControl(new mapboxgl.NavigationControl());
    newMap.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }));

    setMap(newMap);
  };

  const trackBus = async (busId: string) => {
    if (!map) return;

    try {
      const { data: bus, error } = await supabase
        .from('buses')
        .select('*')
        .eq('id', busId)
        .single();

      if (error) throw error;

      setCurrentBus(bus);
      setIsTracking(true);

      if (bus.current_location) {
        if (!marker) {
          const newMarker = new mapboxgl.Marker()
            .setLngLat([bus.current_location.lng, bus.current_location.lat])
            .addTo(map);
          setMarker(newMarker);
        } else {
          marker.setLngLat([bus.current_location.lng, bus.current_location.lat]);
        }

        map.flyTo({
          center: [bus.current_location.lng, bus.current_location.lat],
          zoom: 15
        });
      }

      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`bus-${busId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'buses',
          filter: `id=eq.${busId}`
        }, payload => {
          const updatedBus = payload.new as Bus;
          setCurrentBus(updatedBus);

          if (updatedBus.current_location && marker) {
            marker.setLngLat([
              updatedBus.current_location.lng,
              updatedBus.current_location.lat
            ]);

            map.panTo([
              updatedBus.current_location.lng,
              updatedBus.current_location.lat
            ]);
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error tracking bus:', error);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setCurrentBus(null);
    if (marker) {
      marker.remove();
      setMarker(null);
    }
  };

  useEffect(() => {
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  const value = {
    map,
    initializeMap,
    trackBus,
    stopTracking,
    currentBus,
    isTracking
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}