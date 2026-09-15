import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export default function AdminStudentLocations({ branch }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, [branch]);

  const loadStudents = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "students"),
        where("branch", "==", branch)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter((student) => student.status === "approved");

      setStudents(list);
    } catch (error) {
      console.error("Location students error:", error);
      alert("Students load nahi ho pa rahe hain.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const text = search.toLowerCase();

    return (
      String(student.name || "").toLowerCase().includes(text) ||
      String(student.email || "").toLowerCase().includes(text) ||
      String(student.studentId || "").toLowerCase().includes(text)
    );
  });

  const openMap = (student) => {
    const location = student.lastLocation;

    if (!location?.latitude || !location?.longitude) {
      alert("Is student ki location available nahi hai.");
      return;
    }

    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    window.open(url, "_blank");
  };

  const formatTime = (value) => {
    if (!value) return "Not available";

    try {
      if (value.seconds) {
        return new Date(value.seconds * 1000).toLocaleString("en-IN");
      }

      return new Date(value).toLocaleString("en-IN");
    } catch {
      return "Not available";
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📍 Student Locations</h2>
          <p style={styles.subtitle}>
            {branch} Branch — Latest shared student locations
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadStudents}>
          🔄 Refresh
        </button>
      </div>

      <input
        type="text"
        placeholder="Search student name, email or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {loading ? (
        <div style={styles.empty}>
          <h3>Loading students...</h3>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>👨‍🎓</div>
          <h3>No students found</h3>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredStudents.map((student) => {
            const location = student.lastLocation;
            const hasLocation =
              location?.latitude && location?.longitude;

            return (
              <div
                key={student.firestoreId}
                style={styles.card}
              >
                <div style={styles.studentTop}>
                  <div style={styles.avatar}>
                    {(student.name || "S").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 style={styles.studentName}>
                      {student.name || "Unknown Student"}
                    </h3>

                    <p style={styles.studentId}>
                      {student.studentId || "No ID"}
                    </p>
                  </div>
                </div>

                <div style={styles.details}>
                  <div>
                    <strong>📧 Email</strong>
                    <span>{student.email || "N/A"}</span>
                  </div>

                  <div>
                    <strong>🎓 Class</strong>
                    <span>
                      {student.className || "N/A"}
                      {student.stream
                        ? ` — ${student.stream}`
                        : ""}
                    </span>
                  </div>

                  <div>
                    <strong>🏫 Branch</strong>
                    <span>{student.branch || "N/A"}</span>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.locationStatus,
                    background: hasLocation
                      ? "#dcfce7"
                      : "#f3f4f6",
                    color: hasLocation
                      ? "#15803d"
                      : "#6b7280",
                  }}
                >
                  {hasLocation
                    ? "● Location Available"
                    : "● Location Not Shared"}
                </div>

                {hasLocation && (
                  <div style={styles.locationBox}>
                    <div>
                      <strong>Latitude</strong>
                      <span>
                        {Number(location.latitude).toFixed(6)}
                      </span>
                    </div>

                    <div>
                      <strong>Longitude</strong>
                      <span>
                        {Number(location.longitude).toFixed(6)}
                      </span>
                    </div>

                    {location.accuracy && (
                      <div>
                        <strong>Accuracy</strong>
                        <span>
                          ±{Math.round(location.accuracy)} m
                        </span>
                      </div>
                    )}

                    <div>
                      <strong>Last Updated</strong>
                      <span>
                        {formatTime(
                          location.updatedAt ||
                            location.timestamp
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div style={styles.actions}>
                  <button
                    style={styles.viewButton}
                    onClick={() =>
                      setSelectedStudent(student)
                    }
                  >
                    👁️ View
                  </button>

                  <button
                    style={{
                      ...styles.mapButton,
                      opacity: hasLocation ? 1 : 0.5,
                    }}
                    disabled={!hasLocation}
                    onClick={() => openMap(student)}
                  >
                    🗺️ Open Map
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedStudent && (
        <div
          style={styles.overlay}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.close}
              onClick={() => setSelectedStudent(null)}
            >
              ×
            </button>

            <h2 style={styles.modalTitle}>
              📍 {selectedStudent.name}
            </h2>

            <p style={styles.modalSubtitle}>
              Student ID: {selectedStudent.studentId || "N/A"}
            </p>

            {selectedStudent.lastLocation?.latitude &&
            selectedStudent.lastLocation?.longitude ? (
              <>
                <div style={styles.bigLocation}>
                  <div>
                    <span>Latitude</span>
                    <strong>
                      {Number(
                        selectedStudent.lastLocation.latitude
                      ).toFixed(6)}
                    </strong>
                  </div>

                  <div>
                    <span>Longitude</span>
                    <strong>
                      {Number(
                        selectedStudent.lastLocation.longitude
                      ).toFixed(6)}
                    </strong>
                  </div>
                </div>

                <div style={styles.mapPreview}>
                  <div style={styles.mapIcon}>📍</div>

                  <h3>Student Location</h3>

                  <p>
                    Location is available on Google Maps.
                  </p>

                  <button
                    style={styles.largeMapButton}
                    onClick={() => openMap(selectedStudent)}
                  >
                    🗺️ View on Google Maps
                  </button>
                </div>

                <p style={styles.updated}>
                  🕐 Last updated:{" "}
                  {formatTime(
                    selectedStudent.lastLocation.updatedAt ||
                      selectedStudent.lastLocation.timestamp
                  )}
                </p>
              </>
            ) : (
              <div style={styles.noLocation}>
                <div style={{ fontSize: "50px" }}>📍</div>
                <h3>Location Not Available</h3>
                <p>
                  Student ne abhi location share nahi ki hai.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    color: "#153b7a",
    fontSize: "28px",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },

  refreshButton: {
    border: "none",
    background: "#153b7a",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  search: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    boxSizing: "border-box",
    marginBottom: "20px",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "18px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },

  studentTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },

  studentName: {
    margin: 0,
    color: "#153b7a",
  },

  studentId: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  details: {
    display: "grid",
    gap: "10px",
    marginBottom: "15px",
  },

  detailsItem: {},

  detailsStrong: {},

  detailsSpan: {},

  locationStatus: {
    padding: "9px 12px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "bold",
    marginBottom: "12px",
  },

  locationBox: {
    background: "#f8fafc",
    borderRadius: "9px",
    padding: "12px",
    display: "grid",
    gap: "8px",
    fontSize: "13px",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },

  viewButton: {
    flex: 1,
    padding: "10px",
    border: "1px solid #153b7a",
    background: "#fff",
    color: "#153b7a",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  mapButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#d62828",
    color: "#fff",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  empty: {
    background: "#fff",
    padding: "60px 20px",
    textAlign: "center",
    borderRadius: "14px",
  },

  emptyIcon: {
    fontSize: "50px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "550px",
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxSizing: "border-box",
  },

  close: {
    position: "absolute",
    right: "15px",
    top: "10px",
    border: "none",
    background: "transparent",
    fontSize: "30px",
    cursor: "pointer",
  },

  modalTitle: {
    color: "#153b7a",
    marginBottom: "5px",
  },

  modalSubtitle: {
    color: "#6b7280",
    marginTop: 0,
  },

  bigLocation: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    margin: "20px 0",
  },

  mapPreview: {
    background: "#eef5ff",
    borderRadius: "12px",
    padding: "30px 20px",
    textAlign: "center",
  },

  mapIcon: {
    fontSize: "55px",
  },

  largeMapButton: {
    border: "none",
    background: "#d62828",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  updated: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "15px",
  },

  noLocation: {
    textAlign: "center",
    padding: "35px 10px",
    color: "#6b7280",
  },
};