import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

function AdminPayments({ branch }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // =========================
  // LOAD PAYMENTS
  // =========================
  const loadPayments = async () => {
    try {
      setLoading(true);

      const paymentsRef = collection(db, "payments");

      const q = query(
        paymentsRef,
        where("branch", "==", branch)
      );

      const snapshot = await getDocs(q);

      const paymentList = snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      paymentList.sort((a, b) => {
        const dateA = a.createdAt?.seconds
          ? a.createdAt.seconds
          : new Date(a.date || 0).getTime() / 1000;

        const dateB = b.createdAt?.seconds
          ? b.createdAt.seconds
          : new Date(b.date || 0).getTime() / 1000;

        return dateB - dateA;
      });

      setPayments(paymentList);
    } catch (error) {
      console.error("Payment loading error:", error);
      alert("Payments load nahi ho pa rahe hain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branch) {
      loadPayments();
    }
  }, [branch]);

  // =========================
  // APPROVE / REJECT PAYMENT
  // =========================
  const updatePaymentStatus = async (payment, newStatus) => {
    try {
      setProcessingId(payment.firestoreId);

      const verificationTime = new Date().toISOString();

      await updateDoc(
        doc(db, "payments", payment.firestoreId),
        {
          status: newStatus,
          verifiedAt: verificationTime,
        }
      );

      setPayments((prev) =>
        prev.map((item) =>
          item.firestoreId === payment.firestoreId
            ? {
                ...item,
                status: newStatus,
                verifiedAt: verificationTime,
              }
            : item
        )
      );

      alert(
        newStatus === "Approved"
          ? "Payment successfully approved."
          : "Payment rejected."
      );
    } catch (error) {
      console.error("Payment update error:", error);
      alert("Payment status update nahi ho paya.");
    } finally {
      setProcessingId("");
    }
  };

  // =========================
  // SEARCH + FILTER
  // =========================
  const filteredPayments = payments.filter((payment) => {
    const statusMatch =
      filter === "All" || payment.status === filter;

    const searchText = search.toLowerCase().trim();

    const searchMatch =
      !searchText ||
      String(payment.studentName || "")
        .toLowerCase()
        .includes(searchText) ||
      String(payment.studentEmail || "")
        .toLowerCase()
        .includes(searchText) ||
      String(payment.utr || "")
        .toLowerCase()
        .includes(searchText) ||
      String(payment.studentId || "")
        .toLowerCase()
        .includes(searchText) ||
      String(payment.paymentId || "")
        .toLowerCase()
        .includes(searchText);

    return statusMatch && searchMatch;
  });

  // =========================
  // COUNTS
  // =========================
  const pendingCount = payments.filter(
    (item) => item.status === "Pending Verification"
  ).length;

  const approvedCount = payments.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = payments.filter(
    (item) => item.status === "Rejected"
  ).length;

  const totalApprovedAmount = payments
    .filter((item) => item.status === "Approved")
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

  // =========================
  // DATE FORMAT
  // =========================
  const formatDate = (payment) => {
    try {
      if (payment.date) {
        return new Date(payment.date).toLocaleString("en-IN");
      }

      if (payment.createdAt?.seconds) {
        return new Date(
          payment.createdAt.seconds * 1000
        ).toLocaleString("en-IN");
      }

      return "-";
    } catch {
      return "-";
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Payment Management
          </h1>

          <p style={styles.subtitle}>
            {branch} Branch • Student payment verification
          </p>
        </div>

        <button
          onClick={loadPayments}
          style={styles.refreshButton}
        >
          🔄 Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div style={styles.statsGrid}>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💳</div>

          <div>
            <p style={styles.statLabel}>
              Total Payments
            </p>

            <h2 style={styles.statNumber}>
              {payments.length}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>

          <div>
            <p style={styles.statLabel}>
              Pending
            </p>

            <h2 style={styles.statNumber}>
              {pendingCount}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>

          <div>
            <p style={styles.statLabel}>
              Approved
            </p>

            <h2 style={styles.statNumber}>
              {approvedCount}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>

          <div>
            <p style={styles.statLabel}>
              Rejected
            </p>

            <h2 style={styles.statNumber}>
              {rejectedCount}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>

          <div>
            <p style={styles.statLabel}>
              Approved Amount
            </p>

            <h2 style={styles.statNumber}>
              ₹{totalApprovedAmount}
            </h2>
          </div>
        </div>

      </div>

      {/* SEARCH + FILTER */}
      <div style={styles.toolbar}>

        <input
          type="text"
          placeholder="Search student, Gmail, UTR, Student ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.select}
        >
          <option value="All">
            All Payments
          </option>

          <option value="Pending Verification">
            Pending Verification
          </option>

          <option value="Approved">
            Approved
          </option>

          <option value="Rejected">
            Rejected
          </option>
        </select>

      </div>

      {/* LOADING */}
      {loading ? (
        <div style={styles.messageBox}>
          <div style={styles.loadingIcon}>
            ⏳
          </div>

          <h3>
            Loading payments...
          </h3>

          <p>
            Please wait.
          </p>
        </div>

      ) : filteredPayments.length === 0 ? (

        /* EMPTY */
        <div style={styles.messageBox}>
          <div style={styles.emptyIcon}>
            📭
          </div>

          <h3>
            No payments found
          </h3>

          <p>
            Is branch ke liye abhi koi payment record nahi mila.
          </p>
        </div>

      ) : (

        /* TABLE */
        <div style={styles.tableWrapper}>

          <table style={styles.table}>

            <thead>
              <tr>
                <th style={styles.th}>
                  Student
                </th>

                <th style={styles.th}>
                  Class
                </th>

                <th style={styles.th}>
                  Amount
                </th>

                <th style={styles.th}>
                  UTR / Transaction ID
                </th>

                <th style={styles.th}>
                  UPI ID
                </th>

                <th style={styles.th}>
                  Date
                </th>

                <th style={styles.th}>
                  Status
                </th>

                <th style={styles.th}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredPayments.map((payment) => (

                <tr key={payment.firestoreId}>

                  {/* STUDENT */}
                  <td style={styles.td}>

                    <strong style={styles.studentName}>
                      {payment.studentName ||
                        "Unknown Student"}
                    </strong>

                    <br />

                    <span style={styles.email}>
                      {payment.studentEmail || "-"}
                    </span>

                    <br />

                    <span style={styles.studentId}>
                      ID: {payment.studentId || "-"}
                    </span>

                  </td>

                  {/* CLASS */}
                  <td style={styles.td}>

                    {payment.className || "-"}

                    {payment.stream && (
                      <>
                        <br />

                        <span style={styles.smallText}>
                          {payment.stream}
                        </span>
                      </>
                    )}

                  </td>

                  {/* AMOUNT */}
                  <td style={styles.td}>

                    <strong style={styles.amount}>
                      ₹{Number(payment.amount || 0)}
                    </strong>

                  </td>

                  {/* UTR */}
                  <td style={styles.td}>

                    <span style={styles.utr}>
                      {payment.utr ||
                        "Not provided"}
                    </span>

                  </td>

                  {/* UPI */}
                  <td style={styles.td}>
                    {payment.upiId || "-"}
                  </td>

                  {/* DATE */}
                  <td style={styles.td}>
                    {formatDate(payment)}
                  </td>

                  {/* STATUS */}
                  <td style={styles.td}>

                    <span
                      style={{
                        ...styles.status,

                        ...(payment.status ===
                        "Approved"
                          ? styles.approved
                          : payment.status ===
                            "Rejected"
                          ? styles.rejected
                          : styles.pending),
                      }}
                    >
                      {payment.status ||
                        "Pending Verification"}
                    </span>

                  </td>

                  {/* ACTION */}
                  <td style={styles.td}>

                    {payment.status ===
                    "Pending Verification" ? (

                      <div style={styles.actionButtons}>

                        <button
                          disabled={
                            processingId ===
                            payment.firestoreId
                          }
                          onClick={() =>
                            updatePaymentStatus(
                              payment,
                              "Approved"
                            )
                          }
                          style={{
                            ...styles.approveButton,
                            opacity:
                              processingId ===
                              payment.firestoreId
                                ? 0.6
                                : 1,
                          }}
                        >
                          {processingId ===
                          payment.firestoreId
                            ? "Processing..."
                            : "✓ Approve"}
                        </button>

                        <button
                          disabled={
                            processingId ===
                            payment.firestoreId
                          }
                          onClick={() =>
                            updatePaymentStatus(
                              payment,
                              "Rejected"
                            )
                          }
                          style={{
                            ...styles.rejectButton,
                            opacity:
                              processingId ===
                              payment.firestoreId
                                ? 0.6
                                : 1,
                          }}
                        >
                          ✕ Reject
                        </button>

                      </div>

                    ) : (

                      <span
                        style={{
                          ...styles.doneText,
                          color:
                            payment.status ===
                            "Approved"
                              ? "#15803d"
                              : "#dc2626",
                        }}
                      >
                        {payment.status ===
                        "Approved"
                          ? "✓ Verified"
                          : "✕ Rejected"}
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {

  container: {
    padding: "25px",
    background: "#f8fafc",
    minHeight: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "15px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: "6px",
    color: "#64748b",
    marginBottom: 0,
  },

  refreshButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "25px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  statIcon: {
    fontSize: "28px",
  },

  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  statNumber: {
    margin: "4px 0 0",
    color: "#0f172a",
    fontSize: "24px",
  },

  toolbar: {
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.04)",
  },

  searchInput: {
    flex: 1,
    minWidth: "280px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },

  select: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  },

  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    overflowX: "auto",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.06)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1150px",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "13px",
    borderBottom:
      "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderBottom:
      "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "top",
  },

  studentName: {
    color: "#0f172a",
  },

  email: {
    fontSize: "12px",
    color: "#64748b",
  },

  studentId: {
    fontSize: "12px",
    color: "#2563eb",
  },

  smallText: {
    fontSize: "12px",
    color: "#64748b",
  },

  amount: {
    color: "#15803d",
    fontSize: "16px",
  },

  utr: {
    display: "inline-block",
    fontWeight: "600",
    color: "#0f172a",
    background: "#f1f5f9",
    padding: "5px 8px",
    borderRadius: "5px",
    maxWidth: "180px",
    wordBreak: "break-word",
  },

  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },

  approved: {
    background: "#dcfce7",
    color: "#166534",
  },

  rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  actionButtons: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },

  approveButton: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    padding: "8px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  rejectButton: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    padding: "8px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  doneText: {
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  messageBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "50px 20px",
    textAlign: "center",
    color: "#64748b",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.04)",
  },

  loadingIcon: {
    fontSize: "35px",
  },

  emptyIcon: {
    fontSize: "40px",
  },
};

export default AdminPayments;