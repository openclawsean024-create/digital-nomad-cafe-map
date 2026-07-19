'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Cafe, City } from '@/domain/types';
import { calculateWorkScore } from '@/domain/cafes';

interface MapViewProps {
  cafes: Cafe[];
  selectedId: string | null;
  selectedCity: City | undefined;
  onSelect: (cafe: Cafe) => void;
}

const markerIcon = (score: number, active: boolean) => L.divIcon({
  className: '',
  html: `<span class="leaflet-score-marker${active ? ' leaflet-score-marker-active' : ''}">${score}</span>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

function Recenter({ city }: { city: City | undefined }) {
  const map = useMap();
  if (city) map.setView([city.lat, city.lng], city.countryCode === 'TW' ? 12 : 11);
  return null;
}

export default function MapView({ cafes, selectedId, selectedCity, onSelect }: MapViewProps) {
  const center: [number, number] = selectedCity ? [selectedCity.lat, selectedCity.lng] : [23.7, 121];
  return (
    <MapContainer center={center} zoom={selectedCity ? 12 : 7} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter city={selectedCity} />
      {cafes.map((cafe) => (
        <Marker
          key={cafe.id}
          position={[cafe.lat, cafe.lng]}
          icon={markerIcon(calculateWorkScore(cafe), cafe.id === selectedId)}
          eventHandlers={{ click: () => onSelect(cafe) }}
        >
          <Popup>
            <strong>{cafe.name}</strong><br />
            WiFi {cafe.wifiMbps} Mbps · 安靜 {cafe.quietScore.toFixed(1)}<br />
            插座 {cafe.outletRate}% · {cafe.verifierCount} 人驗證
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
