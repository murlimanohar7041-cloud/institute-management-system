import { useState } from "react"
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

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard")
  const [branch, setBranch] = useState("Itimha")

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
    { name: "Admission Enquiries", icon: "📝" },
    { name: "Settings", icon: "⚙️" },
  ]

  const renderPage = () => {
    if (activePage === "Students") return <Students branch={branch} />
    if (activePage === "Classes") return <AdminClasses branch={branch} />
    if (activePage === "Study Materials") return <AdminStudyMaterials branch={branch} />
    if (activePage === "Results") return <AdminResults branch={branch} />
    if (activePage === "Fees") return <AdminFees branch={branch} />
    if (activePage === "Payments") return <AdminPayments branch={branch} />
    if (activePage === "Notices") return <AdminNotices branch={branch} />
    if (activePage === "Certificates") return <AdminCertificates branch={branch} />
    if (activePage === "Student Locations") return <AdminStudentLocations branch={branch} />
    if (activePage === "Send Notification") return <AdminNotifications branch={branch} />
    if (activePage === "Admission Enquiries") return <AdminAdmissions branch={branch} />
    if (activePage === "Settings") return <AdminSettings branch={branch} />

    return (
      <div style={styles.dashboard}>
        <div style={styles.welcomeCard}>
          <div>
            <h1>Welcome, Admin 👋</h1>
            <p>Manage your J. Solution Classes — {branch} Branch</p>
          </div>

          <div style={styles.branchBox}>
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

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📢</div>
            <div>
              <p>Notices</p>
              <h2>0</h2>
            </div>
          </div>
        </div>

        <div style={styles.quickCard}>
          <h2>Quick Actions</h2>

          <div style={styles.quickGrid}>
            <button
              onClick={() => setActivePage("Students")}
              style={styles.quickButton}
            >
              👨‍🎓 Manage Students
            </button>

            <button
              onClick={() => setActivePage("Results")}
              style={styles.quickButton}
            >
              📈 Manage Results
            </button>

            <button
              onClick={() => setActivePage("Fees")}
              style={styles.quickButton}
            >
              💰 Manage Fees
            </button>

            <button
              onClick={() => setActivePage("Payments")}
              style={styles.quickButton}
            >
              💳 Payments
            </button>

            <button
              onClick={() => setActivePage("Notices")}
              style={styles.quickButton}
            >
              📢 Manage Notices
            </button>

            <button
              onClick={() => setActivePage("Certificates")}
              style={styles.quickButton}
            >
              📜 Certificates
            </button>

            <button
              onClick={() => setActivePage("Study Materials")}
              style={styles.quickButton}
            >
              📖 Study Materials
            </button>

            <button
              onClick={() => setActivePage("Student Locations")}
              style={styles.quickButton}
            >
              📍 Student Locations
            </button>

            <button
              onClick={() => setActivePage("Send Notification")}
              style={styles.notificationButton}
            >
              🔔 Send Notification
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.app}>
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
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.name}</span>
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
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h3>{activePage}</h3>
            <p>J. Solution Classes • {branch}</p>
          </div>

          <div style={styles.headerBranch}>
            <span>Branch:</span>
            <strong>{branch}</strong>
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
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    width: "260px",
    minWidth: "260px",
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "22px 20px",
    borderBottom: "1px solid #eee",
  },

  logo: {
    width: "45px",
    height: "45px",
    minWidth: "45px",
    borderRadius: "12px",
    background: "#d32f2f",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
  },

  "logoArea h2": {
    margin: 0,
    color: "#c62828",
    fontSize: "20px",
  },

  "logoArea p": {
    margin: "3px 0 0",
    color: "#777",
    fontSize: "12px",
  },

  branchSelector: {
    padding: "18px 20px",
    background: "#fff7f7",
    borderBottom: "1px solid #eee",
  },

  "branchSelector label": {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "7px",
    color: "#777",
  },

  sidebarSelect: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "#fff",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  nav: {
    padding: "12px",
    boxSizing: "border-box",
  },

  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    marginBottom: "5px",
    border: "none",
    borderRadius: "9px",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#555",
    fontSize: "14px",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  activeNavItem: {
    background: "#ffebee",
    color: "#c62828",
  },

  navIcon: {
    width: "24px",
    minWidth: "24px",
    fontSize: "18px",
  },

  sidebarBottom: {
    marginTop: "auto",
    padding: "15px",
    borderTop: "1px solid #eee",
  },

  adminInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    background: "#1976d2",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  "adminInfo small": {
    display: "block",
    color: "#888",
    marginTop: "2px",
  },

  main: {
    marginLeft: "260px",
    width: "calc(100% - 260px)",
    minWidth: 0,
    maxWidth: "calc(100% - 260px)",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  header: {
    height: "70px",
    width: "100%",
    background: "#fff",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  "header h3": {
    margin: 0,
    fontSize: "20px",
    color: "#222",
  },

  "header p": {
    margin: "4px 0 0",
    color: "#888",
    fontSize: "12px",
  },

  headerBranch: {
    padding: "9px 14px",
    borderRadius: "8px",
    background: "#f5f8ff",
    color: "#1976d2",
    fontSize: "13px",
    whiteSpace: "nowrap",
    flexShrink: 0,
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
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxSizing: "border-box",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  "welcomeCard h1": {
    margin: 0,
    color: "#222",
  },

  "welcomeCard p": {
    margin: "8px 0 0",
    color: "#777",
  },

  branchBox: {
    minWidth: "180px",
    maxWidth: "220px",
  },

  "branchBox label": {
    display: "block",
    fontSize: "12px",
    color: "#777",
    marginBottom: "6px",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginTop: "22px",
    width: "100%",
  },

  statCard: {
    minWidth: 0,
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxSizing: "border-box",
    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
  },

  statIcon: {
    fontSize: "30px",
    flexShrink: 0,
  },

  "statCard p": {
    margin: 0,
    color: "#777",
    fontSize: "13px",
  },

  "statCard h2": {
    margin: "5px 0 0",
    color: "#222",
  },

  quickCard: {
    width: "100%",
    background: "#fff",
    borderRadius: "16px",
    padding: "25px",
    marginTop: "22px",
    boxSizing: "border-box",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  "quickCard h2": {
    marginTop: 0,
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    width: "100%",
  },

  quickButton: {
    width: "100%",
    minWidth: 0,
    padding: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    color: "#444",
    boxSizing: "border-box",
  },

  notificationButton: {
    width: "100%",
    minWidth: 0,
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: "#d32f2f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    boxSizing: "border-box",
  },
}