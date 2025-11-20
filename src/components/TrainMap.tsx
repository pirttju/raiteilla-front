'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 

export default function TrainMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://demotiles.maplibre.org/style.json', // Use a valid style URL
      center: [25.7, 61.5], // Central Finland
      zoom: 6
    });

    map.current.on('load', () => {
        const fetchTrains = async () => {
            // Hardcoded BBOX for Finland area roughly
            const url = "https://beta.raiteilla.fi/api/vehicles?routeType=2&bbox=19,59,32,70";
            try {
                const res = await fetch(url);
                const data = await res.json();
                
                if(map.current?.getSource('trains')) {
                    (map.current.getSource('trains') as maplibregl.GeoJSONSource).setData(data);
                } else {
                    map.current?.addSource('trains', {
                        type: 'geojson',
                        data: data
                    });
                    map.current?.addLayer({
                        id: 'trains-layer',
                        type: 'circle',
                        source: 'trains',
                        paint: {
                            'circle-radius': 6,
                            'circle-color': '#ff0000',
                            'circle-stroke-width': 1,
                            'circle-stroke-color': '#fff'
                        }
                    });
                    
                    // Add popups
                    map.current?.on('click', 'trains-layer', (e) => {
                        if(!e.features || !e.features[0]) return;
                        const props = e.features[0].properties;
                        const coords = (e.features[0].geometry as any).coordinates.slice();
                        
                        new maplibregl.Popup()
                            .setLngLat(coords)
                            .setHTML(`<strong>${props?.ro}</strong><br>Speed: ${props?.sp} km/h`)
                            .addTo(map.current!);
                    });
                }
            } catch (err) {
                console.error("Error fetching map data", err);
            }
        };

        fetchTrains();
        const interval = setInterval(fetchTrains, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    });

  }, []);

  return <div ref={mapContainer} className="w-full h-[calc(100vh-64px)]" />;
}