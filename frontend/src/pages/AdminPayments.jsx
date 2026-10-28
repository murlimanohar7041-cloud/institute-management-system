
import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "../firebase";

export default function AdminPayments({ branch }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(collection(db, "payments"));

      const data = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((payment) => {
          if (!branch || branch === "All Branches") return true;
          return payment.branch === branch;
        })
        .sort((a, b) => {
          const dateA =
            a.createdAt?.toDate?.()?.getTime?.() ||
            new Date(a.date || 0).getTime() ||
            0;
          const dateB =
            b.createdAt?.toDate?.()?.getTime?.() ||
            new Date(b.date || 0).getTime() ||
            0;
          return dateB - dateA;
        });

      setPayments(data);
    } catch (err) {
      console.error(err);
      setError("Payments load nahi hue. Firebase connection aur rules check karein.");
    } finally {
      setLoading(false);
    }
  }, [branch]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const approvePayment = async (payment) => {
    if (payment.status === "Approved") {
      setError("Yeh payment pehle se Approved hai.");
      return;
    }

    if (payment.status === "Rejected") {
      setError("Rejected payment ko approve nahi kiya ja sakta.");
      return;
    }

    const confirmed = window.confirm(
      `Kya aap ₹${Number(payment.amount || 0)} ke payment ko approve kar chuke hain? Pehle bank/UPI transaction verify karein.`
    );

    if (!confirmed) return;

    try {
      setProcessingId(payment.id);
      setError("");
      setSuccess("");

      await updateDoc(doc(db, "payments", payment.id), {
        status: "Approved",
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess("Payment Approved. Receipt ab show aur download ki ja sakti hai.");
      await loadPayments();
    } catch (err) {
      console.error(err);
      setError("Payment update nahi hua. Firebase rules check karein.");
    } finally {
      setProcessingId("");
    }
  };

  const rejectPayment = async (payment) => {
    if (payment.status === "Approved") {
      setError("Approved payment ko Reject nahi kar sakte.");
      return;
    }

    const reason = window.prompt("Payment reject karne ka reason likhein:");
    if (reason === null) return;

    try {
      setProcessingId(payment.id);
      setError("");
      setSuccess("");

      await updateDoc(doc(db, "payments", payment.id), {
        status: "Rejected",
        rejectionReason: reason.trim() || "Payment verify nahi ho saka.",
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess("Payment Reject kar diya gaya.");
      await loadPayments();
    } catch (err) {
      console.error(err);
      setError("Payment reject nahi hua. Firebase rules check karein.");
    } finally {
      setProcessingId("");
    }
  };

  const getPaymentDate = (payment) => {
    if (payment.verifiedAt?.toDate) {
      return payment.verifiedAt.toDate().toLocaleString("en-IN");
    }

    if (payment.createdAt?.toDate) {
      return payment.createdAt.toDate().toLocaleString("en-IN");
    }

    return payment.date || "N/A";
  };

  const downloadReceipt = (payment) => {
    if (payment.status !== "Approved") {
      alert("Receipt sirf Approved payment ke liye available hai.");
      return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    const receiptNo = String(payment.id || "N/A").slice(0, 24).toUpperCase();
    const amount = Number(payment.amount || 0);

    pdf.setFillColor(29, 78, 216);
    pdf.rect(0, 0, pageWidth, 48, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("J. SOLUTION CLASSES", margin, 19);

    pdf.setFontSize(11);
    pdf.text("OFFICIAL FEE PAYMENT RECEIPT", margin, 29);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Payment Confirmation", margin, 37);

    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(pageWidth - 53, 13, 35, 10, 3, 3, "F");
    pdf.setTextColor(22, 101, 52);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("APPROVED", pageWidth - 35.5, 19.5, { align: "center" });

    let y = 62;

    const addSectionTitle = (title) => {
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
      pdf.setTextColor(29, 78, 216);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(title, margin + 4, y + 6.5);
      y += 18;
    };

    const addRow = (label, value) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(label, margin + 2, y);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);

      const valueLines = pdf.splitTextToSize(
        String(value || "N/A"),
        contentWidth - 55
      );

      pdf.text(valueLines, margin + 53, y);

      y += Math.max(10, valueLines.length * 5 + 3);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y - 4, pageWidth - margin, y - 4);
    };

    addSectionTitle("RECEIPT DETAILS");
    addRow("Receipt Number", receiptNo);
    addRow("Payment Date", getPaymentDate(payment));

    addSectionTitle("STUDENT DETAILS");
    addRow("Student Name", payment.studentName);
    addRow("Email Address", payment.studentEmail);
    addRow("Class", payment.className);
    addRow("Branch", payment.branch);

    addSectionTitle("PAYMENT DETAILS");
    addRow("Payment Method", payment.upiId ? "UPI" : payment.method || "N/A");
    addRow("Transaction / UTR", payment.utr || "N/A");
    addRow("Status", "APPROVED");

    y += 4;

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(187, 247, 208);
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "FD");

    pdf.setTextColor(22, 101, 52);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("TOTAL AMOUNT PAID", margin + 6, y + 10);

    pdf.setFontSize(20);
    pdf.text(`INR ${amount.toLocaleString("en-IN")}`, margin + 6, y + 21);

    y += 40;

    if (y > 265) {
      pdf.addPage();
      y = 30;
    }

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, pageWidth - margin, y);

    y += 9;
    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Thank you!", pageWidth / 2, y, { align: "center" });

    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "This receipt represents a payment marked as Approved in the institute system.",
      pageWidth / 2,
      y,
      { align: "center", maxWidth: contentWidth }
    );

    pdf.save(`J-Solution-Receipt-${receiptNo}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus =
      statusFilter === "All" || payment.status === statusFilter;

    const text = search.toLowerCase().trim();

    const matchesSearch =
      !text ||
      (payment.studentName || "").toLowerCase().includes(text) ||
      (payment.studentEmail || "").toLowerCase().includes(text) ||
      (payment.utr || "").toLowerCase().includes(text) ||
      (payment.className || "").toLowerCase().includes(text);

    return matchesStatus && matchesSearch;
  });

  const pendingPayments = payments.filter(
    (payment) => payment.status === "Pending Verification"
  );

  const approvedPayments = payments.filter(
    (payment) => payment.status === "Approved"
  );

  const pendingTotal = pendingPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const approvedTotal = approvedPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .receipt-print-area, .receipt-print-area * {
            visibility: visible !important;
          }
          .receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800">
          Payment Management
        </h1>
        <p className="text-gray-600 mt-1">
          Student payments verify karein aur receipt show/download karein.
        </p>
      </div>

      {error && (
        <div className="no-print rounded-lg bg-red-50 border border-red-200 text-red-700 p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="no-print rounded-lg bg-green-50 border border-green-200 text-green-700 p-3">
          {success}
        </div>
      )}

      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Payment Requests</p>
          <h2 className="text-3xl font-bold text-blue-700 mt-2">
            {payments.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-5">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-2">
            {pendingPayments.length}
          </h2>
          <p className="text-sm text-gray-500">
            ₹{pendingTotal.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-5">
          <p className="text-sm text-gray-500">Approved Payments</p>
          <h2 className="text-3xl font-bold text-green-700 mt-2">
            ₹{approvedTotal.toLocaleString("en-IN")}
          </h2>
          <p className="text-sm text-gray-500">
            {approvedPayments.length} approved
          </p>
        </div>
      </div>

      <div className="no-print flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Student name, email ya UTR search karein..."
          className="flex-1 border rounded-lg px-4 py-3"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border rounded-lg px-4 py-3 bg-white"
        >
          <option value="All">All Payments</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button
          onClick={loadPayments}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 py-3"
        >
          Refresh
        </button>
      </div>

      <div className="no-print overflow-x-auto bg-white border rounded-xl shadow-sm">
        {loading ? (
          <p className="p-8 text-center">Payments load ho rahe hain...</p>
        ) : filteredPayments.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Koi payment nahi mila.</p>
        ) : (
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-blue-50 text-blue-900">
              <tr>
                <th className="text-left p-4">Student</th>
                <th className="text-left p-4">Class / Branch</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">UTR</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <strong>{payment.studentName || "Unknown Student"}</strong>
                    <div className="text-xs text-gray-500">
                      {payment.studentEmail || "No email"}
                    </div>
                  </td>
                  <td className="p-4">
                    {payment.className || "N/A"}
                    <div className="text-xs text-gray-500">
                      {payment.branch || "N/A"}
                    </div>
                  </td>
                  <td className="p-4 font-bold">
                    ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 break-all">{payment.utr || "N/A"}</td>
                  <td className="p-4">{getPaymentDate(payment)}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        payment.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {payment.status || "Pending Verification"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {payment.status === "Pending Verification" && (
                        <>
                          <button
                            onClick={() => approvePayment(payment)}
                            disabled={processingId === payment.id}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectPayment(payment)}
                            disabled={processingId === payment.id}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {payment.status === "Approved" && (
                        <button
                          onClick={() => setSelectedReceipt(payment)}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-3xl mx-auto my-4 sm:my-8">
            <div className="no-print flex justify-end gap-3 mb-3">
              <button
                onClick={() => downloadReceipt(selectedReceipt)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-semibold shadow"
              >
                Download PDF
              </button>
              <button
                onClick={printReceipt}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold shadow"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-white text-gray-800 px-4 py-3 rounded-lg font-semibold shadow"
              >
                Close
              </button>
            </div>

            <div className="receipt-print-area bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide">
                      J. SOLUTION CLASSES
                    </h2>
                    <p className="mt-2 text-blue-100">
                      Official Fee Payment Receipt
                    </p>
                  </div>
                  <div className="self-start bg-green-100 text-green-800 rounded-full px-4 py-2 text-sm font-bold">
                    ✓ PAYMENT APPROVED
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-blue-600 font-bold">
                      Receipt Number
                    </p>
                    <p className="font-bold text-gray-800 mt-2 break-all">
                      {selectedReceipt.id}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                      Payment Date
                    </p>
                    <p className="font-semibold text-gray-800 mt-2">
                      {getPaymentDate(selectedReceipt)}
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-3">
                  Student Information
                </h3>

                <div className="border rounded-xl divide-y mb-7">
                  {[
                    ["Student Name", selectedReceipt.studentName],
                    ["Email Address", selectedReceipt.studentEmail],
                    ["Class", selectedReceipt.className],
                    ["Branch", selectedReceipt.branch],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-2 gap-3 p-4"
                    >
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-900 font-semibold break-words">
                        {value || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-3">
                  Payment Information
                </h3>

                <div className="border rounded-xl divide-y mb-7">
                  {[
                    ["Payment Method", selectedReceipt.upiId ? "UPI" : selectedReceipt.method || "N/A"],
                    ["UTR / Transaction ID", selectedReceipt.utr],
                    ["Payment Status", selectedReceipt.status],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-2 gap-3 p-4"
                    >
                      <span className="text-gray-500">{label}</span>
                      <span className="text-gray-900 font-semibold break-words">
                        {value || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <p className="text-green-800 text-sm font-bold uppercase tracking-wide">
                      Total Amount Paid
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Verified payment amount
                    </p>
                  </div>
                  <p className="text-3xl font-extrabold text-green-700">
                    ₹{Number(selectedReceipt.amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="text-center border-t mt-8 pt-6 text-gray-500 text-sm">
                  <p className="font-bold text-gray-700">
                    Thank you for your payment!
                  </p>
                  <p className="mt-2">
                    Please keep this receipt for your records.
                  </p>
                  <p className="mt-1 text-xs">
                    This receipt represents a payment marked as Approved in the institute system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
