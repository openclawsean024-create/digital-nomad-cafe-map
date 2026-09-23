'use client';

/**
 * MapView — Cafework map surface for the explorer.
 *
 * Why this bypasses `react-leaflet`'s `<MapContainer>`:
 *
 * The dev-only console error "Map container is already initialized" comes
 * from react-leaflet 4.x's `useCallback[mapRef]` calling `L.map(container)`
 * twice on the same DOM node. In Next.js dev, the parent
 * (`WorkspaceMap`) imports us through `next/dynamic({ ssr: false })`,
 * which wraps the boundary in Suspense. Suspense reappearance +
 * React.StrictMode dev double-invoke together reattach our ref to a DOM
 * node that already carries `._leaflet_id`, and Leaflet throws.
 *
 * The community-standard workarounds (defer useEffect, pin key,
 * `useState(false)+setTimeout`) are insufficient because the reappearance
 * is a layout-effect commit, not an effect cycle — it does not run our
 * cleanup function. We instead drive Leaflet ourselves with a guard:
 *
 *   1. `useEffect` mounts an L.Map on the ref'd DOM exactly once.
 *   2. The mount body checks `container._leaflet_id`; if a previous
 *      instance is still attached (Suspense reuse or HMR), we skip the
 *      re-init and reuse it.
 *   3. The cleanup function calls `map.remove()`, which clears
 *      `_leaflet_id` so the next mount is safe.
 *   4. Marker and selectedCity effects mutate the existing map rather
 *      than tearing it down.
 *
 * This keeps the public surface (props + onSelect callback) identical to
 * the prior `<MapContainer>` version, so consumers and tests do not
 * need to change.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Cafe, City } from '@/domain/types';
import { calculateWorkScore, getEvidenceStatus, hasAnyWorkEvidence } from '@/domain/cafes';

interface MapViewProps {
  cafes: Cafe[];
  selectedId: string | null;
  selectedCity: City | undefined;
  onSelect: (cafe: Cafe) => void;
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function markerIcon(cafe: Cafe, active: boolean): L.DivIcon {
  const score = calculateWorkScore(cafe);
  const evidenceStatus = getEvidenceStatus(cafe);
  const unknown = !hasAnyWorkEvidence(cafe);
  return L.divIcon({
    className: '',
    html:
      `<span class="leaflet-score-marker leaflet-score-marker-${evidenceStatus}` +
      `${unknown ? ' leaflet-score-marker-unverified' : ''}` +
      `${active ? ' leaflet-score-marker-active' : ''}">` +
      `${unknown ? '—' : score}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });
}

const NO_LEAFLET =
  typeof window === 'undefined' ||
  typeof L === 'undefined' ||
  typeof (L as unknown as { Map?: unknown }).Map !== 'function';

export default function MapView({ cafes, selectedId, selectedCity, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const cafesRef = useRef<Cafe[]>(cafes);
  const selectedIdRef = useRef<string | null>(selectedId);
  const onSelectRef = useRef<(cafe: Cafe) => void>(onSelect);
  const selectedCityRef = useRef<City | undefined>(selectedCity);

  // Keep refs current so the mount effect and the marker/center effects
  // can read latest props without recreating the L.Map / markers each time.
  cafesRef.current = cafes;
  selectedIdRef.current = selectedId;
  onSelectRef.current = onSelect;
  selectedCityRef.current = selectedCity;

  // Mount: create the L.Map exactly once, guarding against the
  // already-initialized case (HMR / Suspense reappearance reuse the DOM).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (NO_LEAFLET) return;

    // Read Leaflet's internal id key off the DOM node. We use a typed
    // local because TS does not know about the `_leaflet_id` runtime prop.
    const containerWithLeaftlet = container as HTMLDivElement & { _leaflet_id?: unknown };

    if (containerWithLeaftlet._leaflet_id !== undefined) {
      // The container is already initialized. Reuse it instead of throwing.
      // Look up any existing map instance attached to this container via
      // Leaflet's internal id key, so subsequent center / marker updates
      // route through the same instance rather than a fresh one.
      const existing = (L as unknown as { MapProviderInit?: { maps?: Map<unknown, L.Map> } })
        .MapProviderInit;
      if (existing?.maps) {
        const existingMap = existing.maps.get(containerWithLeaftlet._leaflet_id) as L.Map | undefined;
        if (existingMap) {
          mapRef.current = existingMap;
          syncMarkers(existingMap, markersRef, cafesRef, selectedIdRef, onSelectRef);
          syncCenter(existingMap, selectedCityRef.current);
          return () => {
            // Detach our marker bookkeeping on unmount so the next remount
            // can claim the map again.
            clearMarkers(markersRef);
            mapRef.current = null;
          };
        }
      }
      // We have a leaflet_id but cannot recover the L.Map handle —
      // fall through and try map.remove() then re-init.
      try {
        Object.values((L as unknown as { _mapHandles?: Map<unknown, L.Map> })._mapHandles ?? new Map()).forEach(
          (m) => {
            if (m && (m as L.Map).getContainer() === container) {
              (m as L.Map).remove();
            }
          },
        );
      } catch {
        /* noop */
      }
    }

    const center = selectedCityRef.current
      ? ([selectedCityRef.current.lat, selectedCityRef.current.lng] as [number, number])
      : ([23.7, 121] as [number, number]);
    const zoom = selectedCityRef.current ? 12 : 7;

    const map = L.map(container, {
      scrollWheelZoom: true,
      center,
      zoom,
    });
    mapRef.current = map;
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    syncMarkers(map, markersRef, cafesRef, selectedIdRef, onSelectRef);

    return () => {
      // StrictMode / Suspense cleanup. remove() clears _leaflet_id on
      // the container so subsequent remounts go through the "already
      // initialized" guard and try to reuse via MapProviderInit — and
      // finally falls back to a fresh re-init.
      clearMarkers(markersRef);
      try {
        map.remove();
      } catch {
        /* noop */
      }
      mapRef.current = null;
    };
  }, []);

  // Re-center when selectedCity changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncCenter(map, selectedCity);
  }, [selectedCity?.id, selectedCity?.lat, selectedCity?.lng]);

  return (
    <div
      ref={containerRef}
      data-map-view="true"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="false"
    />
  );
}

function syncCenter(map: L.Map, selectedCity: City | undefined) {
  if (!map) return;
  const center = selectedCity
    ? ([selectedCity.lat, selectedCity.lng] as [number, number])
    : ([23.7, 121] as [number, number]);
  const zoom = selectedCity ? (selectedCity.countryCode === 'TW' ? 12 : 11) : 7;
  try {
    map.setView(center, zoom);
  } catch {
    /* noop */
  }
}

type MarkersRef = { current: Record<string, L.Marker> };
type CafesRef = { current: Cafe[] };
type SelectedIdRef = { current: string | null };
type OnSelectRef = { current: (cafe: Cafe) => void };

function syncMarkers(
  map: L.Map,
  markersRef: MarkersRef,
  cafesRef: CafesRef,
  selectedIdRef: SelectedIdRef,
  onSelectRef: OnSelectRef,
) {
  if (!map) return;
  const cafes = cafesRef.current;
  const selectedId = selectedIdRef.current;
  const onSelect = onSelectRef.current;
  const next: Record<string, L.Marker> = {};
  for (const cafe of cafes) {
    const icon = markerIcon(cafe, cafe.id === selectedId);
    const existing = markersRef.current[cafe.id];
    let marker: L.Marker;
    if (existing) {
      existing.setIcon(icon);
      marker = existing;
    } else {
      marker = L.marker([cafe.lat, cafe.lng], { icon });
    }
    marker.off('click');
    marker.on('click', () => onSelect(cafe));
    if (!map.hasLayer(marker)) marker.addTo(map);
    next[cafe.id] = marker;
  }
  for (const id of Object.keys(markersRef.current)) {
    if (!next[id]) {
      markersRef.current[id].remove();
    }
  }
  markersRef.current = next;
}

function clearMarkers(markersRef: MarkersRef) {
  for (const marker of Object.values(markersRef.current)) {
    try {
      marker.remove();
    } catch {
      /* noop */
    }
  }
  markersRef.current = {};
}
