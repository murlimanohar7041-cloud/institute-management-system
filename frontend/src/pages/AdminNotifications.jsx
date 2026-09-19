import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

export default function AdminNotifications({ branch }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    targetType: "branch",
    studentEmail: "",
    title: "",
    message: "",
    type: "General",
  })

  useEffect(() => {
    loadStudents()
  }, [branch])

  const loadStudents = async () => {
    try {
      setLoading(true)

      const q = query(
        collection(db, "students"),
        where("branch", "==", branch)
      )

      const snapshot = await getDocs(q)

      const list = snapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter(
          (student) =>
            String(student.status || "").toLowerCase() === "approved"
        )
        .sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        )

      setStudents(list)
    } catch (err) {
      console.error("Load Students Error:", err)
      setError("Students load nahi ho rahe hain.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSuccess("")
    setError("")
  }

  const handleSend = async (e) => {
    e.preventDefault()

    setSuccess("")
    setError("")

    if (!form.title.trim()) {
      setError("Notification title likhiye.")
      return
    }

    if (!form.message.trim()) {
      setError("Notification message likhiye.")
      return
    }

    if (form.targetType === "student" && !form.studentEmail) {
      setError("Student select kijiye.")
      return
    }

    try {
      setSending(true)

      const selectedStudent =
        students.find(
          (student) =>
            String(student.email || "").toLowerCase() ===
            String(form.studentEmail || "").toLowerCase()
        ) || null

      const notificationData = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        branch,
        status: "Published",
        read: false,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString(),
        targetType: form.targetType,
        targetEmail:
          form.targetType === "student" ? form.studentEmail : null,
      }

      if (form.targetType === "student" && selectedStudent) {
        notificationData.studentId = selectedStudent.studentId || ""
        notificationData.studentName = selectedStudent.name || ""
      }

      if (form.targetType === "student") {
        await addDoc(collection(db, "notifications"), {
          ...notificationData,
          studentEmail: String(form.studentEmail).toLowerCase(),
          targetEmail: null,
        })
      } else {
        const targetStudents = students.filter(
          (student) => student.email
        )

        await Promise.all(
          targetStudents.map((student) =>
            addDoc(collection(db, "notifications"), {
              ...notificationData,
              studentEmail: String(student.email).toLowerCase(),
              studentId: student.studentId || "",
              studentFirestoreId: student.firestoreId || "",
              studentName: student.name || "",
              className: student.className || "",
              stream: student.stream || "",
              targetEmail: null,
            })
          )
        )
      }

      setSuccess(
        form.targetType === "branch"
          ? `Notification ${branch} ke approved students ko bhej diya gaya.`
          : `Notification ${selectedStudent?.name || "student"} ko bhej diya gaya.`
      )

      setForm({
        targetType: form.targetType,
        studentEmail: "",
        title: "",
        message: "",
        type: "General",
      })
    } catch (err) {
      console.error("Send Notification Error:", err)

      setError(
        err.code === "permission-denied"
          ? "Permission denied. Firestore Rules me notifications read/write allow karein."
          : "Notification send nahi ho paya."
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>🔔 Send Notification</h2>
          <p style={styles.subheading}>
            Students ko important messages directly bhejiye.
          </p>
        </div>

        <div style={styles.branchBadge}>{branch}</div>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSend}>
          <label style={styles.label}>Send To</label>

          <div style={styles.radioRow}>
            <label style={styles.radioBox}>
              <input
                type="radio"
                name="targetType"
                value="branch"
                checked={form.targetType === "branch"}
                onChange={handleChange}
              />
              <span>👥 All Students of {branch}</span>
            </label>

            <label style={styles.radioBox}>
              <input
                type="radio"
                name="targetType"
                value="student"
                checked={form.targetType === "student"}
                onChange={handleChange}
              />
              <span>👤 Specific Student</span>
            </label>
          </div>

          {form.targetType === "student" && (
            <>
              <label style={styles.label}>Select Student</label>

              <select
                name="studentEmail"
                value={form.studentEmail}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">-- Select Student --</option>

                {students.map((student) => (
                  <option key={student.firestoreId} value={student.email}>
                    {student.name} — {student.studentId} — {student.email}
                  </option>
                ))}
              </select>

              {loading && (
                <p style={styles.smallText}>Students load ho rahe hain...</p>
              )}
            </>
          )}

          <label style={styles.label}>Notification Type</label>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="General">General</option>
            <option value="Important">Important</option>
            <option value="Notice">Notice</option>
            <option value="Result">Result</option>
            <option value="Study Material">Study Material</option>
            <option value="Fees">Fees</option>
            <option value="Certificate">Certificate</option>
          </select>

          <label style={styles.label}>Title</label>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: Important Notice"
            style={styles.input}
          />

          <label style={styles.label}>Message</label>

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Message yahan likhiye..."
            rows="6"
            style={styles.textarea}
          />

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <button
            type="submit"
            disabled={sending}
            style={{
              ...styles.button,
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? "Sending..." : "🔔 Send Notification"}
          </button>
        </form>
      </div>

      <div style={styles.infoCard}>
        <strong>How it works</strong>
        <p>
          Admin notification ke saath-saath Student Dashboard Results,
          Notices, Study Materials, Certificates aur Payments me koi naya
          update hone par bhi student ko notification mil sakta hai.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  heading: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "800",
    color: "#111827",
  },

  subheading: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  branchBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxSizing: "border-box",
    width: "100%",
  },

  label: {
    display: "block",
    margin: "16px 0 7px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#374151",
  },

  radioRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
  },

  radioBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    padding: "12px",
    cursor: "pointer",
    fontSize: "13px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "12px",
    fontSize: "13px",
    outline: "none",
    background: "#ffffff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "12px",
    fontSize: "13px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  smallText: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "11px",
  },

  error: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    fontSize: "13px",
  },

  success: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "9px",
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    fontSize: "13px",
  },

  button: {
    marginTop: "20px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    padding: "13px 18px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  infoCard: {
    marginTop: "16px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
    padding: "16px",
    color: "#1e3a8a",
    fontSize: "13px",
    lineHeight: "1.6",
  },
}
