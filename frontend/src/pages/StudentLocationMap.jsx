
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Student marker
const studentIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background:#dc2626;
    width:30px;
    height:30px;
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px #555;
    display:flex;
    align-items:center;
    justify-content:center;
  "><span style="transform:rotate(45deg);color:white;font-size:15px;">S</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Admin marker
const adminIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    background:#2563eb;
    width:30px;
    height:30px;
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px #555;
    display:flex;
    align-items:center;
    justify-content:center;
  "><span style="transform:rotate(45deg);color:white;font-size:15px;">A</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});


function FitMap({ studentPosition, adminPosition }) {
  const map = useMap();

  useEffect(() => {
    const points = [studentPosition, adminPosition].filter(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    );

    if (points.length === 2) {
      const bounds = L.latLngBounds(points);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
      });
    } else if (points.length === 1) {
      map.setView(points[0], 16, { animate: true });
    }

    // Ensure Leaflet recalculates the map size after rendering.
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [
    map,
    studentPosition?.[0],
    studentPosition?.[1],
    adminPosition?.[0],
    adminPosition?.[1],
  ]);

  return null;
}


function calculateDistance(point1, point2) {
  if (!point1 || !point2) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StudentLocationMap({
  student,
  showAdminLocation = false,
}) {
  const [adminPosition, setAdminPosition] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [route, setRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  const latitude = Number(student?.lastLocation?.latitude);
  const longitude = Number(student?.lastLocation?.longitude);

  const studentPosition =
    student?.lastLocation?.latitude != null &&
    student?.lastLocation?.longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
      ? [latitude, longitude]
      : null;

  // Get admin's current location
  useEffect(() => {
    if (!showAdminLocation) {
      setAdminPosition(null);
      setGpsError("");
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Is browser mein GPS location support nahi hai.");
      return;
    }

    setGpsError("");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setAdminPosition([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setGpsError("");
      },
      (error) => {
        if (error.code === 1) {
          setGpsError(
            "Admin location ke liye browser permission Allow karein."
          );
        } else {
          setGpsError(
            "Admin ki current location nahi mil rahi. GPS aur internet check karein."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [showAdminLocation]);

  // Load driving route between admin and student
  useEffect(() => {
    setRoute([]);
    setRouteError("");

    if (!showAdminLocation || !adminPosition || !studentPosition) {
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function loadRoute() {
      setRouteLoading(true);
      setRouteError("");

      try {
        const start = `${adminPosition[1]},${adminPosition[0]}`;
        const end = `${studentPosition[1]},${studentPosition[0]}`;

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${start};${end}?overview=full&geometries=geojson`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Routing service abhi available nahi hai.");
        }

        const data = await response.json();

        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("In dono locations ke beech road route nahi mila.");
        }

        if (!cancelled) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            ([lon, lat]) => [lat, lon]
          );

          setRoute(coordinates);
        }
      } catch (error) {
        if (!cancelled && error.name !== "AbortError") {
          setRouteError(
            error.message || "Road route load nahi hua."
          );
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    showAdminLocation,
    adminPosition,
    studentPosition?.[0],
    studentPosition?.[1],
  ]);

  const distance =

  console.log("STUDENT GPS:", studentPosition);
  console.log("ADMIN GPS:", adminPosition);
  console.log("STUDENT RAW:", student?.lastLocation);

    showAdminLocation && adminPosition && studentPosition
      ? calculateDistance(adminPosition, studentPosition)
      : null;

  const center = studentPosition || adminPosition || [20.5937, 78.9629];

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
          fontSize: 13,
          color: "#374151",
        }}
      >
        <span>🔴 Student location</span>

        {showAdminLocation && <span>🔵 Admin current location</span>}
      </div>

      {showAdminLocation && gpsError && (
        <div
          style={{
            background: "#fff7ed",
            color: "#9a3412",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {gpsError}
        </div>
      )}

      {!studentPosition && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Student ki location abhi available nahi hai. Student ke device se
          location sharing start honi chahiye.
        </div>
      )}

      {showAdminLocation && distance !== null && (
        <div
          style={{
            background: "#eff6ff",
            color: "#1e40af",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            fontWeight: "bold",
          }}
        >
          📏 Seedhi doori:{" "}
          {distance < 1
            ? `${Math.round(distance * 1000)} metres`
            : `${Number.isFinite(distance) ? distance.toFixed(2) : "Location unavailable"} km`}

          <div
            style={{
              fontWeight: "normal",
              fontSize: 12,
              marginTop: 5,
            }}
          >
            Yeh seedhi doori hai. Road route ki doori alag ho sakti hai.
          </div>
        </div>
      )}

      {showAdminLocation && routeLoading && (
        <p style={{ color: "#1d4ed8" }}>
          Road route load ho raha hai...
        </p>
      )}

      {showAdminLocation && routeError && (
        <p style={{ color: "#b91c1c" }}>{routeError}</p>
      )}

      <div
        style={{
          height: 420,
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #d1d5db",
          position: "relative",
          zIndex: 0,
        }}
      >
        <MapContainer
          center={center}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {studentPosition && (
            <Marker position={studentPosition} icon={studentIcon}>
              <Popup>
                <strong>{student?.name || "Student"}</strong>
                <br />
                Student ki latest shared location
              </Popup>
            </Marker>
          )}

          {showAdminLocation && adminPosition && (
            <Marker position={adminPosition} icon={adminIcon}>
              <Popup>
                <strong>Admin</strong>
                <br />
                Aapki current location
              </Popup>
            </Marker>
          )}

          {showAdminLocation && route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
                opacity: 0.8,
              }}
            />
          )}

          <FitMap
          
            studentPosition={studentPosition}
            adminPosition={showAdminLocation ? adminPosition : null}
          />
        </MapContainer>
      </div>

      {showAdminLocation && (
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
          Admin GPS browser permission par depend karta hai. Road route
          internet aur routing service ki availability par depend karta hai.
        </p>
      )}
    </div>
  );
}
