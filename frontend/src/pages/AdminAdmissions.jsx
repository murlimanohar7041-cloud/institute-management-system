import { useCallback, useEffect, useState } from "react"

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"

import { db } from "../firebase"
import { generateNextStudentId } from "../utils/studentIdGenerator"

function AdminAdmissions({ branch }) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)

  // =========================
  // LOAD ADMISSION ENQUIRIES
  // =========================
  const loadAdmissions = useCallback(async () => {
    try {
      setLoading(true)

      const snapshot = await getDocs(
        collection(db, "admissions")
      )

      const data = snapshot.docs
        .map((docItem) => ({
          firestoreId: docItem.id,
          ...docItem.data(),
        }))
        .filter((item) => item.branch === branch)
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0
          const dateB = b.createdAt?.seconds || 0

          return dateB - dateA
        })

      setEnquiries(data)

      console.log("Admissions loaded:", data)
    } catch (error) {
      console.error("Error loading admissions:", error)
      alert("Admissions load nahi ho pa raha hai.")
    } finally {
      setLoading(false)
    }
  }, [branch])

  useEffect(() => {
    loadAdmissions()
  }, [loadAdmissions])

  // =========================
  // APPROVE ADMISSION
  // =========================
  const approveAdmission = async (admission) => {
    const confirmApprove = window.confirm(
      `Are you sure you want to approve ${admission.name}?`
    )

    if (!confirmApprove) return

    try {
      // NEW BRANCH-WISE STUDENT ID
      const studentId = await generateNextStudentId(
        admission.branch || branch
      )

      console.log("Generated Student ID:", studentId)

      // Clean email
      const studentEmail =
        admission.email?.trim().toLowerCase() || ""

      if (!studentEmail) {
        alert(
          "Is admission enquiry me Gmail / Email nahi hai.\n\nApproval nahi kiya ja sakta."
        )
        return
      }

      // =========================
      // STUDENT DATA
      // =========================
      const studentData = {
        name: admission.name || "",
        fatherName: admission.fatherName || "",
        email: studentEmail,
        mobile: admission.mobile || "",
        className: admission.className || "",
        stream: admission.stream || "",
        branch: admission.branch || branch,
        role: "student",
        status: "approved",
        studentId: studentId,
        applicationId: admission.applicationId || "",
        admissionId: admission.firestoreId,
        createdAt:
          admission.createdAt || serverTimestamp(),
        approvedAt: serverTimestamp(),
      }

      // =========================
      // CREATE STUDENT
      // =========================
      await setDoc(
        doc(
          db,
          "students",
          admission.firestoreId
        ),
        studentData
      )

      // =========================
      // REMOVE OLD REVOCATION
      // =========================
      await deleteDoc(
        doc(
          db,
          "revokedStudents",
          studentEmail
        )
      ).catch(() => {
        // Document nahi hai to koi problem nahi
      })

      // =========================
      // UPDATE ADMISSION
      // =========================
      await updateDoc(
        doc(
          db,
          "admissions",
          admission.firestoreId
        ),
        {
          status: "approved",
          studentId: studentId,
          approvedAt: serverTimestamp(),
        }
      )

      alert(
        `Admission approved successfully! ✅\n\nStudent ID: ${studentId}\nGmail: ${studentEmail}`
      )

      await loadAdmissions()
    } catch (error) {
      console.error("Approve error:", error)

      alert(
        "Admission approve nahi hua.\n\n" +
          error.message
      )
    }
  }

  // =========================
  // REJECT ADMISSION
  // =========================
  const rejectAdmission = async (admission) => {
    const confirmReject = window.confirm(
      `Are you sure you want to reject ${admission.name}'s admission?`
    )

    if (!confirmReject) return

    try {
      await updateDoc(
        doc(
          db,
          "admissions",
          admission.firestoreId
        ),
        {
          status: "rejected",
          rejectedAt: serverTimestamp(),
        }
      )

      alert("Admission rejected.")

      await loadAdmissions()
    } catch (error) {
      console.error("Reject error:", error)

      alert(
        "Admission reject nahi hua.\n\n" +
          error.message
      )
    }
  }

  // =========================
  // STATUS HELPER
  // =========================
  const getStatus = (status) => {
    if (!status) return "new"

    return String(status).toLowerCase()
  }

  // =========================
  // STATUS STYLE
  // =========================
  const getStatusClass = (status) => {
    const currentStatus = getStatus(status)

    if (
      currentStatus === "new" ||
      currentStatus === "pending"
    ) {
      return "bg-yellow-100 text-yellow-700"
    }

    if (currentStatus === "approved") {
      return "bg-green-100 text-green-700"
    }

    if (
      currentStatus === "rejected" ||
      currentStatus === "cancelled" ||
      currentStatus === "canceled"
    ) {
      return "bg-red-100 text-red-700"
    }

    return "bg-gray-100 text-gray-700"
  }

  // =========================
  // ACTION BUTTONS
  // =========================
  const ActionButtons = ({ item, mobile = false }) => {
    const currentStatus = getStatus(item.status)

    const canTakeAction =
      currentStatus === "new" ||
      currentStatus === "pending"

    if (canTakeAction) {
      return (
        <div
          className={
            mobile
              ? "mt-4 grid grid-cols-2 gap-2"
              : "flex gap-2"
          }
        >
          <button
            onClick={() => approveAdmission(item)}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700"
          >
            ✓ Approve
          </button>

          <button
            onClick={() => rejectAdmission(item)}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            ✕ Reject
          </button>
        </div>
      )
    }

    if (currentStatus === "approved") {
      return (
        <div className="mt-2">
          <p className="font-bold text-green-600">
            ✓ Approved
          </p>

          <p className="mt-1 text-xs text-gray-500">
            ID:{" "}
            <span className="font-bold text-gray-700">
              {item.studentId || "-"}
            </span>
          </p>
        </div>
      )
    }

    if (
      currentStatus === "rejected" ||
      currentStatus === "cancelled" ||
      currentStatus === "canceled"
    ) {
      return (
        <p className="mt-2 font-bold text-red-600">
          ✕ Rejected
        </p>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-600">
            Admission Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Admission Enquiries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage admission applications for{" "}
            <span className="font-bold text-gray-700">
              {branch}
            </span>{" "}
            branch.
          </p>
        </div>

        <button
          onClick={loadAdmissions}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 md:w-auto"
        >
          ↻ Refresh
        </button>
      </div>

      {/* =========================
          LOADING
      ========================= */}
      {loading && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-gray-600">
            Loading admission applications...
          </p>
        </div>
      )}

      {!loading && (
        <>
          {/* ==================================================
              DESKTOP / TABLET TABLE
          ================================================== */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Application ID
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Student
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Father
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Gmail
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Mobile
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Class
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Stream
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Branch
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Status
                    </th>

                    <th className="px-4 py-4 text-sm font-bold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {enquiries.map((item) => {
                    const currentStatus = getStatus(
                      item.status
                    )

                    return (
                      <tr
                        key={item.firestoreId}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="max-w-[150px] break-all px-4 py-4 text-sm font-bold text-blue-600">
                          {item.applicationId}
                        </td>

                        <td className="max-w-[170px] break-words px-4 py-4 text-sm font-bold text-gray-900">
                          {item.name || "-"}
                        </td>

                        <td className="max-w-[170px] break-words px-4 py-4 text-sm text-gray-700">
                          {item.fatherName || "-"}
                        </td>

                        <td className="max-w-[220px] break-all px-4 py-4 text-sm text-gray-700">
                          {item.email || "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.mobile || "-"}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                          {item.className || "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.stream || "-"}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                          {item.branch || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {currentStatus.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <ActionButtons item={item} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================================================
              MOBILE CARDS
          ================================================== */}
          <div className="mt-5 grid gap-4 md:hidden">
            {enquiries.map((item) => {
              const currentStatus = getStatus(
                item.status
              )

              return (
                <div
                  key={item.firestoreId}
                  className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  {/* Card Header */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                        {item.applicationId || "Application"}
                      </p>

                      <h2 className="mt-1 break-words text-lg font-extrabold leading-tight text-gray-900">
                        {item.name || "-"}
                      </h2>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {currentStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-3">
                    <MobileInfo
                      label="Father"
                      value={item.fatherName || "-"}
                    />

                    <MobileInfo
                      label="Gmail"
                      value={item.email || "-"}
                      breakAll
                    />

                    <MobileInfo
                      label="Mobile"
                      value={item.mobile || "-"}
                    />

                    <MobileInfo
                      label="Class"
                      value={item.className || "-"}
                    />

                    <MobileInfo
                      label="Stream"
                      value={item.stream || "-"}
                    />

                    <MobileInfo
                      label="Branch"
                      value={item.branch || "-"}
                    />
                  </div>

                  {/* Actions */}
                  <ActionButtons
                    item={item}
                    mobile
                  />
                </div>
              )
            })}
          </div>

          {/* =========================
              EMPTY
          ========================= */}
          {enquiries.length === 0 && (
            <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">
                📩
              </div>

              <p className="mt-3 font-bold text-gray-800">
                No admission applications
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No applications found for{" "}
                {branch} branch.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// =========================
// MOBILE INFO ROW
// =========================
function MobileInfo({
  label,
  value,
  breakAll = false,
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-xs font-semibold text-gray-500">
        {label}
      </span>

      <span
        className={`min-w-0 max-w-[68%] text-right text-sm font-semibold text-gray-800 ${
          breakAll
            ? "break-all"
            : "break-words"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default AdminAdmissions