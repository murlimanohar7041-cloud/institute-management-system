import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const OLD_FACULTY_EMAIL = "mdey9006690@gmail.com";

const emptyForm = {
  name: "",
  email: "",
  branches: "Itimha",
  subject: "",
  status: "active",
};

export default function FacultyManagement() {
  const [facultyList, setFacultyList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingEmail, setEditingEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFaculty = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "faculty"));

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      data.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );

      setFacultyList(data);
    } catch (error) {
      console.error("Faculty loading error:", error);
      alert("Faculty list load nahi ho saki.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingEmail(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const subject = form.subject.trim();

    if (!name || !email || !subject) {
      alert("Name, Gmail aur Subject bharna zaroori hai.");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      alert("Sirf Gmail address enter karein.");
      return;
    }

    try {
      setSaving(true);

      // New document ID = lowercase Gmail
      const facultyRef = doc(db, "faculty", email);

      if (editingEmail && editingEmail !== email) {
        const oldRef = doc(db, "faculty", editingEmail);

        await setDoc(facultyRef, {
          name,
          email,
          branches: form.branches,
          subject,
          status: form.status,
          updatedAt: serverTimestamp(),
        });

        await deleteDoc(oldRef);
      } else if (editingEmail) {
        await updateDoc(facultyRef, {
          name,
          email,
          branches: form.branches,
          subject,
          status: form.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        const existing = facultyList.find(
          (faculty) =>
            faculty.email?.toLowerCase() === email
        );

        if (existing) {
          alert("Ye faculty Gmail already registered hai.");
          return;
        }

        await setDoc(facultyRef, {
          name,
          email,
          branches: form.branches,
          subject,
          status: form.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      alert(
        editingEmail
          ? "Faculty details update ho gayi."
          : "Faculty successfully add ho gayi."
      );

      resetForm();
      await loadFaculty();
    } catch (error) {
      console.error("Faculty save error:", error);
      alert("Faculty save nahi ho saki.\n\n" + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faculty) => {
    setEditingEmail(faculty.email?.toLowerCase());

    setForm({
      name: faculty.name || "",
      email: faculty.email || "",
      branches: faculty.branches || [faculty.branch || "Itimha"],
      subject: faculty.subject || "",
      status: faculty.status || "active",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleStatus = async (faculty) => {
    const newStatus =
      faculty.status === "active" ? "disabled" : "active";

    try {
      await updateDoc(doc(db, "faculty", faculty.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await loadFaculty();

      alert(
        newStatus === "active"
          ? "Faculty account enable kar diya gaya."
          : "Faculty account disable kar diya gaya."
      );
    } catch (error) {
      console.error("Status update error:", error);
      alert("Faculty status update nahi ho saka.");
    }
  };

  const handleDelete = async (faculty) => {
    const email = faculty.email?.toLowerCase();

    if (email === OLD_FACULTY_EMAIL) {
      alert(
        "Existing faculty account ko delete nahi kiya ja sakta."
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Kya aap "${faculty.name}" ko permanently delete karna chahte hain?`
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "faculty", faculty.id));

      await loadFaculty();

      alert("Faculty successfully delete ho gayi.");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Faculty delete nahi ho saki.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Faculty Management</h1>
          <p style={styles.subtitle}>
            Faculty accounts ko add, edit aur manage karein.
          </p>
        </div>

        <div style={styles.countBox}>
          <strong>{facultyList.length}</strong>
          <span>Total Faculty</span>
        </div>
      </div>

      {/* FORM */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2>
            {editingEmail ? "Edit Faculty" : "Add New Faculty"}
          </h2>

          {editingEmail && (
            <button
              type="button"
              onClick={resetForm}
              style={styles.cancelButton}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Faculty Name</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter faculty name"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Gmail Address</label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Branch</label>

              <div>
  <label style={styles.label}>Branches</label>

  <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="checkbox"
        checked={form.branches?.includes("Itimha") || false}
        onChange={(e) => {
          const currentBranches = form.branches || [];

          setForm({
            ...form,
            branches: e.target.checked
              ? [...new Set([...currentBranches, "Itimha"])]
              : currentBranches.filter((branch) => branch !== "Itimha"),
          });
        }}
      />
      Itimha
    </label>

    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="checkbox"
        checked={form.branches?.includes("Bardiha") || false}
        onChange={(e) => {
          const currentBranches = form.branches || [];

          setForm({
            ...form,
            branches: e.target.checked
              ? [...new Set([...currentBranches, "Bardiha"])]
              : currentBranches.filter((branch) => branch !== "Bardiha"),
          });
        }}
      />
      Bardiha
    </label>
  </div>
</div>
            </div>

            <div>
              <label style={styles.label}>Subject</label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : editingEmail
              ? "Update Faculty"
              : "Add Faculty"}
          </button>
        </form>
      </div>

      {/* FACULTY LIST */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2>Faculty List</h2>
        </div>

        {loading ? (
          <div style={styles.empty}>
            Loading faculty...
          </div>
        ) : facultyList.length === 0 ? (
          <div style={styles.empty}>
            Abhi koi faculty add nahi hai.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Gmail</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {facultyList.map((faculty) => {
                  const isOldFaculty =
                    faculty.email?.toLowerCase() ===
                    OLD_FACULTY_EMAIL;

                  return (
                    <tr key={faculty.id}>
                      <td style={styles.td}>
                        <strong>
                          {faculty.name || "-"}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {faculty.email || "-"}
                      </td>

                      <td style={styles.td}>
                            {faculty.branches?.join(", ") || faculty.branch || "-"}
                      </td>

                      <td style={styles.td}>
                        {faculty.subject || "-"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            faculty.status === "active"
                              ? styles.activeBadge
                              : styles.disabledBadge
                          }
                        >
                          {faculty.status === "active"
                            ? "Active"
                            : "Disabled"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            onClick={() =>
                              handleEdit(faculty)
                            }
                            style={styles.editButton}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              toggleStatus(faculty)
                            }
                            style={styles.statusButton}
                          >
                            {faculty.status === "active"
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(faculty)
                            }
                            disabled={isOldFaculty}
                            style={{
                              ...styles.deleteButton,
                              opacity: isOldFaculty
                                ? 0.45
                                : 1,
                              cursor: isOldFaculty
                                ? "not-allowed"
                                : "pointer",
                            }}
                            title={
                              isOldFaculty
                                ? "Existing faculty account protected"
                                : "Delete faculty"
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f7f9fc",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    color: "#123a72",
    fontSize: "28px",
  },

  subtitle: {
    marginTop: "7px",
    color: "#667085",
  },

  countBox: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "12px",
    padding: "12px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "100px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "24px",
    border: "1px solid #e4e7ec",
    boxShadow: "0 3px 12px rgba(16,24,40,0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "600",
    color: "#344054",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  saveButton: {
    marginTop: "22px",
    padding: "11px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#1769e0",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "9px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  th: {
    textAlign: "left",
    padding: "13px",
    background: "#f2f4f7",
    color: "#344054",
    fontSize: "14px",
    borderBottom: "1px solid #e4e7ec",
  },

  td: {
    padding: "13px",
    borderBottom: "1px solid #eaecf0",
    color: "#475467",
    fontSize: "14px",
  },

  activeBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    background: "#dcfae6",
    color: "#067647",
    fontSize: "12px",
    fontWeight: "600",
  },

  disabledBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "20px",
    background: "#fee4e2",
    color: "#b42318",
    fontSize: "12px",
    fontWeight: "600",
  },

  actions: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  editButton: {
    padding: "7px 11px",
    border: "none",
    borderRadius: "6px",
    background: "#1769e0",
    color: "#fff",
    cursor: "pointer",
  },

  statusButton: {
    padding: "7px 11px",
    border: "none",
    borderRadius: "6px",
    background: "#f79009",
    color: "#fff",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "7px 11px",
    border: "none",
    borderRadius: "6px",
    background: "#d92d20",
    color: "#fff",
  },

  empty: {
    textAlign: "center",
    padding: "35px",
    color: "#667085",
  },
};