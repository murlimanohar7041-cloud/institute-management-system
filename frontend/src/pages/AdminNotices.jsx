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

function AdminNotices({ branch = "Itimha" }) {
  const [notices, setNotices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    className: "All",
    stream: "All",
  });

  // ================= LOAD NOTICES =================
  const loadNotices = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "notices"),
        where("branch", "==", branch)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setNotices(data);
    } catch (error) {
      console.error("Notice loading error:", error);
      alert("Notice load nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD STUDENTS =================
  const loadStudents = async () => {
    try {
      const q = query(
        collection(db, "students"),
        where("branch", "==", branch),
        where("status", "==", "approved")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      setStudents(data);
    } catch (error) {
      console.error("Student loading error:", error);
    }
  };

  useEffect(() => {
    loadNotices();
    loadStudents();
  }, [branch]);

  // ================= ADD NOTICE =================
  const addNotice = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Notice title likho.");
      return;
    }

    if (!form.message.trim()) {
      alert("Notice message likho.");
      return;
    }

    try {
      setSaving(true);

      // 1. Save notice
      await addDoc(collection(db, "notices"), {
        title: form.title.trim(),
        message: form.message.trim(),
        className: form.className,
        stream: form.stream,
        branch: branch,
        status: "Published",
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
      });

      // 2. Automatic notification
      const targetStudents = students.filter((student) => {
        const classMatch =
          form.className === "All" ||
          student.className === form.className ||
          student.class === form.className;

        const streamMatch =
          form.stream === "All" ||
          student.stream === form.stream;

        return classMatch && streamMatch;
      });

      for (const student of targetStudents) {
        if (!student.email) continue;

        await addDoc(collection(db, "notifications"), {
          title: "New Notice",
          message: form.title.trim(),

          type: "Notice",
          branch: branch,

          targetType: "student",
          targetEmail: null,
          studentEmail: String(student.email).toLowerCase(),

          studentId:
            student.studentId ||
            student.generatedId ||
            student.id ||
            "",

          studentFirestoreId: student.firestoreId,
          studentName: student.name || "",

          className:
            student.className ||
            student.class ||
            "",

          stream: student.stream || "",

          status: "Published",
          read: false,

          createdAt: serverTimestamp(),
          date: new Date().toLocaleDateString(),
        });
      }

      alert(
        targetStudents.length > 0
          ? "Notice publish ho gaya aur students ko notification bhej diya gaya."
          : "Notice publish ho gaya."
      );

      setForm({
        title: "",
        message: "",
        className: "All",
        stream: "All",
      });

      setShowForm(false);

      await loadNotices();
    } catch (error) {
      console.error("Add notice error:", error);
      alert("Notice publish nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE NOTICE =================
  const deleteNotice = async (id) => {
    const confirmDelete = window.confirm(
      "Kya aap is notice ko delete karna chahte hain?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "notices", id));

      setNotices((prev) => prev.filter((item) => item.id !== id));

      alert("Notice delete ho gaya.");
    } catch (error) {
      console.error("Delete notice error:", error);
      alert("Notice delete nahi ho saka.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Notices</h1>
          <p style={styles.subHeading}>
            {branch} Branch • Notice Management
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Close" : "+ Add Notice"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <form onSubmit={addNotice} style={styles.formCard}>
          <h2 style={styles.formTitle}>Publish New Notice</h2>

          <label style={styles.label}>Notice Title</label>
          <input
            type="text"
            placeholder="Enter notice title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.label}>Notice Message</label>
          <textarea
            placeholder="Enter notice details..."
            value={form.message}
            onChange={(e) =>
              setForm({
                ...form,
                message: e.target.value,
              })
            }
            rows="5"
            style={styles.textarea}
          />

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Class</label>

              <select
                value={form.className}
                onChange={(e) =>
                  setForm({
                    ...form,
                    className: e.target.value,
                  })
                }
                style={styles.input}
              >
                <option value="All">All Classes</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
            </div>

            <div style={styles.field}>
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
                disabled={
                  form.className !== "All" &&
                  form.className !== "11th" &&
                  form.className !== "12th"
                }
              >
                <option value="All">All Streams</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
          </div>

          <div style={styles.infoBox}>
            🔔 Notice publish hone ke baad matching students ko automatic
            <b> "New Notice"</b> notification milega.
          </div>

          <button
            type="submit"
            disabled={saving}
            style={styles.publishButton}
          >
            {saving ? "Publishing..." : "Publish Notice"}
          </button>
        </form>
      )}

      {/* ================= NOTICE LIST ================= */}
      <div style={styles.listCard}>
        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>Published Notices</h2>

          <span style={styles.count}>
            {notices.length} Notice{notices.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading notices...</div>
        ) : notices.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📢</div>
            <h3>No Notices Yet</h3>
            <p>Abhi tak koi notice publish nahi hua hai.</p>
          </div>
        ) : (
          <div>
            {notices.map((notice) => (
              <div key={notice.id} style={styles.noticeCard}>
                <div style={styles.noticeTop}>
                  <div>
                    <h3 style={styles.noticeTitle}>
                      {notice.title ||
                        notice.noticeTitle ||
                        notice.heading ||
                        "Notice"}
                    </h3>

                    <div style={styles.meta}>
                      📅 {notice.date || "Date not available"}
                      {"  "}•{"  "}
                      🏫 {notice.branch || branch}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteNotice(notice.id)}
                    style={styles.deleteButton}
                  >
                    🗑 Delete
                  </button>
                </div>

                <p style={styles.message}>
                  {notice.message ||
                    notice.description ||
                    notice.content ||
                    notice.notice ||
                    notice.text ||
                    ""}
                </p>

                <div style={styles.tags}>
                  <span style={styles.tag}>
                    Class: {notice.className || "All"}
                  </span>

                  {(notice.stream || "All") !== "All" && (
                    <span style={styles.tag}>
                      Stream: {notice.stream}
                    </span>
                  )}

                  <span style={styles.publishedTag}>
                    ✓ Published
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "10px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  heading: {
    margin: 0,
    fontSize: "30px",
    color: "#0f3d91",
    fontWeight: "800",
  },

  subHeading: {
    margin: "6px 0 0",
    color: "#666",
    fontSize: "14px",
  },

  addButton: {
    border: "none",
    background: "#e31e24",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  formCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
  },

  formTitle: {
    marginTop: 0,
    color: "#0f3d91",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "700",
    color: "#333",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    marginBottom: "18px",
    boxSizing: "border-box",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    marginBottom: "18px",
    boxSizing: "border-box",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "inherit",
  },

  row: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },

  field: {
    flex: 1,
    minWidth: "220px",
  },

  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    padding: "13px",
    borderRadius: "9px",
    marginBottom: "18px",
    fontSize: "14px",
  },

  publishButton: {
    border: "none",
    background: "#0f3d91",
    color: "white",
    padding: "13px 24px",
    borderRadius: "9px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  listCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  listTitle: {
    margin: 0,
    color: "#222",
  },

  count: {
    background: "#eef2ff",
    color: "#0f3d91",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  noticeCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "18px",
    marginBottom: "15px",
    background: "#fff",
  },

  noticeTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  noticeTitle: {
    margin: "0 0 7px",
    color: "#0f3d91",
    fontSize: "19px",
  },

  meta: {
    color: "#777",
    fontSize: "13px",
  },

  message: {
    color: "#444",
    lineHeight: "1.6",
    margin: "15px 0",
    whiteSpace: "pre-wrap",
  },

  tags: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  tag: {
    background: "#f3f4f6",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "600",
  },

  publishedTag: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "700",
  },

  deleteButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  empty: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#777",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },
};

export default AdminNotices;