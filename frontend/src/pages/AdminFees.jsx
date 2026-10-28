import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FEE_DEFAULTS = {
  "9th": 200,
  "10th": 300,
  "11th-Science": 6000,
  "11th-Arts": 4000,
  "12th-Science": 7000,
  "12th-Arts": 5000,
};

const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export default function AdminFees({ branch }) {
  const currentYear = new Date().getFullYear();

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    studentEmail: "",
    feeAmount: "",
    periodMonth: MONTHS[new Date().getMonth()],
    year: String(currentYear),
  });

  const selectedStudent = students.find(
    (student) =>
      String(student.email || "").trim().toLowerCase() ===
      form.studentEmail.trim().toLowerCase()
  );

  const className = selectedStudent?.className || "";
  const stream = selectedStudent?.stream || "";

  const feeType =
    className === "9th" || className === "10th"
      ? "Monthly"
      : "Yearly";

  const periodKey =
    feeType === "Monthly"
      ? `${form.year}-${String(
          MONTHS.indexOf(form.periodMonth) + 1
        ).padStart(2, "0")}`
      : `${form.year}-${Number(form.year) + 1}`;

  const suggestedFee =
    FEE_DEFAULTS[
      stream ? `${className}-${stream}` : className
    ] || 0;

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [studentSnapshot, feeSnapshot] = await Promise.all([
        getDocs(collection(db, "students")),
        branch
          ? getDocs(
              query(
                collection(db, "fees"),
                where("branch", "==", branch)
              )
            )
          : getDocs(collection(db, "fees")),
      ]);

      const studentList = studentSnapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter((student) => {
          return (
            !branch ||
            student.branch === branch
          );
        })
        .filter(
          (student) =>
            String(student.status || "approved").toLowerCase() !==
            "rejected"
        )
        .sort((a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || "")
          )
        );

      const feeList = feeSnapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }));

      setStudents(studentList);
      setFees(feeList);
    } catch (err) {
      console.error("AdminFees load error:", err);
      setError(
        "Fees data load nahi ho pa raha hai. Firebase connection aur permissions check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [branch]);

  useEffect(() => {
    if (selectedStudent && suggestedFee > 0) {
      setForm((previous) => ({
        ...previous,
        feeAmount: String(suggestedFee),
      }));
    }
  }, [form.studentEmail, suggestedFee]);

  async function addFee(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedStudent) {
      setError("Pehle student select karein.");
      return;
    }

    const amount = Number(form.feeAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Fee amount sahi enter karein.");
      return;
    }

    if (
      feeType === "Monthly" &&
      !MONTHS.includes(form.periodMonth)
    ) {
      setError("Sahi month select karein.");
      return;
    }

    const studentEmail = String(
      selectedStudent.email || ""
    )
      .trim()
      .toLowerCase();

    if (!studentEmail) {
      setError("Student ke account mein email available nahi hai.");
      return;
    }

    // Check whether the same period already has a fee record.
    const duplicate = fees.some((fee) => {
      const sameEmail =
        String(fee.studentEmail || "")
          .trim()
          .toLowerCase() === studentEmail;

      const sameBranch =
        String(fee.branch || "") ===
        String(selectedStudent.branch || "");

      const samePeriod =
        fee.periodKey === periodKey ||
        (
          !fee.periodKey &&
          fee.month === form.periodMonth &&
          String(fee.year || "") === String(form.year)
        );

      return sameEmail && sameBranch && samePeriod;
    });

    if (duplicate) {
      setError(
        "Is student ki is period ki fee entry pehle se maujood hai. Duplicate entry nahi banayi gayi."
      );
      return;
    }

    try {
      setSaving(true);

      const feeRecord = {
        feeId: `FEE-${Date.now()}`,
        studentFirestoreId: selectedStudent.firestoreId,
        studentId:
          selectedStudent.studentId ||
          selectedStudent.id ||
          selectedStudent.firestoreId,
        studentName: selectedStudent.name || "",
        studentEmail,
        className: selectedStudent.className || "",
        stream: selectedStudent.stream || "",
        branch: selectedStudent.branch || branch || "",
        feeType,
        periodKey,
        year: String(form.year),
        month:
          feeType === "Monthly"
            ? form.periodMonth
            : `${form.year}-${Number(form.year) + 1}`,
        amount,
        paidAmount: 0,
        remainingAmount: amount,
        status: "Pending",
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "fees"), feeRecord);

      setSuccess(
        `${selectedStudent.name} ki ${feeRecord.month} fee entry save ho gayi.`
      );

      setForm((previous) => ({
        ...previous,
        studentEmail: "",
        feeAmount: "",
      }));

      await loadData();
    } catch (err) {
      console.error("Add fee error:", err);
      setError(
        "Fee save nahi hui. Firebase permissions check karein."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const text = [
        fee.studentName,
        fee.studentEmail,
        fee.studentId,
        fee.className,
        fee.stream,
        fee.branch,
        fee.month,
        fee.periodKey,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(
        search.trim().toLowerCase()
      );

      const matchesClass =
        classFilter === "All" ||
        fee.className === classFilter;

      const matchesStatus =
        statusFilter === "All" ||
        String(fee.status || "Pending").toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [fees, search, classFilter, statusFilter]);

  const totalPaid = fees.reduce((total, fee) => {
    if (fee.paidAmount !== undefined) {
      return total + Number(fee.paidAmount || 0);
    }

    // Compatibility with existing records.
    if (
      String(fee.status || "").toLowerCase() === "paid"
    ) {
      return total + Number(fee.amount || 0);
    }

    return total;
  }, 0);

  const totalPending = fees.reduce((total, fee) => {
    if (fee.remainingAmount !== undefined) {
      return total + Number(fee.remainingAmount || 0);
    }

    // Compatibility with existing records.
    if (
      String(fee.status || "").toLowerCase() === "pending"
    ) {
      return total + Number(fee.amount || 0);
    }

    return total;
  }, 0);

  const totalRecords = fees.length;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl bg-gray-50 p-8">
        <div className="text-center">
          <div className="text-4xl">⏳</div>
          <p className="mt-3 font-semibold text-gray-700">
            Fees data load ho raha hai...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 p-3 sm:p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          J. Solution Classes
        </p>

        <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Fees Management
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Monthly aur yearly fee records, paid amount aur pending
          fee manage karein.
        </p>

        {branch && (
          <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
            Branch: {branch}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Fee Records"
          value={totalRecords}
          icon="📋"
          color="blue"
        />

        <SummaryCard
          title="Recorded Paid Amount"
          value={money(totalPaid)}
          icon="✅"
          color="green"
        />

        <SummaryCard
          title="Recorded Pending Amount"
          value={money(totalPending)}
          icon="⏳"
          color="red"
        />
      </div>

      {/* ADD FEE */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-extrabold text-gray-900">
          Add Fee Record
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Student aur fee period select karke uski fee entry banayein.
        </p>

        <form
          onSubmit={addFee}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Select Student">
            <select
              value={form.studentEmail}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  studentEmail: event.target.value,
                }))
              }
              className="input-field"
              required
            >
              <option value="">Choose student</option>

              {students.map((student) => (
                <option
                  key={student.firestoreId}
                  value={student.email || ""}
                  disabled={!student.email}
                >
                  {student.name || "Unnamed Student"} —{" "}
                  {student.studentId ||
                    student.id ||
                    student.firestoreId}{" "}
                  ({student.className}
                  {student.stream ? ` ${student.stream}` : ""})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Student Class">
            <input
              value={
                selectedStudent
                  ? `${className}${stream ? ` - ${stream}` : ""}`
                  : ""
              }
              className="input-field bg-gray-100"
              placeholder="Student select karein"
              readOnly
            />
          </Field>

          <Field label="Fee Type">
            <input
              value={selectedStudent ? feeType : ""}
              className="input-field bg-gray-100"
              placeholder="Monthly / Yearly"
              readOnly
            />
          </Field>

          {feeType === "Monthly" && selectedStudent && (
            <Field label="Fee Month">
              <select
                value={form.periodMonth}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    periodMonth: event.target.value,
                  }))
                }
                className="input-field"
              >
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Fee Year">
            <select
              value={form.year}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  year: event.target.value,
                }))
              }
              className="input-field"
            >
              {Array.from({ length: 7 }, (_, index) => {
                const year = currentYear - 3 + index;

                return (
                  <option key={year} value={String(year)}>
                    {year}
                    {feeType === "Yearly"
                      ? `-${year + 1}`
                      : ""}
                  </option>
                );
              })}
            </select>
          </Field>

          <Field label="Fee Amount (₹)">
            <input
              type="number"
              min="1"
              step="1"
              value={form.feeAmount}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  feeAmount: event.target.value,
                }))
              }
              className="input-field"
              placeholder="Enter fee amount"
              required
            />
          </Field>

          {selectedStudent && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 sm:col-span-2 lg:col-span-3">
              <strong>Student:</strong>{" "}
              {selectedStudent.name} &nbsp;|&nbsp;
              <strong>Branch:</strong>{" "}
              {selectedStudent.branch || branch || "—"}{" "}
              &nbsp;|&nbsp;
              <strong>Suggested Fee:</strong>{" "}
              {money(suggestedFee)}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "＋ Add Fee Record"}
            </button>
          </div>
        </form>
      </section>

      {/* FEE HISTORY */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Fee Records
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Existing aur new fee records.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, ID, email..."
            className="input-field"
          />

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="input-field"
          >
            <option value="All">All Classes</option>
            <option value="9th">9th</option>
            <option value="10th">10th</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input-field"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Fee Amount</th>
                <th className="px-4 py-3">Recorded Paid</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredFees.map((fee) => {
                const legacyPaid =
                  fee.paidAmount === undefined &&
                  String(fee.status || "").toLowerCase() === "paid";

                const paidAmount =
                  fee.paidAmount !== undefined
                    ? Number(fee.paidAmount || 0)
                    : legacyPaid
                      ? Number(fee.amount || 0)
                      : 0;

                const remainingAmount =
                  fee.remainingAmount !== undefined
                    ? Number(fee.remainingAmount || 0)
                    : legacyPaid
                      ? 0
                      : Number(fee.amount || 0);

                const status =
                  remainingAmount <= 0
                    ? "Paid"
                    : paidAmount > 0
                      ? "Partially Paid"
                      : fee.status || "Pending";

                return (
                  <tr
                    key={fee.firestoreId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">
                        {fee.studentName || "—"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {fee.studentId || fee.studentEmail || "—"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {fee.branch || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {fee.className || "—"}
                      {fee.stream ? ` - ${fee.stream}` : ""}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {fee.month || fee.periodKey || "—"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {fee.feeType || "Existing record"}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold">
                      {money(fee.amount)}
                    </td>

                    <td className="px-4 py-4 font-semibold text-green-700">
                      {money(paidAmount)}
                    </td>

                    <td className="px-4 py-4 font-semibold text-red-700">
                      {money(remainingAmount)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : status === "Partially Paid"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredFees.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Koi fee record nahi mila.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-500">
          Note: Is step mein fee records ban rahe hain. Actual payment
          verification aur payment history ko agle step mein connect
          karenge. Purane records ko delete ya automatically rewrite
          nahi kiya ja raha hai.
        </p>
      </section>

      <style>{`
        .input-field {
          width: 100%;
          min-width: 0;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          padding: 11px 12px;
          color: #111827;
          outline: none;
        }

        .input-field:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-green-100 bg-green-50 text-green-700",
    red: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl border text-2xl ${
            colors[color] || colors.blue
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-500">
            {title}
          </p>
          <p className="mt-1 break-words text-2xl font-extrabold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}