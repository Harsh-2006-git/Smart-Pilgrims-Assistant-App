import React, { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { stayMarkerIcon } from "./stayMapIcons";

function RecenterMap({ position, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (position?.length === 2) {
      map.setView(position, zoom);
    }
  }, [map, position, zoom]);

  return null;
}

function InteractiveMarker({ position, onSelect, popupText }) {
  useMapEvents({
    click(event) {
      if (!onSelect) return;
      onSelect(event.latlng);
    },
  });

  return (
    <Marker
      position={position}
      icon={stayMarkerIcon}
      draggable={Boolean(onSelect)}
      eventHandlers={
        onSelect
          ? {
              dragend: (event) => {
                const next = event.target.getLatLng();
                onSelect(next);
              },
            }
          : undefined
      }
    >
      {popupText ? <Popup>{popupText}</Popup> : null}
    </Marker>
  );
}

const StayLocationMap = ({
  position,
  onSelect,
  zoom = 13,
  className = "",
  popupText = "Selected stay location",
}) => (
  <div className={`overflow-hidden rounded-[2rem] border border-orange-100 ${className}`}>
    <MapContainer center={position} zoom={zoom} className="h-full w-full min-h-[280px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap position={position} zoom={zoom} />
      <InteractiveMarker position={position} onSelect={onSelect} popupText={popupText} />
    </MapContainer>
  </div>
);

export default StayLocationMap;
