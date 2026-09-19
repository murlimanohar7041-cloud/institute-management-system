import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../firebase"

export default function AdminStudentNotifications({ branch }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, "adminNotifications"),
      where("branch", "==", branch)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((item) => {
            const data = item.data()
            return {
              id: item.id,
              ...data,
              createdAt: data.createdAt?.toMillis
                ? data.createdAt.toMillis()
                : data.createdAt?.seconds
                  ? data.createdAt.seconds * 1000
                  : Date.now(),
            }
          })
          .sort((a, b) => b.createdAt - a.createdAt)

        setNotifications(list)
        setLoading(false)
      },
      (error) => {
        console.error("Admin notifications error:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [branch])

  const formatTime = (time) => {
    if (!time) return ""
    return new Date(time).toLocaleString()
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🔔 Student Notifications</h2>
          <p style={styles.subtitle}>
            Student se aane wali notifications — {branch} Branch
          </p>
        </div>
        <div style={styles.liveBadge}>● LIVE</div>
      </div>

      {loading ? (
        <div style={styles.empty}>Notifications load ho rahi hain...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>Abhi koi student notification nahi hai.</div>
      ) : (
        <div style={styles.list}>
          {notifications.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.icon}>🔔</div>
              <div style={styles.content}>
                <div style={styles.topRow}>
                  <h3 style={styles.notificationTitle}>{item.title}</h3>
                  <span style={styles.type}>{item.type || "General"}</span>
                </div>
                <p style={styles.message}>{item.message}</p>
                <div style={styles.meta}>
                  <strong>{item.studentName || "Student"}</strong>
                  {item.studentId ? ` • ${item.studentId}` : ""}
                  {item.studentEmail ? ` • ${item.studentEmail}` : ""}
                  <br />
                  {formatTime(item.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 20 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 800 },
  subtitle: { margin: "6px 0 0", color: "#6b7280" },
  liveBadge: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
  },
  list: { display: "grid", gap: 12 },
  card: {
    display: "flex",
    gap: 14,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#fee2e2",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontSize: 21,
  },
  content: { flex: 1 },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  notificationTitle: { margin: 0, fontSize: 17 },
  type: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  message: { margin: "8px 0", color: "#374151", lineHeight: 1.5 },
  meta: { color: "#6b7280", fontSize: 12, lineHeight: 1.6 },
  empty: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
  },
}
