import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export default function AdminCertificates({ branch }) {
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    studentEmail: "",
    certificateTitle: "",
    certificateNumber: "",
    issueDate: "",
    description: "",
    certificateUrl: "",
  });

  useEffect(() => {
    loadData();
  }, [branch]);

  const loadData = async () => {
    try {
      setLoading(true);

      const studentsQuery = query(
        collection(db, "students"),
        where("branch", "==", branch)
      );

      const studentsSnap = await getDocs(studentsQuery);

      const studentList = studentsSnap.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter((item) => item.status === "approved");

      setStudents(studentList);

      const certificatesQuery = query(
        collection(db, "certificates"),
        where("branch", "==", branch)
      );

      const certificatesSnap = await getDocs(certificatesQuery);

      const certificateList = certificatesSnap.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      setCertificates(certificateList);
    } catch (error) {
      console.error(error);
      alert("Data load nahi ho raha hai.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (email) => {
    const student = students.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase()
    );

    setForm({
      ...form,
      studentEmail: email,
    });

    if (student) {
      setForm((prev) => ({
        ...prev,
        studentEmail: email,
      }));
    }
  };

  const addCertificate = async (e) => {
    e.preventDefault();

    if (!form.studentEmail) {
      alert("Student select karo.");
      return;
    }

    if (!form.certificateTitle.trim()) {
      alert("Certificate title dalo.");
      return;
    }

    if (!form.certificateUrl.trim()) {
      alert("Certificate PDF URL dalo.");
      return;
    }

    if (
      !form.certificateUrl.startsWith("http://") &&
      !form.certificateUrl.startsWith("https://")
    ) {
      alert("Valid PDF URL dalo.");
      return;
    }

    const student = students.find(
      (item) =>
        item.email?.toLowerCase() === form.studentEmail.toLowerCase()
    );

    if (!student) {
      alert("Student nahi mila.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "certificates"), {
        certificateId: `CERT-${Date.now()}`,

        studentFirestoreId: student.firestoreId,
        studentId: student.studentId || "",
        studentName: student.name || "",
        studentEmail: student.email || "",
        fatherName: student.fatherName || "",

        branch: student.branch || branch,
        className: student.className || "",
        stream: student.stream || "",

        certificateTitle: form.certificateTitle.trim(),
        certificateNumber: form.certificateNumber.trim(),
        issueDate: form.issueDate,
        description: form.description.trim(),

        certificateUrl: form.certificateUrl.trim(),

        status: "Issued",
        createdAt: serverTimestamp(),
      });

      alert("Certificate successfully send ho gaya. ✅");

      setForm({
        studentEmail: "",
        certificateTitle: "",
        certificateNumber: "",
        issueDate: "",
        description: "",
        certificateUrl: "",
      });

      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Certificate save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCertificate = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap ye certificate delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "certificates", id));
      alert("Certificate delete ho gaya.");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Certificate delete nahi ho paya.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading certificates...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Certificates</h2>
          <p style={styles.subtitle}>
            Branch: <strong>{branch}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? "Close" : "+ Add Certificate"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addCertificate} style={styles.form}>
          <h3 style={styles.formTitle}>Send Certificate</h3>

          <label style={styles.label}>Select Student</label>

          <select
            value={form.studentEmail}
            onChange={(e) => handleStudentChange(e.target.value)}
            style={styles.input}
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option
                key={student.firestoreId}
                value={student.email}
              >
                {student.name} - {student.studentId} - {student.email}
              </option>
            ))}
          </select>

          <label style={styles.label}>Certificate Title</label>

          <input
            type="text"
            placeholder="Example: Course Completion Certificate"
            value={form.certificateTitle}
            onChange={(e) =>
              setForm({
                ...form,
                certificateTitle: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Certificate Number</label>

          <input
            type="text"
            placeholder="Example: JSC-CERT-001"
            value={form.certificateNumber}
            onChange={(e) =>
              setForm({
                ...form,
                certificateNumber: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Issue Date</label>

          <input
            type="date"
            value={form.issueDate}
            onChange={(e) =>
              setForm({
                ...form,
                issueDate: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Description</label>

          <textarea
            placeholder="Certificate description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            style={styles.textarea}
          />

          <label style={styles.label}>
            Certificate PDF URL
          </label>

          <input
            type="url"
            placeholder="Paste Google Drive PDF link here"
            value={form.certificateUrl}
            onChange={(e) =>
              setForm({
                ...form,
                certificateUrl: e.target.value,
              })
            }
            style={styles.input}
          />

          <p style={styles.help}>
            Google Drive me PDF upload karke "Anyone with the link → Viewer"
            karke yahan link paste karo.
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Sending..." : "Send Certificate"}
          </button>
        </form>
      )}

      <div style={styles.list}>
        {certificates.length === 0 ? (
          <div style={styles.empty}>
            Abhi koi certificate nahi hai.
          </div>
        ) : (
          certificates.map((item) => (
            <div key={item.firestoreId} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <h3 style={styles.cardTitle}>
                    {item.certificateTitle || "Certificate"}
                  </h3>

                  <p style={styles.studentName}>
                    {item.studentName}
                  </p>

                  <p style={styles.info}>
                    Student ID: {item.studentId || "-"}
                  </p>

                  <p style={styles.info}>
                    Certificate No:{" "}
                    {item.certificateNumber || "-"}
                  </p>

                  <p style={styles.info}>
                    Issue Date: {item.issueDate || "-"}
                  </p>

                  <span style={styles.status}>
                    {item.status || "Issued"}
                  </span>
                </div>
              </div>

              {item.description && (
                <p style={styles.description}>
                  {item.description}
                </p>
              )}

              <div style={styles.actions}>
                {item.certificateUrl && (
                  <a
                    href={item.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.viewButton}
                  >
                    View PDF ↗
                  </a>
                )}

                {item.certificateUrl && (
                  <a
                    href={item.certificateUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    style={styles.downloadButton}
                  >
                    Download PDF ↓
                  </a>
                )}

                <button
                  onClick={() =>
                    deleteCertificate(item.firestoreId)
                  }
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  loading: {
    padding: "40px",
    textAlign: "center",
    fontSize: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "26px",
    color: "#1e3a8a",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  addButton: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },

  form: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "25px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
  },

  formTitle: {
    marginTop: 0,
    color: "#1e3a8a",
  },

  label: {
    display: "block",
    marginTop: "13px",
    marginBottom: "6px",
    fontWeight: "700",
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "90px",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    resize: "vertical",
  },

  help: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
  },

  saveButton: {
    marginTop: "18px",
    border: "none",
    background: "#15803d",
    color: "#fff",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },

  list: {
    display: "grid",
    gap: "15px",
  },

  empty: {
    padding: "35px",
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#64748b",
  },

  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px",
  },

  cardTitle: {
    margin: "0 0 5px",
    color: "#1e3a8a",
  },

  studentName: {
    margin: "0 0 7px",
    fontWeight: "700",
  },

  info: {
    margin: "4px 0",
    color: "#475569",
    fontSize: "14px",
  },

  status: {
    display: "inline-block",
    marginTop: "8px",
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  description: {
    color: "#475569",
    marginTop: "12px",
  },

  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "15px",
  },

  viewButton: {
    textDecoration: "none",
    background: "#1d4ed8",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "700",
  },

  downloadButton: {
    textDecoration: "none",
    background: "#15803d",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "700",
  },

  deleteButton: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
  },
};