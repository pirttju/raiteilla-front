'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

// Define the shape of the Vehicle feature properties
interface VehicleProperties {
  ts: number;
  ro: string;
  ve: string;
  sp: number | null;
  be: number | null;
  lat: number;
  lon: number;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('-');

  // Theme Detection
  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains('dark');
    setIsDark(checkDark());
    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Map Initialization
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: isDark 
        ? 'https://sv1.raiteilla.fi/maps/osm-night/style.json' 
        : 'https://sv1.raiteilla.fi/maps/osm-light/style.json',
      center: [25, 62],
      zoom: 6,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      map.current?.resize(); 
      initializeLayers();
      fetchVehicles();
      intervalRef.current = setInterval(fetchVehicles, 5000);
    });

    map.current.on('moveend', fetchVehicles);

    // Click Handler
    map.current.on('click', 'vehicles-circle', (e) => {
      if (!e.features || !e.features[0]) return;
      
      const props = e.features[0].properties as VehicleProperties;
      const coordinates = (e.features[0].geometry as any).coordinates.slice();
      const lastUpdatedDate = new Date(props.ts * 1000);
      const lastUpdatedStr = lastUpdatedDate.toLocaleTimeString();

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2 text-gray-900 font-sans text-sm min-w-[150px]">
            <strong class="text-base block mb-1">Train ${props.ro}</strong>
            <div class="space-y-1">
                <div>Speed: ${props.sp ?? 0} km/h</div>
                <div>Bearing: ${props.be ?? 0}°</div>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                <strong>Last updated:</strong> ${lastUpdatedStr}
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    map.current.on('mouseenter', 'vehicles-circle', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'vehicles-circle', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); 

  // Handle Theme Changes
  useEffect(() => {
    if (!map.current) return;
    const style = isDark 
        ? 'https://sv1.raiteilla.fi/maps/osm-night/style.json' 
        : 'https://sv1.raiteilla.fi/maps/osm-light/style.json';
    
    const reAddLayers = () => {
      initializeLayers();
      fetchVehicles(); 
    };

    map.current.once('styledata', reAddLayers);
    map.current.setStyle(style);

    return () => {
      map.current?.off('styledata', reAddLayers);
    };
  }, [isDark]);

  const initializeLayers = () => {
    if (!map.current) return;

    if (!map.current.getSource('vehicles')) {
      map.current.addSource('vehicles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'vehicles-circle',
        type: 'circle',
        source: 'vehicles',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ef4444', 
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current.addLayer({
        id: 'vehicles-label',
        type: 'symbol',
        source: 'vehicles',
        layout: {
          'text-field': ['get', 'ro'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 0.5], 
          'text-anchor': 'top'
        },
        paint: {
          'text-color': isDark ? '#ffffff' : '#000000',
          'text-halo-color': isDark ? '#000000' : '#ffffff',
          'text-halo-width': 1
        }
      });
    }
  };

  const fetchVehicles = async () => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    try {
      const res = await fetch(`https://beta.raiteilla.fi/api/vehicles?routeType=2&bbox=${bbox}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      
      const source = map.current.getSource('vehicles') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(data);
        setLastFetchTime(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  return (
    <div 
      ref={mapContainer} 
      className="w-full shadow-xl border dark:border-gray-700 relative block"
      // Height calculation: 100vh (Viewport) - ~70px (Header) - ~40px (Main Layout Padding) = ~110px
      style={{ height: 'calc(100vh - 65px)', width: '100%' }}
    >
      {/* Legend / Info Box */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow-lg z-10 text-sm opacity-90 border dark:border-gray-700 pointer-events-none">
        <h3 className="font-bold mb-1 text-gray-900 dark:text-gray-100">Live Map</h3>
        <div className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-200">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
          <span>Train</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Map data fetched: {lastFetchTime}
        </p>
      </div>
    </div>
  );
}