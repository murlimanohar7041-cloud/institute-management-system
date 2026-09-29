import { useEffect, useState } from "react"

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

function AdminAdmissions({ branch }) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)

  // =========================
  // LOAD ADMISSION ENQUIRIES
  // =========================
  useEffect(() => {
    loadAdmissions()
  }, [branch])

  const loadAdmissions = async () => {
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
  }

  // =========================
  // GENERATE STUDENT ID
  // =========================
  const generateStudentId = async () => {
    const studentsSnapshot = await getDocs(
      collection(db, "students")
    )

    const prefix =
      branch === "Itimha"
        ? "JSCI"
        : "JSCB"

    let maxNumber = 0

    studentsSnapshot.docs.forEach((docItem) => {
      const student = docItem.data()

      if (
        student.branch === branch &&
        student.studentId &&
        student.studentId.startsWith(prefix + "/")
      ) {
        const parts = student.studentId.split("/")

        const number = parseInt(parts[1], 10)

        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number
        }
      }
    })

    return `${prefix}/${String(maxNumber + 1).padStart(3, "0")}`
  }

  // =========================
  // APPROVE ADMISSION
  // =========================
  const approveAdmission = async (admission) => {
    const confirmApprove = window.confirm(
      `Are you sure you want to approve ${admission.name}?`
    )

    if (!confirmApprove) return

    try {
      // Generate Student ID
      const studentId = await generateStudentId()

      console.log(
        "Generated Student ID:",
        studentId
      )

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

        // IMPORTANT
        email: studentEmail,

        mobile: admission.mobile || "",
        className: admission.className || "",
        stream: admission.stream || "",
        branch: admission.branch || branch,

        role: "student",
        status: "approved",

        studentId: studentId,

        applicationId:
          admission.applicationId || "",

        admissionId:
          admission.firestoreId,

        createdAt:
          admission.createdAt || serverTimestamp(),

        approvedAt:
          serverTimestamp(),
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
        // Agar revokedStudents document nahi hai
        // to koi problem nahi
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

      // Refresh list
      await loadAdmissions()
    } catch (error) {
      console.error(
        "Approve error:",
        error
      )

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

      // Refresh list
      await loadAdmissions()
    } catch (error) {
      console.error(
        "Reject error:",
        error
      )

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

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold text-red-600">
            Admission Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
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
          className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
        >
          ↻ Refresh
        </button>

      </div>

      {/* LOADING */}
      {loading && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-gray-600">
            Loading admission applications...
          </p>
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">

          <table className="w-full min-w-[1200px] text-left">

            {/* TABLE HEADER */}
            <thead className="bg-gray-50">
              <tr>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Application ID
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Student
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Father
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Gmail
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Mobile
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Class
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Stream
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Branch
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Status
                </th>

                <th className="px-5 py-4 text-sm font-bold text-gray-700">
                  Action
                </th>

              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y">

              {enquiries.map((item) => {

                const currentStatus =
                  getStatus(item.status)

                const canTakeAction =
                  currentStatus === "new" ||
                  currentStatus === "pending"

                return (
                  <tr
                    key={item.firestoreId}
                    className="transition hover:bg-gray-50"
                  >

                    {/* APPLICATION ID */}
                    <td className="px-5 py-4 font-bold text-blue-600">
                      {item.applicationId || "-"}
                    </td>

                    {/* STUDENT */}
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {item.name || "-"}
                    </td>

                    {/* FATHER */}
                    <td className="px-5 py-4 text-gray-700">
                      {item.fatherName || "-"}
                    </td>

                    {/* GMAIL */}
                    <td className="px-5 py-4 text-gray-700">
                      {item.email || "-"}
                    </td>

                    {/* MOBILE */}
                    <td className="px-5 py-4 text-gray-700">
                      {item.mobile || "-"}
                    </td>

                    {/* CLASS */}
                    <td className="px-5 py-4 text-gray-700">
                      {item.className || "-"}
                    </td>

                    {/* STREAM */}
                    <td className="px-5 py-4 text-gray-700">
                      {item.stream || "-"}
                    </td>

                    {/* BRANCH */}
                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {item.branch || "-"}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {currentStatus.toUpperCase()}
                      </span>

                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4">

                      {/* NEW / PENDING */}
                      {canTakeAction && (
                        <div className="flex gap-2">

                          {/* APPROVE */}
                          <button
                            onClick={() =>
                              approveAdmission(item)
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>

                          {/* REJECT */}
                          <button
                            onClick={() =>
                              rejectAdmission(item)
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                          >
                            ✕ Reject
                          </button>

                        </div>
                      )}

                      {/* APPROVED */}
                      {currentStatus === "approved" && (
                        <div>

                          <p className="font-bold text-green-600">
                            ✓ Approved
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            ID:{" "}
                            <span className="font-bold">
                              {item.studentId || "-"}
                            </span>
                          </p>

                        </div>
                      )}

                      {/* REJECTED */}
                      {(currentStatus === "rejected" ||
                        currentStatus === "cancelled" ||
                        currentStatus === "canceled") && (
                        <p className="font-bold text-red-600">
                          ✕ Rejected
                        </p>
                      )}

                    </td>

                  </tr>
                )
              })}

            </tbody>

          </table>

          {/* EMPTY */}
          {enquiries.length === 0 && (
            <div className="p-14 text-center">

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

        </div>
      )}

    </div>
  )
}

export default AdminAdmissions