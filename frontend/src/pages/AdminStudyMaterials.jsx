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
import { sendStudentNotification } from "../utils/notificationService";

export default function AdminStudyMaterials({ branch }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    className: "9th",
    stream: "",
    description: "",
    materialUrl: "",
  });

  const loadMaterials = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "studyMaterials"),
        where("branch", "==", branch)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setMaterials(list);
    } catch (error) {
      console.error(error);
      alert("Study materials load nahi ho raha hai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [branch]);

  const handleClassChange = (value) => {
    setForm({
      ...form,
      className: value,
      stream: value === "11th" || value === "12th" ? form.stream : "",
    });
  };

  const addMaterial = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Material title dalo.");
      return;
    }

    if (!form.subject.trim()) {
      alert("Subject dalo.");
      return;
    }

    if (!form.materialUrl.trim()) {
      alert("PDF/Notes URL dalo.");
      return;
    }

    if (
      !form.materialUrl.startsWith("http://") &&
      !form.materialUrl.startsWith("https://")
    ) {
      alert("Valid URL dalo.");
      return;
    }

    if (
      (form.className === "11th" || form.className === "12th") &&
      !form.stream
    ) {
      alert("11th/12th ke liye stream select karo.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "studyMaterials"), {
        title: form.title.trim(),
        subject: form.subject.trim(),
        className: form.className,
        stream: form.stream,
        description: form.description.trim(),
        materialUrl: form.materialUrl.trim(),
        branch: branch,
        status: "Published",
        createdAt: serverTimestamp(),
      });

      const targetStudents = (await getDocs(
        query(
          collection(db, "students"),
          where("branch", "==", branch),
          where("status", "==", "approved")
        )
      )).docs
        .map((item) => ({ firestoreId: item.id, ...item.data() }))
        .filter((student) =>
          student.className === form.className &&
          (!form.stream || student.stream === form.stream)
        );

      await Promise.all(
        targetStudents
          .filter((student) => student.email)
          .map((student) =>
            sendStudentNotification({
              studentEmail: student.email,
              studentId: student.studentId || "",
              studentFirestoreId: student.firestoreId,
              studentName: student.name || "",
              branch,
              className: student.className || "",
              stream: student.stream || "",
              title: "New Study Material",
              message: `${form.title.trim()} study material available hai.`,
              type: "Study Material",
            })
          )
      );

      alert("Study material successfully publish ho gaya. ✅");

      setForm({
        title: "",
        subject: "",
        className: "9th",
        stream: "",
        description: "",
        materialUrl: "",
      });

      setShowForm(false);
      await loadMaterials();
    } catch (error) {
      console.error(error);
      alert("Study material save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMaterial = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap ye study material delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "studyMaterials", id));

      alert("Study material delete ho gaya. ✅");

      await loadMaterials();
    } catch (error) {
      console.error(error);
      alert("Delete nahi ho paya.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading study materials...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Study Materials</h2>
          <p style={styles.subtitle}>
            Branch: <strong>{branch}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? "Close" : "+ Add Material"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMaterial} style={styles.form}>
          <h3 style={styles.formTitle}>Add Study Material</h3>

          <label style={styles.label}>Material Title</label>

          <input
            type="text"
            placeholder="Example: Chapter 1 Notes"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Subject</label>

          <input
            type="text"
            placeholder="Example: Mathematics"
            value={form.subject}
            onChange={(e) =>
              setForm({
                ...form,
                subject: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Class</label>

          <select
            value={form.className}
            onChange={(e) => handleClassChange(e.target.value)}
            style={styles.input}
          >
            <option value="9th">9th</option>
            <option value="10th">10th</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>

          {(form.className === "11th" ||
            form.className === "12th") && (
            <>
              <label style={styles.label}>Stream</label>

              <select
                value={form.stream}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stream: e.target.value,
                  })
                }
                style={styles.input}
              >
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
              </select>
            </>
          )}

          <label style={styles.label}>Description</label>

          <textarea
            placeholder="Material ke baare me short description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            style={styles.textarea}
          />

          <label style={styles.label}>PDF / Notes URL</label>

          <input
            type="url"
            placeholder="Paste Google Drive PDF link"
            value={form.materialUrl}
            onChange={(e) =>
              setForm({
                ...form,
                materialUrl: e.target.value,
              })
            }
            style={styles.input}
          />

          <p style={styles.help}>
            PDF ko Google Drive me upload karo → Anyone with the link →
            Viewer → Copy link → yahan paste karo.
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Publishing..." : "Publish Material"}
          </button>
        </form>
      )}

      <div style={styles.list}>
        {materials.length === 0 ? (
          <div style={styles.empty}>
            Abhi koi study material nahi hai.
          </div>
        ) : (
          materials.map((item) => (
            <div key={item.firestoreId} style={styles.card}>
              <div>
                <h3 style={styles.cardTitle}>
                  {item.title}
                </h3>

                <p style={styles.info}>
                  <strong>Subject:</strong> {item.subject}
                </p>

                <p style={styles.info}>
                  <strong>Class:</strong> {item.className}
                  {item.stream ? ` - ${item.stream}` : ""}
                </p>

                {item.description && (
                  <p style={styles.description}>
                    {item.description}
                  </p>
                )}

                <span style={styles.status}>
                  {item.status || "Published"}
                </span>
              </div>

              <div style={styles.actions}>
                {item.materialUrl && (
                  <a
                    href={item.materialUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.viewButton}
                  >
                    Open Material ↗
                  </a>
                )}

                <button
                  onClick={() =>
                    deleteMaterial(item.firestoreId)
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
    margin: "0 0 8px",
    color: "#1e3a8a",
  },

  info: {
    margin: "5px 0",
    color: "#475569",
    fontSize: "14px",
  },

  description: {
    color: "#475569",
    margin: "10px 0",
  },

  status: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
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