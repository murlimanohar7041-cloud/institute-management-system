
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminStudentLocations() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const studentList = snapshot.docs.map((studentDoc) => ({
          ...studentDoc.data(),
          id: studentDoc.id,
          firestoreDocumentId: studentDoc.id,
        }));

        const approvedStudents = studentList.filter(
          (student) =>
            String(student.status || "").toLowerCase() === "approved"
        );

        setStudents(approvedStudents);

        setSelectedStudentId((currentId) => {
          if (
            currentId &&
            approvedStudents.some((student) => student.id === currentId)
          ) {
            return currentId;
          }

          return approvedStudents[0]?.id || "";
        });

        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Student location loading error:", err);
        setError(err.message || "Students ka data load nahi ho paya.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const latitude = Number(selectedStudent?.lastLocation?.latitude);
  const longitude = Number(selectedStudent?.lastLocation?.longitude);

  const hasValidLocation =
    selectedStudent?.lastLocation?.latitude !== null &&
    selectedStudent?.lastLocation?.latitude !== undefined &&
    selectedStudent?.lastLocation?.longitude !== null &&
    selectedStudent?.lastLocation?.longitude !== undefined &&
    selectedStudent?.lastLocation?.latitude !== "" &&
    selectedStudent?.lastLocation?.longitude !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const openGoogleMaps = () => {
    if (!hasValidLocation) {
      alert(
        "Is student ki valid GPS location Firebase mein available nahi hai. Pehle student se location sharing start karwayein."
      );
      return;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const getUpdatedTime = () => {
    const updatedAt = selectedStudent?.lastLocation?.updatedAt;

    if (!updatedAt) {
      return "Time unavailable";
    }

    try {
      if (typeof updatedAt.toDate === "function") {
        return updatedAt.toDate().toLocaleString();
      }

      const date = new Date(updatedAt);

      return Number.isNaN(date.getTime())
        ? "Time unavailable"
        : date.toLocaleString();
    } catch {
      return "Time unavailable";
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#1e3a8a", marginBottom: "8px" }}>
        Student Live Locations
      </h1>

      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Student ki latest Firebase location check karein aur Google Maps mein
        naye tab par open karein.
      </p>

      {loading && <p>Students ka data load ho raha hai...</p>}

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <p>
          Koi approved student nahi mila. Firebase ke students collection mein
          student ka status "approved" check karein.
        </p>
      )}

      {!loading && !error && students.length > 0 && (
        <>
          <label
            htmlFor="student-location-select"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#1e293b",
            }}
          >
            Student select karein
          </label>

          <select
            id="student-location-select"
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            style={{
              width: "100%",
              maxWidth: "450px",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              marginBottom: "20px",
              background: "#fff",
              fontSize: "15px",
            }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name || "Unnamed Student"} —{" "}
                {student.studentId || student.id}
              </option>
            ))}
          </select>

          {selectedStudent && (
            <div
              style={{
                background: "#eff6ff",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "18px",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>
                Student Details
              </h3>

              <p>
                <strong>Name:</strong>{" "}
                {selectedStudent.name || "Not available"}
              </p>

              <p>
                <strong>Student ID:</strong>{" "}
                {selectedStudent.studentId || selectedStudent.id}
              </p>

              <p>
                <strong>Branch:</strong>{" "}
                {selectedStudent.branch || "Not specified"}
              </p>

              {hasValidLocation ? (
                <>
                  <p>
                    <strong>Latitude:</strong> {latitude}
                  </p>

                  <p>
                    <strong>Longitude:</strong> {longitude}
                  </p>

                  <p>
                    <strong>Last updated:</strong> {getUpdatedTime()}
                  </p>

                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 20px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginTop: "8px",
                    }}
                  >
                    📍 Open Student Location in Google Maps
                  </button>
                </>
              ) : (
                <div
                  style={{
                    background: "#fff7ed",
                    color: "#9a3412",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "12px",
                  }}
                >
                  <strong>Student ki GPS location available nahi hai.</strong>
                  <p style={{ marginBottom: 0 }}>
                    Firebase mein is student ke liye valid latitude aur
                    longitude nahi mile. Student se app mein location sharing
                    start karwayein aur dobara check karein.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
