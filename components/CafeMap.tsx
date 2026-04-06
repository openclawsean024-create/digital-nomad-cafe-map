'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Cafe } from '@/types/cafe';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

interface CafeMapProps {
  cafes: Cafe[];
  center?: [number, number];
  onMarkerClick?: (cafe: Cafe) => void;
}

export default function CafeMap({ cafes, center, onMarkerClick }: CafeMapProps) {
  const defaultCenter: [number, number] = center ?? [20, 0];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {cafes.map(cafe => (
          <Marker
            key={cafe.id}
            position={[cafe.lat, cafe.lng]}
            eventHandlers={{
              click: () => onMarkerClick?.(cafe),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-base">{cafe.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{cafe.address}</p>
                <div className="mt-2 text-xs space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">WiFi:</span>
                    <span className="text-green-600">{'★'.repeat(cafe.wifiQuality)}{'☆'.repeat(5 - cafe.wifiQuality)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Power:</span>
                    <span>{cafe.powerOutlets === 3 ? '★★★' : cafe.powerOutlets === 2 ? '★★☆' : '★☆☆'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Quiet:</span>
                    <span>{cafe.quietness === 3 ? '😌 Very Quiet' : cafe.quietness === 2 ? '😐 Moderate' : '🔊 Can be loud'}</span>
                  </div>
                </div>
                {cafe.notes && (
                  <p className="text-xs text-gray-700 mt-2 italic">{cafe.notes}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
