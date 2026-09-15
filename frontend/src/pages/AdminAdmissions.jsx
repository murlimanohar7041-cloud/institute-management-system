import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

function AdminAdmissions({ branch }) {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)

  // Firestore se admission applications load
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

  // Student ID generate
  const generateStudentId = async () => {
    const studentsSnapshot = await getDocs(
      collection(db, "students")
    )

    const prefix = branch === "Itimha" ? "JSCI" : "JSCB"

    let maxNumber = 0

    studentsSnapshot.docs.forEach((docItem) => {
      const student = docItem.data()

      if (
        student.branch === branch &&
        student.studentId?.startsWith(prefix + "/")
      ) {
        const number = parseInt(
          student.studentId.split("/")[1],
          10
        )

        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number
        }
      }
    })

    return `${prefix}/${String(maxNumber + 1).padStart(3, "0")}`
  }

  // Approve admission
  const approveAdmission = async (admission) => {
    const confirmApprove = window.confirm(
      `Are you sure you want to approve ${admission.name}?`
    )

    if (!confirmApprove) return

    try {
      const studentId = await generateStudentId()

      console.log("Generated Student ID:", studentId)

      const studentData = {
        name: admission.name,
        fatherName: admission.fatherName,
        email: admission.email,
        mobile: admission.mobile,
        className: admission.className,
        stream: admission.stream || "",
        branch: admission.branch,
        role: "student",
        status: "approved",
        studentId: studentId,
        applicationId: admission.applicationId,
        admissionId: admission.firestoreId,
        createdAt: admission.createdAt || serverTimestamp(),
        approvedAt: serverTimestamp(),
      }

      // Student document create
      await setDoc(
        doc(db, "students", admission.firestoreId),
        studentData
      )

      // Admission status update
      await updateDoc(
        doc(db, "admissions", admission.firestoreId),
        {
          status: "approved",
          studentId: studentId,
          approvedAt: serverTimestamp(),
        }
      )

      alert(
        `Admission approved successfully!\n\nStudent ID: ${studentId}`
      )

      // List refresh
      await loadAdmissions()
    } catch (error) {
      console.error("Approve error:", error)

      alert(
        "Admission approve nahi hua.\n\n" +
          error.message
      )
    }
  }

  // Reject admission
  const rejectAdmission = async (admission) => {
    const confirmReject = window.confirm(
      `Are you sure you want to reject ${admission.name}'s admission?`
    )

    if (!confirmReject) return

    try {
      await updateDoc(
        doc(db, "admissions", admission.firestoreId),
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

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold text-red-600">
            Admission Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Admission Enquiries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage admission applications for {branch} branch.
          </p>
        </div>

        <button
          onClick={loadAdmissions}
          className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
        >
          ↻ Refresh
        </button>

      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-gray-600">
            Loading admission applications...
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">

          <table className="w-full min-w-[1200px] text-left">

            <thead className="bg-gray-50">

              <tr>
                <th className="px-5 py-4">Application ID</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Father</th>
                <th className="px-5 py-4">Gmail</th>
                <th className="px-5 py-4">Mobile</th>
                <th className="px-5 py-4">Class</th>
                <th className="px-5 py-4">Stream</th>
                <th className="px-5 py-4">Branch</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>

            </thead>

            <tbody className="divide-y">

              {enquiries.map((item) => (

                <tr key={item.firestoreId}>

                  {/* Application ID */}
                  <td className="px-5 py-4 font-bold text-blue-600">
                    {item.applicationId}
                  </td>

                  {/* Student */}
                  <td className="px-5 py-4 font-bold">
                    {item.name}
                  </td>

                  {/* Father */}
                  <td className="px-5 py-4">
                    {item.fatherName}
                  </td>

                  {/* Gmail */}
                  <td className="px-5 py-4">
                    {item.email}
                  </td>

                  {/* Mobile */}
                  <td className="px-5 py-4">
                    {item.mobile}
                  </td>

                  {/* Class */}
                  <td className="px-5 py-4">
                    {item.className}
                  </td>

                  {/* Stream */}
                  <td className="px-5 py-4">
                    {item.stream || "-"}
                  </td>

                  {/* Branch */}
                  <td className="px-5 py-4">
                    {item.branch}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status?.toUpperCase()}
                    </span>

                  </td>

                  {/* Action */}
                  <td className="px-5 py-4">

                    {item.status === "pending" && (
                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            approveAdmission(item)
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            rejectAdmission(item)
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>

                      </div>
                    )}

                    {item.status === "approved" && (
                      <div>
                        <p className="font-bold text-green-600">
                          Approved
                        </p>

                        <p className="text-xs text-gray-500">
                          ID: {item.studentId}
                        </p>
                      </div>
                    )}

                    {item.status === "rejected" && (
                      <p className="font-bold text-red-600">
                        Rejected
                      </p>
                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {/* Empty */}
          {enquiries.length === 0 && (
            <div className="p-14 text-center">

              <div className="text-5xl">
                📩
              </div>

              <p className="mt-3 font-bold">
                No admission applications
              </p>

              <p className="mt-1 text-sm text-gray-500">
                No applications found for {branch} branch.
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default AdminAdmissions