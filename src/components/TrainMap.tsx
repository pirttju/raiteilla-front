'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const isDarkRef = useRef(false);
  
  const [lastFetchTime, setLastFetchTime] = useState<string>('-');

  // Theme Detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (event: MediaQueryListEvent | MediaQueryList) => {
      const dark = event.matches;
      setIsDark(dark);
      isDarkRef.current = dark;
    };

    updateTheme(mediaQuery);

    const handler = (e: MediaQueryListEvent) => updateTheme(e);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Map Initialization
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkRef.current = initialDarkMode; // Sync ref before map creation

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: initialDarkMode 
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

    map.current.on('click', 'vehicles-circle', (e) => {
      if (!e.features || !e.features[0]) return;
      
      const props = e.features[0].properties as VehicleProperties;
      const coordinates = (e.features[0].geometry as any).coordinates.slice();
      const lastUpdatedDate = new Date(props.ts * 1000);
      const lastUpdatedStr = lastUpdatedDate.toLocaleTimeString();

      const isDarkMode = isDarkRef.current;
      
      const popupContent = `
        <div class="p-1 font-sans text-sm min-w-[150px] ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}">
          <div class="flex items-center justify-between mb-2">
            <strong class="text-base">${props.ro}</strong>
          </div>
          <div class="space-y-1 mb-2">
              <div>Speed: ${props.sp ?? 0} km/h</div>
              <div>Bearing: ${props.be ?? 0}°</div>
          </div>
          <div class="pt-2 border-t ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'} text-xs">
              <strong>Last updated:</strong> ${lastUpdatedStr}
          </div>
        </div>
      `;

      new maplibregl.Popup({
        className: isDarkMode ? 'dark-mode-popup' : '',
        closeButton: true,
        maxWidth: '300px'
      })
        .setLngLat(coordinates)
        .setHTML(popupContent)
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

  // 3. Handle Theme Changes dynamically
  useEffect(() => {
    if (!map.current) return;
    
    const targetStyle = isDark 
        ? 'https://sv1.raiteilla.fi/maps/osm-night/style.json' 
        : 'https://sv1.raiteilla.fi/maps/osm-light/style.json';
    
    const onStyleData = () => {
      if (map.current?.isStyleLoaded()) {
         initializeLayers();
         fetchVehicles();
         map.current.off('styledata', onStyleData); 
      }
    };

    map.current.on('styledata', onStyleData);
    map.current.setStyle(targetStyle);

  }, [isDark]);

  const initializeLayers = () => {
    if (!map.current) return;
    const isDarkMode = isDarkRef.current;

    if (!map.current.getSource('vehicles')) {
      map.current.addSource('vehicles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    if (map.current.getLayer('vehicles-circle')) map.current.removeLayer('vehicles-circle');
    map.current.addLayer({
      id: 'vehicles-circle',
      type: 'circle',
      source: 'vehicles',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ef4444', 
        'circle-stroke-width': 2,
        'circle-stroke-color': isDarkMode ? '#1f2937' : '#ffffff' 
      }
    });

    if (map.current.getLayer('vehicles-label')) map.current.removeLayer('vehicles-label');
    map.current.addLayer({
      id: 'vehicles-label',
      type: 'symbol',
      source: 'vehicles',
      layout: {
        'text-field': ['get', 'ro'],
        'text-font': ['Noto Sans Bold'],
        'text-size': 12,
        'text-offset': [0, 0.75],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': isDarkMode ? '#e5e7eb' : '#000000',
        'text-halo-color': isDarkMode ? '#000000' : '#ffffff',
        'text-halo-width': 1
      }
    });
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
    <>
      <style jsx global>{`
        .dark-mode-popup .maplibregl-popup-content {
          background-color: #1f2937;
          border: 1px solid #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .dark-mode-popup .maplibregl-popup-close-button {
          color: #9ca3af;
        }
        .dark-mode-popup .maplibregl-popup-close-button:hover {
          background-color: #374151;
        }
        .dark-mode-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: #1f2937;
        }
        .dark-mode-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: #1f2937;
        }
        .dark-mode-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: #1f2937;
        }
        .dark-mode-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: #1f2937;
        }
      `}</style>

      <div 
        ref={mapContainer} 
        className="w-full shadow-xl relative block bg-gray-100 dark:bg-gray-900"
        style={{ height: 'calc(100vh - 64px)', width: '100%' }}
      >
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded shadow-lg z-10 text-sm opacity-90 border dark:border-gray-700 pointer-events-none backdrop-blur-sm">
          <h3 className="font-bold mb-1 text-gray-900 dark:text-gray-100">Live Map</h3>
          <div className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-200">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white dark:border-gray-800"></div>
            <span>Train</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Map data fetched: {lastFetchTime}
          </p>
        </div>
      </div>
    </>
  );
}