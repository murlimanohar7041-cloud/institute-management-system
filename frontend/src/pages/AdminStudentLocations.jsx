
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "12px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#fff",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#334155",
  fontWeight: 700,
  fontSize: "13px",
};

function getText(value) {
  return String(value ?? "").trim();
}

function getStudentClass(student) {
  return getText(student.className || student.class || student.studentClass);
}

function getStudentStream(student) {
  return getText(student.stream);
}

function getStudentName(student) {
  return getText(student.name) || "Unnamed Student";
}

function getStudentId(student) {
  return getText(student.studentId || student.id);
}

function getStudentLocation(student) {
  const latitudeValue = student?.lastLocation?.latitude;
  const longitudeValue = student?.lastLocation?.longitude;

  if (
    latitudeValue === null ||
    latitudeValue === undefined ||
    latitudeValue === "" ||
    longitudeValue === null ||
    longitudeValue === undefined ||
    longitudeValue === ""
  ) {
    return null;
  }

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function getUpdatedTime(student) {
  const updatedAt = student?.lastLocation?.updatedAt;

  if (!updatedAt) {
    return "Time unavailable";
  }

  try {
    const date =
      typeof updatedAt.toDate === "function"
        ? updatedAt.toDate()
        : new Date(updatedAt);

    return Number.isNaN(date.getTime())
      ? "Time unavailable"
      : date.toLocaleString();
  } catch {
    return "Time unavailable";
  }
}

export default function AdminStudentLocations() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedStream, setSelectedStream] = useState("All");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const approvedStudents = snapshot.docs
          .map((studentDoc) => ({
            ...studentDoc.data(),
            id: studentDoc.id,
            firestoreDocumentId: studentDoc.id,
          }))
          .filter(
            (student) =>
              getText(student.status).toLowerCase() === "approved"
          );

        setStudents(approvedStudents);
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

  const branches = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => getText(student.branch))
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const classes = useMemo(() => {
    const classOrder = ["9th", "10th", "11th", "12th"];

    const available = [
      ...new Set(students.map(getStudentClass).filter(Boolean)),
    ];

    return available.sort((a, b) => {
      const indexA = classOrder.indexOf(a);
      const indexB = classOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.localeCompare(b);
    });
  }, [students]);

  const streams = useMemo(() => {
    return [
      ...new Set(
        students
          .filter((student) => {
            const className = getStudentClass(student).toLowerCase();
            return className.includes("11") || className.includes("12");
          })
          .map(getStudentStream)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students
      .filter((student) => {
        const branch = getText(student.branch);
        const className = getStudentClass(student);
        const stream = getStudentStream(student);

        const matchesBranch =
          selectedBranch === "All" || branch === selectedBranch;

        const matchesClass =
          selectedClass === "All" || className === selectedClass;

        const matchesStream =
          selectedStream === "All" || stream === selectedStream;

        const matchesSearch =
          !searchValue ||
          [
            getStudentName(student),
            getStudentId(student),
            getText(student.fatherName),
            getText(student.mobile),
            branch,
            className,
            stream,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchValue);

        return (
          matchesBranch &&
          matchesClass &&
          matchesStream &&
          matchesSearch
        );
      })
      .sort((a, b) =>
        getStudentName(a).localeCompare(getStudentName(b))
      );
  }, [
    students,
    search,
    selectedBranch,
    selectedClass,
    selectedStream,
  ]);

  const selectedStudent = filteredStudents.find(
    (student) => student.id === selectedStudentId
  );

  useEffect(() => {
    if (
      selectedStudentId &&
      filteredStudents.some(
        (student) => student.id === selectedStudentId
      )
    ) {
      return;
    }

    setSelectedStudentId(filteredStudents[0]?.id || "");
  }, [filteredStudents, selectedStudentId]);

  const selectedLocation = getStudentLocation(selectedStudent);

  const openGoogleMaps = () => {
    if (!selectedLocation) {
      alert(
        "Is student ki valid GPS location Firebase mein available nahi hai. Pehle student se location sharing start karwayein."
      );
      return;
    }

    const { latitude, longitude } = selectedLocation;

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedBranch("All");
    setSelectedClass("All");
    setSelectedStream("All");
  };

  const locationCount = filteredStudents.filter(
    (student) => getStudentLocation(student)
  ).length;

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "1250px",
        margin: "0 auto",
        padding: "clamp(12px, 3vw, 28px)",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "22px",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              color: "#dc2626",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            J. Solution Classes
          </p>

          <h1
            style={{
              margin: 0,
              color: "#1e3a8a",
              fontSize: "clamp(22px, 4vw, 30px)",
              lineHeight: 1.2,
            }}
          >
            Student Locations
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Branch aur class ke according students search karein.
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontWeight: 700,
            padding: "11px 15px",
            minHeight: "42px",
            cursor: "pointer",
          }}
        >
          Reset Filters
        </button>
      </header>

      {/* Loading */}
      {loading && (
        <div
          style={{
            padding: "18px",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            color: "#1e40af",
          }}
        >
          Students ka data load ho raha hai...
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "14px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "16px",
            overflowWrap: "anywhere",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
              }}
            >
              <p style={{ margin: 0, color: "#1d4ed8", fontSize: "13px" }}>
                Approved Students
              </p>
              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "27px",
                  color: "#1e3a8a",
                }}
              >
                {students.length}
              </strong>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#f0fdf4",
                border: "1px solid #dcfce7",
              }}
            >
              <p style={{ margin: 0, color: "#15803d", fontSize: "13px" }}>
                Filtered Students
              </p>
              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "27px",
                  color: "#166534",
                }}
              >
                {filteredStudents.length}
              </strong>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <p style={{ margin: 0, color: "#c2410c", fontSize: "13px" }}>
                GPS Available
              </p>
              <strong
                style={{
                  display: "block",
                  marginTop: "7px",
                  fontSize: "27px",
                  color: "#9a3412",
                }}
              >
                {locationCount}
              </strong>
            </div>
          </section>

          {students.length === 0 ? (
            <div
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              Koi approved student nahi mila. Firebase ke students collection
              mein student ka status "approved" check karein.
            </div>
          ) : (
            <>
              {/* Filters */}
              <section
                style={{
                  padding: "clamp(14px, 3vw, 22px)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  background: "#fff",
                  boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 16px",
                    fontSize: "17px",
                    color: "#1e3a8a",
                  }}
                >
                  Find a Student
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label htmlFor="location-branch" style={labelStyle}>
                      Branch
                    </label>
                    <select
                      id="location-branch"
                      value={selectedBranch}
                      onChange={(event) =>
                        setSelectedBranch(event.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="All">All Branches</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location-class" style={labelStyle}>
                      Class
                    </label>
                    <select
                      id="location-class"
                      value={selectedClass}
                      onChange={(event) =>
                        setSelectedClass(event.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="All">All Classes</option>
                      {classes.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location-stream" style={labelStyle}>
                      Stream
                    </label>
                    <select
                      id="location-stream"
                      value={selectedStream}
                      onChange={(event) =>
                        setSelectedStream(event.target.value)
                      }
                      style={inputStyle}
                    >
                      <option value="All">All Streams</option>
                      {streams.map((stream) => (
                        <option key={stream} value={stream}>
                          {stream}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location-search" style={labelStyle}>
                      Search Student
                    </label>
                    <input
                      id="location-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Name, ID, father or mobile"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <p
                  style={{
                    margin: "13px 0 0",
                    color: "#64748b",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Filters ek saath kaam karte hain. Branch, class aur stream
                  choose karke result aur chhota kar sakte hain.
                </p>
              </section>

              {/* Student list and details */}
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
                  alignItems: "start",
                  gap: "18px",
                }}
              >
                {/* List */}
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    background: "#fff",
                    padding: "15px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "13px",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: "17px" }}>
                      Student List
                    </h2>
                    <span
                      style={{
                        borderRadius: "20px",
                        padding: "5px 9px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "12px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {filteredStudents.length} found
                    </span>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      Is filter ke liye koi student nahi mila. Filters reset
                      karke dobara search karein.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: "9px",
                        maxHeight: "460px",
                        overflowY: "auto",
                        paddingRight: "2px",
                      }}
                    >
                      {filteredStudents.map((student) => {
                        const isSelected = student.id === selectedStudentId;
                        const hasLocation = Boolean(
                          getStudentLocation(student)
                        );

                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() =>
                              setSelectedStudentId(student.id)
                            }
                            aria-pressed={isSelected}
                            style={{
                              width: "100%",
                              minWidth: 0,
                              textAlign: "left",
                              padding: "13px",
                              borderRadius: "11px",
                              border: isSelected
                                ? "2px solid #2563eb"
                                : "1px solid #e2e8f0",
                              background: isSelected ? "#eff6ff" : "#fff",
                              cursor: "pointer",
                              color: "#0f172a",
                              boxSizing: "border-box",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "14px",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {getStudentName(student)}
                              </strong>

                              <span
                                style={{
                                  flexShrink: 0,
                                  width: "9px",
                                  height: "9px",
                                  marginTop: "4px",
                                  borderRadius: "50%",
                                  background: hasLocation
                                    ? "#16a34a"
                                    : "#f97316",
                                }}
                                title={
                                  hasLocation
                                    ? "GPS available"
                                    : "GPS unavailable"
                                }
                              />
                            </div>

                            <p
                              style={{
                                margin: "6px 0 0",
                                color: "#64748b",
                                fontSize: "12px",
                                lineHeight: 1.5,
                                overflowWrap: "anywhere",
                              }}
                            >
                              ID: {getStudentId(student)}
                            </p>

                            <p
                              style={{
                                margin: "3px 0 0",
                                color: "#475569",
                                fontSize: "12px",
                                lineHeight: 1.5,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {getText(student.branch) || "Branch not set"}
                              {" · "}
                              {getStudentClass(student) || "Class not set"}
                              {getStudentStream(student)
                                ? ` · ${getStudentStream(student)}`
                                : ""}
                            </p>

                            <p
                              style={{
                                margin: "7px 0 0",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: hasLocation ? "#15803d" : "#c2410c",
                              }}
                            >
                              {hasLocation
                                ? "GPS available"
                                : "GPS unavailable"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected student details */}
                <div
                  style={{
                    minWidth: 0,
                    padding: "clamp(15px, 3vw, 22px)",
                    border: "1px solid #bfdbfe",
                    borderRadius: "16px",
                    background: "#f8fbff",
                    boxSizing: "border-box",
                  }}
                >
                  <h2
                    style={{
                      margin: "0 0 5px",
                      color: "#1e3a8a",
                      fontSize: "18px",
                    }}
                  >
                    Selected Student
                  </h2>

                  <p
                    style={{
                      margin: "0 0 18px",
                      color: "#64748b",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    Student ki details aur saved GPS location.
                  </p>

                  {!selectedStudent ? (
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      Details dekhne ke liye list se student select karein.
                    </p>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: "15px",
                          border: "1px solid #dbeafe",
                          borderRadius: "12px",
                          background: "#fff",
                        }}
                      >
                        <h3
                          style={{
                            margin: "0 0 14px",
                            fontSize: "19px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {getStudentName(selectedStudent)}
                        </h3>

                        {[
                          ["Student ID", getStudentId(selectedStudent)],
                          [
                            "Branch",
                            getText(selectedStudent.branch) || "Not specified",
                          ],
                          [
                            "Class",
                            getStudentClass(selectedStudent) || "Not specified",
                          ],
                          [
                            "Stream",
                            getStudentStream(selectedStudent) || "Not specified",
                          ],
                          [
                            "Father's Name",
                            getText(selectedStudent.fatherName) || "Not specified",
                          ],
                          [
                            "Mobile",
                            getText(selectedStudent.mobile) || "Not specified",
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(95px, 0.8fr) minmax(0, 1.2fr)",
                              gap: "8px",
                              padding: "9px 0",
                              borderBottom: "1px solid #f1f5f9",
                              fontSize: "13px",
                              lineHeight: 1.5,
                            }}
                          >
                            <span style={{ color: "#64748b" }}>{label}</span>
                            <strong
                              style={{
                                color: "#1e293b",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {value}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {selectedLocation ? (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "15px",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px",
                            background: "#f0fdf4",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 10px",
                              color: "#166534",
                              fontWeight: 800,
                              fontSize: "14px",
                            }}
                          >
                            GPS location available
                          </p>

                          <p
                            style={{
                              margin: "6px 0",
                              color: "#166534",
                              fontSize: "13px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <strong>Latitude:</strong>{" "}
                            {selectedLocation.latitude}
                          </p>

                          <p
                            style={{
                              margin: "6px 0",
                              color: "#166534",
                              fontSize: "13px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <strong>Longitude:</strong>{" "}
                            {selectedLocation.longitude}
                          </p>

                          <p
                            style={{
                              margin: "8px 0 13px",
                              color: "#166534",
                              fontSize: "12px",
                              lineHeight: 1.5,
                            }}
                          >
                            <strong>Last updated:</strong>{" "}
                            {getUpdatedTime(selectedStudent)}
                          </p>

                          <button
                            type="button"
                            onClick={openGoogleMaps}
                            style={{
                              width: "100%",
                              minHeight: "45px",
                              padding: "12px 14px",
                              border: "none",
                              borderRadius: "10px",
                              background: "#2563eb",
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: 800,
                              cursor: "pointer",
                              lineHeight: 1.4,
                            }}
                          >
                            📍 Open Student Location in Google Maps
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "14px",
                            border: "1px solid #fed7aa",
                            borderRadius: "12px",
                            background: "#fff7ed",
                            color: "#9a3412",
                            fontSize: "13px",
                            lineHeight: 1.7,
                          }}
                        >
                          <strong>GPS location available nahi hai.</strong>
                          <p style={{ margin: "5px 0 0" }}>
                            Firebase mein valid latitude aur longitude nahi
                            mile. Student se app mein location sharing start
                            karwayein aur dobara check karein.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
