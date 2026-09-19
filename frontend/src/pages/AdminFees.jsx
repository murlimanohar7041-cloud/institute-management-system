import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"

import { db } from "../firebase"
import { sendStudentNotification } from "../utils/notificationService"

function AdminFees({ branch }) {
  const [fees, setFees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    studentName: "",
    studentEmail: "",
    className: "9th",
    amount: "",
    status: "Paid",
    month: "January",
  })

  // =========================
  // LOAD FEES FROM FIRESTORE
  // =========================
  const loadFees = async () => {
    try {
      setLoading(true)

      const feesQuery = query(
        collection(db, "fees"),
        where("branch", "==", branch)
      )

      const snapshot = await getDocs(feesQuery)

      const data = snapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }))

      setFees(data)
    } catch (error) {
      console.error("Load fees error:", error)
      alert("Fees load nahi ho paayi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (branch) {
      loadFees()
    }
  }, [branch])

  // =========================
  // ADD FEE
  // =========================
  const addFee = async (e) => {
    e.preventDefault()

    if (!form.studentName.trim()) {
      alert("Student name enter karein.")
      return
    }

    if (!form.studentEmail.trim()) {
      alert("Student Gmail enter karein.")
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Valid amount enter karein.")
      return
    }

    try {
      setSaving(true)

      const feeId = `FEE-${Date.now()}`

      const newFee = {
        feeId,
        studentName: form.studentName.trim(),
        studentEmail: form.studentEmail.trim().toLowerCase(),
        className: form.className,
        amount: Number(form.amount),
        status: form.status,
        month: form.month,
        branch,
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "fees"), newFee)

      await sendStudentNotification({
        studentEmail: newFee.studentEmail,
        branch,
        className: newFee.className,
        title: "Fees Updated",
        message: `${newFee.month} ki ₹${newFee.amount} fee entry ${newFee.status} status ke saath update hui hai.`,
        type: "Fees",
      })

      alert("Fee successfully save ho gayi.")

      setForm({
        studentName: "",
        studentEmail: "",
        className: "9th",
        amount: "",
        status: "Paid",
        month: "January",
      })

      setShowForm(false)

      await loadFees()
    } catch (error) {
      console.error("Add fee error:", error)
      alert("Fee save nahi ho paayi.")
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // DELETE FEE
  // =========================
  const deleteFee = async (fee) => {
    const confirmDelete = window.confirm(
      `Kya aap ${fee.studentName} ki ${fee.month} fee delete karna chahte hain?`
    )

    if (!confirmDelete) return

    try {
      await deleteDoc(doc(db, "fees", fee.firestoreId))

      setFees((prev) =>
        prev.filter((item) => item.firestoreId !== fee.firestoreId)
      )

      alert("Fee delete ho gayi.")
    } catch (error) {
      console.error("Delete fee error:", error)
      alert("Fee delete nahi ho paayi.")
    }
  }

  // =========================
  // TOTALS
  // =========================
  const totalPaid = fees
    .filter((item) => item.status === "Paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalPending = fees
    .filter((item) => item.status === "Pending")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-red-600">
            Finance Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Fees
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage fees for {branch} branch.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
        >
          {showForm ? "× Close Form" : "+ Add Fee"}
        </button>
      </div>

      {/* SUMMARY */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Records
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {fees.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Paid
          </p>

          <p className="mt-2 text-3xl font-extrabold text-green-600">
            ₹{totalPaid}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Pending Fees
          </p>

          <p className="mt-2 text-3xl font-extrabold text-red-600">
            ₹{totalPending}
          </p>
        </div>

      </div>

      {/* ADD FEE FORM */}
      {showForm && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-extrabold">
            Add Fee Record
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Student ki Gmail zaroor enter karein. Isi Gmail se fee
            student dashboard me show hogi.
          </p>

          <form
            onSubmit={addFee}
            className="mt-5 grid gap-5 md:grid-cols-2"
          >

            {/* STUDENT NAME */}
            <input
              value={form.studentName}
              onChange={(e) =>
                setForm({
                  ...form,
                  studentName: e.target.value,
                })
              }
              placeholder="Student Name"
              required
              className="rounded-xl border px-4 py-3"
            />

            {/* STUDENT EMAIL */}
            <input
              type="email"
              value={form.studentEmail}
              onChange={(e) =>
                setForm({
                  ...form,
                  studentEmail: e.target.value,
                })
              }
              placeholder="Student Gmail"
              required
              className="rounded-xl border px-4 py-3"
            />

            {/* CLASS */}
            <select
              value={form.className}
              onChange={(e) =>
                setForm({
                  ...form,
                  className: e.target.value,
                })
              }
              className="rounded-xl border px-4 py-3"
            >
              <option>9th</option>
              <option>10th</option>
              <option>11th</option>
              <option>12th</option>
            </select>

            {/* AMOUNT */}
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
              placeholder="Amount ₹"
              required
              className="rounded-xl border px-4 py-3"
            />

            {/* MONTH */}
            <select
              value={form.month}
              onChange={(e) =>
                setForm({
                  ...form,
                  month: e.target.value,
                })
              }
              className="rounded-xl border px-4 py-3"
            >
              {[
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
              ].map((month) => (
                <option key={month}>
                  {month}
                </option>
              ))}
            </select>

            {/* STATUS */}
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
              className="rounded-xl border px-4 py-3"
            >
              <option>Paid</option>
              <option>Pending</option>
            </select>

            {/* SAVE */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Fee"}
            </button>

          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">

        {loading ? (
          <div className="p-14 text-center">
            <div className="text-4xl">⏳</div>
            <p className="mt-3 font-bold">
              Fees loading...
            </p>
          </div>
        ) : (
          <>
            <table className="w-full min-w-[950px] text-left">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4">
                    Fee ID
                  </th>

                  <th className="px-5 py-4">
                    Student
                  </th>

                  <th className="px-5 py-4">
                    Gmail
                  </th>

                  <th className="px-5 py-4">
                    Class
                  </th>

                  <th className="px-5 py-4">
                    Month
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">

                {fees.map((fee) => (
                  <tr key={fee.firestoreId}>

                    <td className="px-5 py-4 font-bold text-blue-600">
                      {fee.feeId}
                    </td>

                    <td className="px-5 py-4 font-bold">
                      {fee.studentName}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {fee.studentEmail}
                    </td>

                    <td className="px-5 py-4">
                      {fee.className}
                    </td>

                    <td className="px-5 py-4">
                      {fee.month}
                    </td>

                    <td className="px-5 py-4 font-bold">
                      ₹{fee.amount}
                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={
                          fee.status === "Paid"
                            ? "rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-green-600"
                            : "rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                        }
                      >
                        {fee.status}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <button
                        onClick={() => deleteFee(fee)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

            {fees.length === 0 && (
              <div className="p-14 text-center">

                <div className="text-4xl">
                  💰
                </div>

                <p className="mt-3 font-bold">
                  No fee records found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add a fee record to see it here.
                </p>

              </div>
            )}

          </>
        )}

      </div>

    </div>
  )
}

export default AdminFees