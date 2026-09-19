import { useEffect, useRef, useState } from "react"

import { signOut } from "firebase/auth"

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"

import Students from "./Students"
import AdminClasses from "../components/AdminClasses"
import AdminResults from "./AdminResults"
import AdminFees from "./AdminFees"
import AdminPayments from "./AdminPayments"
import AdminNotices from "./AdminNotices"
import AdminCertificates from "./AdminCertificates"
import AdminAdmissions from "./AdminAdmissions"
import AdminSettings from "./AdminSettings"
import AdminStudyMaterials from "./AdminStudyMaterials"
import AdminStudentLocations from "./AdminStudentLocations"
import AdminNotifications from "./AdminNotifications"
import { auth, db } from "../firebase"

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard")
  const [branch, setBranch] = useState("Itimha")
  const [newEnquiries, setNewEnquiries] = useState(0)

  // NEW: Notification popup
  const [showEnquiryNotification, setShowEnquiryNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")

  // First Firestore load ko notification banne se rokne ke liye
  const firstLoad = useRef(true)

  // New Admission Enquiry count + Notification
  useEffect(() => {
    firstLoad.current = true

    const q = query(
      collection(db, "admissions"),
      where("branch", "==", branch)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.docs.filter((doc) => {
          const data = doc.data()
          const status = String(data.status || "").toLowerCase()

          return status === "new" || status === "pending"
        }).length

        setNewEnquiries(count)

        // First time data load par notification nahi dikhana
        if (firstLoad.current) {
          firstLoad.current = false
          return
        }

        // Sirf NEW admission enquiry par notification
        const addedEnquiry = snapshot.docChanges().find(
          (change) => change.type === "added"
        )

        if (addedEnquiry) {
          const data = addedEnquiry.doc.data()

          const status = String(data.status || "").toLowerCase()

          if (status === "new" || status === "pending") {
            const studentName = data.name || "New Student"

            setNotificationMessage(
              `${studentName} ne new admission enquiry submit ki hai.`
            )

            setShowEnquiryNotification(true)

            // 5 second baad popup automatically hide
            setTimeout(() => {
              setShowEnquiryNotification(false)
            }, 5000)

            // Browser notification
            if ("Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("J. Solution Classes", {
                  body: `${studentName} ne new admission enquiry submit ki hai.`,
                })
              } else if (Notification.permission === "default") {
                Notification.requestPermission()
              }
            }
          }
        }
      },
      (error) => {
        console.error("Admission notification error:", error)
      }
    )

    return () => unsubscribe()
  }, [branch])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      alert("Logout nahi ho saka.")
    }
  }

  const openAdmissionEnquiries = () => {
    setShowEnquiryNotification(false)
    setActivePage("Admission Enquiries")
  }

  const menuItems = [
    { name: "Dashboard", icon: "📊" },
    { name: "Students", icon: "👨‍🎓" },
    { name: "Classes", icon: "📚" },
    { name: "Study Materials", icon: "📖" },
    { name: "Results", icon: "📈" },
    { name: "Fees", icon: "💰" },
    { name: "Payments", icon: "💳" },
    { name: "Notices", icon: "📢" },
    { name: "Certificates", icon: "📜" },
    { name: "Student Locations", icon: "📍" },
    { name: "Send Notification", icon: "🔔" },
    {
      name: "Admission Enquiries",
      icon: "📝",
      badge: newEnquiries,
    },
    { name: "Settings", icon: "⚙️" },
  ]

  const renderPage = () => {
    if (activePage === "Students") return <Students branch={branch} />

    if (activePage === "Classes")
      return <AdminClasses branch={branch} />

    if (activePage === "Study Materials")
      return <AdminStudyMaterials branch={branch} />

    if (activePage === "Results")
      return <AdminResults branch={branch} />

    if (activePage === "Fees")
      return <AdminFees branch={branch} />

    if (activePage === "Payments")
      return <AdminPayments branch={branch} />

    if (activePage === "Notices")
      return <AdminNotices branch={branch} />

    if (activePage === "Certificates")
      return <AdminCertificates branch={branch} />

    if (activePage === "Student Locations")
      return <AdminStudentLocations branch={branch} />

    if (activePage === "Send Notification")
      return <AdminNotifications branch={branch} />

    if (activePage === "Admission Enquiries")
      return <AdminAdmissions branch={branch} />

    if (activePage === "Settings")
      return <AdminSettings branch={branch} />

    return (
      <div style={styles.dashboard}>
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeGlow} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={styles.welcomeBadge}>
              ADMIN PANEL
            </div>

            <h1>Welcome, Admin 👋</h1>

            <p>
              Manage your J. Solution Classes — {branch} Branch
            </p>
          </div>

          <div
            style={{
              ...styles.branchBox,
              position: "relative",
              zIndex: 1,
            }}
          >
            <label>Branch</label>

            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={styles.select}
            >
              <option value="Itimha">Itimha</option>
              <option value="Bardiha">Bardiha</option>
            </select>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👨‍🎓</div>

            <div>
              <p>Total Students</p>
              <h2>0</h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>

            <div>
              <p>Results</p>
              <h2>0</h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>

            <div>
              <p>Fees</p>
              <h2>0</h2>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              cursor: newEnquiries > 0 ? "pointer" : "default",
            }}
            onClick={openAdmissionEnquiries}
          >
            <div style={styles.statIcon}>📝</div>

            <div style={{ position: "relative" }}>
              <p>New Enquiries</p>

              <h2>{newEnquiries}</h2>

              {newEnquiries > 0 && (
                <span style={styles.statBadge}>
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.quickCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2>Quick Actions</h2>

              <p>Frequently used admin controls</p>
            </div>

            {newEnquiries > 0 && (
              <button
                onClick={openAdmissionEnquiries}
                style={styles.enquiryAlert}
              >
                🔔 {newEnquiries} New Enquiry
                {newEnquiries > 1 ? "ies" : ""}
              </button>
            )}
          </div>

          <div style={styles.quickGrid}>
            <button
              onClick={() => setActivePage("Students")}
              style={styles.quickButton}
            >
              <span>👨‍🎓</span>
              <span>Manage Students</span>
            </button>

            <button
              onClick={() => setActivePage("Results")}
              style={styles.quickButton}
            >
              <span>📈</span>
              <span>Manage Results</span>
            </button>

            <button
              onClick={() => setActivePage("Fees")}
              style={styles.quickButton}
            >
              <span>💰</span>
              <span>Manage Fees</span>
            </button>

            <button
              onClick={() => setActivePage("Payments")}
              style={styles.quickButton}
            >
              <span>💳</span>
              <span>Payments</span>
            </button>

            <button
              onClick={() => setActivePage("Notices")}
              style={styles.quickButton}
            >
              <span>📢</span>
              <span>Manage Notices</span>
            </button>

            <button
              onClick={() => setActivePage("Certificates")}
              style={styles.quickButton}
            >
              <span>📜</span>
              <span>Certificates</span>
            </button>

            <button
              onClick={() => setActivePage("Study Materials")}
              style={styles.quickButton}
            >
              <span>📖</span>
              <span>Study Materials</span>
            </button>

            <button
              onClick={() => setActivePage("Student Locations")}
              style={styles.quickButton}
            >
              <span>📍</span>
              <span>Student Locations</span>
            </button>

            <button
              onClick={() => setActivePage("Send Notification")}
              style={styles.notificationButton}
            >
              <span>🔔</span>
              <span>Send Notification</span>
            </button>

            <button
              onClick={openAdmissionEnquiries}
              style={styles.enquiryButton}
            >
              <span>📝</span>

              <span>
                Admission Enquiries
              </span>

              {newEnquiries > 0 && (
                <span style={styles.buttonBadge}>
                  {newEnquiries}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.app}>

      {/* ============================= */}
      {/* NEW ADMISSION NOTIFICATION */}
      {/* ============================= */}

      {showEnquiryNotification && (
        <div style={styles.notificationPopup}>
          <div style={styles.notificationIcon}>
            🔔
          </div>

          <div style={styles.notificationContent}>
            <strong>
              New Admission Enquiry
            </strong>

            <p>
              {notificationMessage}
            </p>

            <button
              onClick={openAdmissionEnquiries}
              style={styles.notificationViewButton}
            >
              View Enquiry
            </button>
          </div>

          <button
            onClick={() => setShowEnquiryNotification(false)}
            style={styles.notificationClose}
          >
            ✕
          </button>
        </div>
      )}

      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>JS</div>

          <div>
            <h2>J. Solution</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <div style={styles.branchSelector}>
          <label>Current Branch</label>

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={styles.sidebarSelect}
          >
            <option value="Itimha">Itimha</option>
            <option value="Bardiha">Bardiha</option>
          </select>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              style={{
                ...styles.navItem,
                ...(activePage === item.name
                  ? styles.activeNavItem
                  : {}),
              }}
            >
              <span style={styles.navIcon}>
                {item.icon}
              </span>

              <span style={{ flex: 1 }}>
                {item.name}
              </span>

              {item.badge > 0 && (
                <span style={styles.navBadge}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.adminInfo}>
            <div style={styles.avatar}>A</div>

            <div>
              <strong>Admin</strong>

              <small>Administrator</small>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h3>{activePage}</h3>

            <p>
              J. Solution Classes • {branch}
            </p>
          </div>

          <div style={styles.headerRight}>
            <button
              onClick={openAdmissionEnquiries}
              style={styles.headerNotification}
              title="Admission Enquiries"
            >
              🔔

              {newEnquiries > 0 && (
                <span style={styles.headerBadge}>
                  {newEnquiries}
                </span>
              )}
            </button>

            <div style={styles.headerBranch}>
              <span>🏫</span>
              <span>Branch:</span>
              <strong>{branch}</strong>
            </div>

            <button
              onClick={handleLogout}
              style={styles.headerLogout}
            >
              🚪 Logout
            </button>
          </div>
        </header>

        <section style={styles.content}>
          {renderPage()}
        </section>
      </main>
    </div>
  )
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100vw",
    overflowX: "hidden",
    background: "#f5f7fb",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  },

  /* NEW NOTIFICATION POPUP */
  notificationPopup: {
    position: "fixed",
    top: "22px",
    right: "25px",
    zIndex: 9999,
    width: "360px",
    maxWidth: "calc(100vw - 40px)",
    background: "#ffffff",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    boxShadow: "0 15px 40px rgba(20,40,80,0.18)",
    boxSizing: "border-box",
  },

  notificationIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationContentStrong: {
    color: "#172033",
  },

  notificationContentP: {
    margin: "5px 0 10px",
    color: "#687386",
    fontSize: "13px",
    lineHeight: 1.4,
  },

  notificationViewButton: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "750",
    cursor: "pointer",
    fontSize: "12px",
  },

  notificationClose: {
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "16px",
    padding: "2px",
  },

  sidebar: {
    width: "270px",
    minWidth: "270px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
    borderRight: "1px solid #e6eaf0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    boxShadow:
      "8px 0 30px rgba(30, 50, 90, 0.04)",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "22px 20px",
    borderBottom: "1px solid #edf0f4",
  },

  logo: {
    width: "48px",
    height: "48px",
    minWidth: "48px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #d32f2f, #ef5350)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "18px",
    boxShadow:
      "0 8px 18px rgba(211,47,47,0.20)",
  },

  "logoArea h2": {
    margin: 0,
    color: "#173f91",
    fontSize: "20px",
    fontWeight: "800",
  },

  "logoArea p": {
    margin: "3px 0 0",
    color: "#8a94a6",
    fontSize: "12px",
  },

  branchSelector: {
    padding: "18px 20px",
    background: "#f8faff",
    borderBottom: "1px solid #edf0f4",
  },

  "branchSelector label": {
    display: "block",
    fontSize: "11px",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#7b8494",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  },

  sidebarSelect: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #dfe5ef",
    background: "#fff",
    fontWeight: "700",
    color: "#25324a",
    boxSizing: "border-box",
    outline: "none",
    cursor: "pointer",
  },

  nav: {
    padding: "14px 12px",
    boxSizing: "border-box",
  },

  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    marginBottom: "5px",
    border: "1px solid transparent",
    borderRadius: "11px",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#586174",
    fontSize: "14px",
    fontWeight: "650",
    boxSizing: "border-box",
    transition:
      "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
  },

  activeNavItem: {
    background: "#fff0f1",
    color: "#c62828",
    border: "1px solid #ffd8da",
    boxShadow:
      "0 5px 15px rgba(211,47,47,0.07)",
  },

  navIcon: {
    width: "24px",
    minWidth: "24px",
    fontSize: "18px",
    textAlign: "center",
  },

  navBadge: {
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "900",
  },

  sidebarBottom: {
    marginTop: "auto",
    padding: "16px",
    borderTop: "1px solid #edf0f4",
    background: "#fff",
  },

  adminInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    borderRadius: "12px",
    background: "#f8faff",
  },

  avatar: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #1976d2, #42a5f5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    boxShadow:
      "0 6px 14px rgba(25,118,210,0.18)",
  },

  "adminInfo strong": {
    color: "#25324a",
  },

  "adminInfo small": {
    display: "block",
    color: "#8a94a6",
    marginTop: "2px",
    fontSize: "11px",
  },

  logoutButton: {
    width: "100%",
    marginTop: "12px",
    padding: "11px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fff5f5",
    color: "#c62828",
    cursor: "pointer",
    fontWeight: "750",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  },

  main: {
    marginLeft: "270px",
    width: "calc(100% - 270px)",
    minWidth: 0,
    maxWidth: "calc(100% - 270px)",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  header: {
    minHeight: "74px",
    width: "100%",
    background: "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #e9edf3",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "12px 28px",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  "header h3": {
    margin: 0,
    fontSize: "21px",
    color: "#172033",
    fontWeight: "800",
  },

  "header p": {
    margin: "4px 0 0",
    color: "#8a94a6",
    fontSize: "12px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  headerNotification: {
    position: "relative",
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#c62828",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    minWidth: "20px",
    height: "20px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#fff",
    border: "2px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "900",
  },

  headerBranch: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#f3f7ff",
    color: "#54709d",
    fontSize: "12px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    border: "1px solid #e1eaff",
  },

  headerLogout: {
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#c62828",
    padding: "10px 13px",
    borderRadius: "10px",
    fontWeight: "750",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  content: {
    width: "100%",
    maxWidth: "100%",
    padding: "28px",
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  dashboard: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    boxSizing: "border-box",
  },

  welcomeCard: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%)",
    borderRadius: "20px",
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxSizing: "border-box",
    boxShadow:
      "0 12px 35px rgba(20,40,80,0.07)",
    border: "1px solid #e6ecf7",
  },

  welcomeGlow: {
    position: "absolute",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "rgba(25,118,210,0.08)",
    right: "-70px",
    top: "-80px",
  },

  welcomeBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    background: "#ffebee",
    color: "#c62828",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  "welcomeCard h1": {
    margin: 0,
    color: "#172033",
    fontSize: "28px",
    fontWeight: "850",
  },

  "welcomeCard p": {
    margin: "8px 0 0",
    color: "#687386",
    fontSize: "14px",
  },

  branchBox: {
    minWidth: "180px",
    maxWidth: "220px",
  },

  "branchBox label": {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#7b8494",
    marginBottom: "6px",
  },

  select: {
    width: "100%",
    padding: "11px",
    borderRadius: "10px",
    border: "1px solid #d8e0ed",
    boxSizing: "border-box",
    background: "#fff",
    color: "#25324a",
    fontWeight: "700",
    outline: "none",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginTop: "22px",
    width: "100%",
  },

  statCard: {
    minWidth: 0,
    background: "#fff",
    border: "1px solid #edf0f5",
    borderRadius: "16px",
    padding: "21px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxSizing: "border-box",
    boxShadow:
      "0 8px 24px rgba(20,40,80,0.06)",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    minWidth: "48px",
    borderRadius: "13px",
    background: "#f3f7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  "statCard p": {
    margin: 0,
    color: "#7b8494",
    fontSize: "12px",
    fontWeight: "650",
  },

  "statCard h2": {
    margin: "5px 0 0",
    color: "#172033",
    fontSize: "25px",
    fontWeight: "850",
  },

  statBadge: {
    position: "absolute",
    marginTop: "5px",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "900",
  },

  quickCard: {
    width: "100%",
    background: "#fff",
    borderRadius: "18px",
    padding: "25px",
    marginTop: "22px",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 30px rgba(20,40,80,0.06)",
    border: "1px solid #edf0f5",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  "quickCard h2": {
    margin: 0,
    color: "#172033",
    fontSize: "19px",
  },

  "quickCard p": {
    margin: "5px 0 0",
    color: "#8a94a6",
    fontSize: "12px",
  },

  enquiryAlert: {
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#b91c1c",
    padding: "9px 13px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "12px",
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    width: "100%",
  },

  quickButton: {
    width: "100%",
    minWidth: 0,
    padding: "16px",
    border: "1px solid #e5eaf2",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    color: "#3e4a60",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    transition: "all 0.2s ease",
  },

  notificationButton: {
    width: "100%",
    minWidth: 0,
    padding: "16px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #d32f2f, #e53935)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "750",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
    boxShadow:
      "0 8px 18px rgba(211,47,47,0.18)",
  },

  enquiryButton: {
    position: "relative",
    width: "100%",
    minWidth: 0,
    padding: "16px",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
    fontWeight: "750",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
  },

  buttonBadge: {
    marginLeft: "auto",
    minWidth: "24px",
    height: "24px",
    padding: "0 7px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "900",
  },
}