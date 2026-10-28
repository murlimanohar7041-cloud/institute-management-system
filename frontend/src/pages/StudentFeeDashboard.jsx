import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "../firebase";

export default function StudentFeeDashboard({ student }) {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");

  useEffect(() => {
    const email = (student?.email || "").toLowerCase().trim();

    if (!email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    let feesLoaded = false;
    let paymentsLoaded = false;

    const checkLoaded = () => {
      if (feesLoaded && paymentsLoaded) {
        setLoading(false);
      }
    };

    const feesQuery = query(
      collection(db, "fees"),
      where("studentEmail", "==", email)
    );

    const paymentsQuery = query(
      collection(db, "payments"),
      where("studentEmail", "==", email)
    );

    const unsubscribeFees = onSnapshot(
      feesQuery,
      (snapshot) => {
        const records = snapshot.docs
          .map((item) => ({
            firestoreId: item.id,
            ...item.data(),
          }))
          .filter(
            (fee) =>
              !student?.branch || fee.branch === student.branch
          );

        setFees(records);
        feesLoaded = true;
        checkLoaded();
      },
      (err) => {
        console.error("Student fees error:", err);
        setError("Fee records load nahi ho paaye.");
        feesLoaded = true;
        checkLoaded();
      }
    );

    const unsubscribePayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const records = snapshot.docs
          .map((item) => ({
            firestoreId: item.id,
            ...item.data(),
          }))
          .filter(
            (payment) =>
              !student?.branch ||
              payment.branch === student.branch
          )
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

        setPayments(records);
        paymentsLoaded = true;
        checkLoaded();
      },
      (err) => {
        console.error("Student payments error:", err);
        setError("Payment history load nahi ho paayi.");
        paymentsLoaded = true;
        checkLoaded();
      }
    );

    return () => {
      unsubscribeFees();
      unsubscribePayments();
    };
  }, [student?.email, student?.branch]);

  const approvedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "Approved"),
    [payments]
  );

  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (payment) => payment.status === "Pending Verification"
      ),
    [payments]
  );

  const rejectedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "Rejected"),
    [payments]
  );

  const totalFees = useMemo(
    () =>
      fees.reduce(
        (total, fee) => total + Math.max(0, Number(fee.amount || 0)),
        0
      ),
    [fees]
  );

  const totalPaid = useMemo(() => {
    const approvedPaymentTotal = approvedPayments.reduce(
      (total, payment) =>
        total + Math.max(0, Number(payment.amount || 0)),
      0
    );

    // Older fee records may already contain paidAmount.
    // Use those values only when there are no approved payment records.
    if (approvedPayments.length === 0) {
      return fees.reduce((total, fee) => {
        if (fee.paidAmount !== undefined) {
          return total + Math.max(0, Number(fee.paidAmount || 0));
        }

        if (fee.status === "Paid") {
          return total + Math.max(0, Number(fee.amount || 0));
        }

        return total;
      }, 0);
    }

    return approvedPaymentTotal;
  }, [approvedPayments, fees]);

  const remainingDue = Math.max(0, totalFees - totalPaid);

  const pendingAmount = pendingPayments.reduce(
    (total, payment) =>
      total + Math.max(0, Number(payment.amount || 0)),
    0
  );

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (item) => {
    if (item.verifiedAt?.toDate) {
      return item.verifiedAt.toDate().toLocaleString("en-IN");
    }

    if (item.createdAt?.toDate) {
      return item.createdAt.toDate().toLocaleString("en-IN");
    }

    if (item.date) {
      const date = new Date(item.date);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString("en-IN");
      }

      return item.date;
    }

    return "N/A";
  };

  const getStatusStyle = (status) => {
    if (status === "Approved" || status === "Paid") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-orange-100 text-orange-700";
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

    const receiptNumber = String(payment.firestoreId || "RECEIPT")
      .slice(0, 24)
      .toUpperCase();

    const amount = Number(payment.amount || 0);

    pdf.setFillColor(29, 78, 216);
    pdf.rect(0, 0, pageWidth, 48, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.text("J. SOLUTION CLASSES", margin, 19);

    pdf.setFontSize(11);
    pdf.text("OFFICIAL FEE PAYMENT RECEIPT", margin, 29);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Student Copy", margin, 37);

    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(pageWidth - 52, 13, 34, 10, 3, 3, "F");

    pdf.setTextColor(22, 101, 52);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("APPROVED", pageWidth - 35, 19.5, {
      align: "center",
    });

    let y = 63;

    const addSection = (title) => {
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

      pdf.setTextColor(29, 78, 216);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
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

      const lines = pdf.splitTextToSize(
        String(value || "N/A"),
        contentWidth - 55
      );

      pdf.text(lines, margin + 53, y);

      y += Math.max(10, lines.length * 5 + 3);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y - 4, pageWidth - margin, y - 4);
    };

    addSection("RECEIPT DETAILS");
    addRow("Receipt Number", receiptNumber);
    addRow("Payment Date", formatDate(payment));

    addSection("STUDENT INFORMATION");
    addRow("Student Name", payment.studentName || student?.name);
    addRow("Student Email", payment.studentEmail || student?.email);
    addRow("Class", payment.className || student?.className);
    addRow("Branch", payment.branch || student?.branch);

    addSection("PAYMENT INFORMATION");
    addRow(
      "Payment Method",
      payment.upiId ? "UPI" : payment.method || "N/A"
    );
    addRow("Transaction / UTR", payment.utr || "N/A");
    addRow("Payment Status", "APPROVED");

    y += 5;

    if (y > 245) {
      pdf.addPage();
      y = 30;
    }

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(187, 247, 208);
    pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "FD");

    pdf.setTextColor(22, 101, 52);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("TOTAL AMOUNT PAID", margin + 6, y + 10);

    pdf.setFontSize(20);
    pdf.text(
      `INR ${amount.toLocaleString("en-IN")}`,
      margin + 6,
      y + 21
    );

    y += 43;

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, pageWidth - margin, y);

    y += 9;
    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Thank you for your payment!", pageWidth / 2, y, {
      align: "center",
    });

    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      "This receipt is for a payment recorded as Approved.",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    pdf.save(`J-Solution-Receipt-${receiptNumber}.pdf`);
  };

  return (<section className="mx-auto my-4 w-full max-w-7xl min-w-0 space-y-4 overflow-hidden px-3 sm:my-6 sm:space-y-6 sm:px-5 lg:px-8">
    
     <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 p-4 text-white shadow-lg sm:rounded-3xl sm:p-7 lg:p-8">
        <p className="text-sm font-semibold text-blue-100">
          J. Solution Classes
        </p>

       <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          My Fee Dashboard
        </h2>

        <p className="mt-2 text-sm text-blue-100">
          Apni fees, payment history aur pending dues yahan dekhein.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-lg bg-white/15 px-3 py-2">
            {student?.className || "Class not available"}
            {student?.stream ? ` — ${student.stream}` : ""}
          </span>

          <span className="rounded-lg bg-white/15 px-3 py-2">
            {student?.branch || "Branch not available"}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Recorded Fees
          </p>

          <p className="mt-2 break-words text-2xl font-extrabold sm:mt-3 sm:text-3xl text-blue-700">
            {formatMoney(totalFees)}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Admin ke fee records ke hisaab se
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Total Paid
          </p>

          <p className="mt-2 break-words text-2xl font-extrabold sm:mt-3 sm:text-3xl text-green-700">
            {formatMoney(totalPaid)}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Approved payments
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Remaining Due
          </p>

          <p className="mt-2 break-words text-2xl font-extrabold sm:mt-3 sm:text-3xl text-red-600">
            {formatMoney(remainingDue)}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Recorded fees minus paid amount
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Pending Verification
          </p>

          <p className="mt-2 break-words text-2xl font-extrabold sm:mt-3 sm:text-3xl text-orange-600">
            {formatMoney(pendingAmount)}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {pendingPayments.length} payment request(s)
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 bg-gray-50/70 p-3 sm:flex sm:gap-3 sm:p-4">
          <button
            onClick={() => setActiveTab("payments")}
           className={`min-w-0 rounded-xl px-2 py-3 text-xs font-bold transition-colors sm:px-5 sm:text-sm ${
              activeTab === "payments"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Payment History
          </button>

          <button
            onClick={() => setActiveTab("fees")}
            className={`min-w-0 rounded-xl px-2 py-3 text-xs font-bold transition-colors sm:px-5 sm:text-sm ${
              activeTab === "fees"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Fee Records
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Fee details load ho rahi hain...
          </div>
        ) : activeTab === "payments" ? (
          payments.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">💳</div>

              <h3 className="mt-3 font-bold text-gray-800">
                No Payment History
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Payment submit karne ke baad uski details yahan dikhegi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-blue-50 text-blue-900">
                  <tr>
                    <th className="px-4 py-4">Payment Date</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Method</th>
                    <th className="px-4 py-4">UTR / Transaction ID</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Receipt</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr
                      key={payment.firestoreId}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {formatDate(payment)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-extrabold text-gray-900">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="px-4 py-4">
                        {payment.upiId
                          ? "UPI"
                          : payment.method || "N/A"}
                      </td>

                      <td className="max-w-[180px] break-all px-4 py-4 text-gray-600">
                        {payment.utr || "N/A"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                            payment.status
                          )}`}
                        >
                          {payment.status || "Pending Verification"}
                        </span>

                        {payment.rejectionReason && (
                          <p className="mt-1 max-w-[180px] text-xs text-red-600">
                            {payment.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {payment.status === "Approved" ? (
                          <button
                            onClick={() => setSelectedReceipt(payment)}
                            className="whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800"
                          >
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Available after approval
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : fees.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📚</div>

            <h3 className="mt-3 font-bold text-gray-800">
              No Fee Records
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Admin ke fee records add karne ke baad yahan dikhenge.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-blue-50 text-blue-900">
                <tr>
                  <th className="px-4 py-4">Fee Record</th>
                  <th className="px-4 py-4">Period</th>
                  <th className="px-4 py-4">Assigned Amount</th>
                  <th className="px-4 py-4">Paid in Record</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {fees.map((fee) => (
                  <tr
                    key={fee.firestoreId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 font-semibold text-blue-700">
                      {fee.feeId || fee.firestoreId}
                    </td>

                    <td className="px-4 py-4">
                      {fee.periodKey ||
                        fee.month ||
                        fee.year ||
                        "N/A"}
                    </td>

                    <td className="px-4 py-4 font-bold">
                      {formatMoney(fee.amount)}
                    </td>

                    <td className="px-4 py-4 font-semibold text-green-700">
                      {formatMoney(
                        fee.paidAmount !== undefined
                          ? fee.paidAmount
                          : fee.status === "Paid"
                          ? fee.amount
                          : 0
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                          fee.status
                        )}`}
                      >
                        {fee.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
          <div className="mx-auto my-4 max-w-3xl">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => downloadReceipt(selectedReceipt)}
                className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white shadow hover:bg-blue-800"
              >
                Download PDF
              </button>

              <button
                onClick={() => window.print()}
                className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow hover:bg-green-700"
              >
                Print
              </button>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="rounded-xl bg-white px-4 py-3 font-bold text-gray-800 shadow"
              >
                Close
              </button>
            </div>

            <div className="receipt-preview overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="bg-gradient-to-r from-blue-900 to-blue-600 p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                  J. Solution Classes
                </p>

                <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                  Fee Payment Receipt
                </h2>

                <div className="mt-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">
                  ✓ PAYMENT APPROVED
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase text-blue-600">
                      Receipt Number
                    </p>

                    <p className="mt-2 break-all font-extrabold text-gray-900">
                      {selectedReceipt.firestoreId}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-gray-500">
                      Payment Date
                    </p>

                    <p className="mt-2 font-bold text-gray-900">
                      {formatDate(selectedReceipt)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-extrabold text-gray-900">
                    Student Information
                  </h3>

                  <div className="divide-y rounded-xl border">
                    {[
                      [
                        "Student Name",
                        selectedReceipt.studentName || student?.name,
                      ],
                      [
                        "Email",
                        selectedReceipt.studentEmail || student?.email,
                      ],
                      [
                        "Class",
                        selectedReceipt.className || student?.className,
                      ],
                      [
                        "Branch",
                        selectedReceipt.branch || student?.branch,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-2 gap-3 p-4"
                      >
                        <span className="text-sm text-gray-500">
                          {label}
                        </span>

                        <span className="break-words text-sm font-bold text-gray-900">
                          {value || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-extrabold text-gray-900">
                    Payment Information
                  </h3>

                  <div className="divide-y rounded-xl border">
                    {[
                      [
                        "Payment Method",
                        selectedReceipt.upiId
                          ? "UPI"
                          : selectedReceipt.method || "N/A",
                      ],
                      ["UTR / Transaction ID", selectedReceipt.utr],
                      ["Payment Status", selectedReceipt.status],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-2 gap-3 p-4"
                      >
                        <span className="text-sm text-gray-500">
                          {label}
                        </span>

                        <span className="break-words text-sm font-bold text-gray-900">
                          {value || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-green-800">
                      Total Amount Paid
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Verified payment
                    </p>
                  </div>

                  <p className="text-3xl font-extrabold text-green-700">
                    {formatMoney(selectedReceipt.amount)}
                  </p>
                </div>

                <div className="border-t pt-6 text-center text-sm text-gray-500">
                  <p className="font-extrabold text-gray-800">
                    Thank you for your payment!
                  </p>

                  <p className="mt-2">
                    Please keep this receipt for your records.
                  </p>

                  <p className="mt-2 text-xs">
                    This receipt represents a payment recorded as Approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .receipt-preview,
          .receipt-preview * {
            visibility: visible !important;
          }

          .receipt-preview {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </section>
  );
}