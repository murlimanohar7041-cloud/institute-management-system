
import { useEffect, useState } from "react"
import { db } from "../firebase"
import { sendStudentNotification } from "../utils/notificationService"

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore"

function Students({ branch }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("All")
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    fatherName: "",
    mobile: "",
    className: "9th",
    stream: "",
  })

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true)

        const snapshot = await getDocs(
          collection(db, "students")
        )

        const firestoreStudents = snapshot.docs.map(
          (item) => ({
            firestoreId: item.id,
            ...item.data(),
          })
        )

        setStudents(firestoreStudents)

        localStorage.setItem(
          "students",
          JSON.stringify(firestoreStudents)
        )
      } catch (error) {
        console.error("Error loading students:", error)

        try {
          const savedStudents =
            localStorage.getItem("students")

          if (savedStudents) {
            setStudents(JSON.parse(savedStudents))
          }
        } catch (localError) {
          console.error(
            "LocalStorage error:",
            localError
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "className" &&
      !["11th", "12th"].includes(value)
        ? { stream: "" }
        : {}),
    }))
  }

  const generateStudentId = () => {
    const branchPrefix =
      branch?.toLowerCase() === "itimha"
        ? "JSCI"
        : branch?.toLowerCase() === "bardiha"
        ? "JSCB"
        : "JSC"

    const branchStudents = students.filter(
      (student) => student.branch === branch
    )

    let number = branchStudents.length + 1

    let newId = `${branchPrefix}/${String(
      number
    ).padStart(3, "0")}`

    while (
      students.some(
        (student) => student.id === newId
      )
    ) {
      number++

      newId = `${branchPrefix}/${String(
        number
      ).padStart(3, "0")}`
    }

    return newId
  }

  const addStudent = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert("Please enter student name")
      return
    }

    if (!form.email.trim()) {
      alert("Please enter student email")
      return
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      alert("Please enter a valid email address")
      return
    }

    if (!form.fatherName.trim()) {
      alert("Please enter father's name")
      return
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      alert(
        "Please enter valid 10 digit mobile number"
      )
      return
    }

    if (
      ["11th", "12th"].includes(form.className) &&
      !form.stream
    ) {
      alert("Please select stream")
      return
    }

    try {
      setSaving(true)

      const email = form.email.trim().toLowerCase()

      if (editingId) {
        const studentRef = doc(
          db,
          "students",
          editingId
        )

        const updatedData = {
          name: form.name.trim(),
          email,
          fatherName: form.fatherName.trim(),
          mobile: form.mobile,
          className: form.className,
          stream: form.stream,
          branch,
          status: "approved",
          updatedAt: new Date().toISOString(),
        }

        await updateDoc(
          studentRef,
          updatedData
        )

        await sendStudentNotification({
          studentEmail: email,
          studentId: students.find((item) => item.firestoreId === editingId)?.studentId || "",
          studentFirestoreId: editingId,
          studentName: updatedData.name,
          branch,
          className: updatedData.className,
          stream: updatedData.stream,
          title: "Profile Updated by Admin",
          message: "Admin ne aapke student profile details update ki hain.",
          type: "Profile",
        })

        const updatedStudents = students.map(
          (student) =>
            student.firestoreId === editingId
              ? {
                  ...student,
                  ...updatedData,
                }
              : student
        )

        setStudents(updatedStudents)

        localStorage.setItem(
          "students",
          JSON.stringify(updatedStudents)
        )

        alert("Student updated successfully!")

        setEditingId(null)

        // Agar previously blocked tha,
        // profile edit/update hone par access restore hoga.
        await deleteDoc(
          doc(db, "revokedStudents", email)
        ).catch(() => {})
      } else {
        const newStudent = {
          id: generateStudentId(),
          name: form.name.trim(),
          email,
          fatherName: form.fatherName.trim(),
          mobile: form.mobile,
          className: form.className,
          stream: form.stream,
          branch,
          status: "approved",
          createdAt: new Date().toISOString(),
        }

        const docRef = await addDoc(
          collection(db, "students"),
          newStudent
        )

        const studentWithFirestoreId = {
          firestoreId: docRef.id,
          ...newStudent,
        }

        const updatedStudents = [
          ...students,
          studentWithFirestoreId,
        ]

        setStudents(updatedStudents)

        localStorage.setItem(
          "students",
          JSON.stringify(updatedStudents)
        )

        // Agar email pehle blocked tha to unblock
        await deleteDoc(
          doc(db, "revokedStudents", email)
        ).catch(() => {})

        alert(
          `Student registered successfully!\nStudent ID: ${newStudent.id}`
        )
      }

      setForm({
        name: "",
        email: "",
        fatherName: "",
        mobile: "",
        className: "9th",
        stream: "",
      })

      setShowForm(false)
    } catch (error) {
      console.error(
        "Error saving student:",
        error
      )

      alert(
        "Student save nahi hua. Firebase/Firestore rules check karein."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // DELETE STUDENT
  // =========================
const deleteStudent = async (firestoreId, studentId) => {
  const student = students.find(
    (item) =>
      item.firestoreId === firestoreId ||
      item.id === studentId
  )

  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${
      student?.name || "this student"
    }?\n\nDelete karne ke baad student ko dobara Admission Enquiry submit karni hogi.`
  )

  if (!confirmDelete) return

  try {
    // Student email ko revoke list me save karo
    if (student?.email) {
      const email = student.email.trim().toLowerCase()

      await setDoc(
        doc(db, "revokedStudents", email),
        {
          email: email,
          studentId: student?.id || studentId || null,
          name: student?.name || "",
          branch: student?.branch || branch || "",
          status: "revoked",
          revokedAt: new Date().toISOString(),
        }
      )
    }

    // Student profile delete
    if (firestoreId) {
      await deleteDoc(
        doc(db, "students", firestoreId)
      )
    }

    const updatedStudents = students.filter(
      (item) =>
        item.firestoreId !== firestoreId &&
        item.id !== studentId
    )

    setStudents(updatedStudents)

    localStorage.setItem(
      "students",
      JSON.stringify(updatedStudents)
    )

    alert(
      "Student deleted successfully!\n\n" +
      "Student ka login access revoke kar diya gaya hai."
    )
  } catch (error) {
    console.error(
      "Error deleting student:",
      error
    )

    alert(
      "Student delete nahi hua. Firebase rules check karein."
    )
  }
}
  const editStudent = (student) => {
    setForm({
      name: student.name || "",
      email: student.email || "",
      fatherName: student.fatherName || "",
      mobile: student.mobile || "",
      className: student.className || "9th",
      stream: student.stream || "",
    })

    setEditingId(
      student.firestoreId || null
    )

    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)

    setForm({
      name: "",
      email: "",
      fatherName: "",
      mobile: "",
      className: "9th",
      stream: "",
    })
  }

  const filteredStudents = students.filter(
    (student) => {
      const branchMatch =
        student.branch === branch

      const classMatch =
        classFilter === "All" ||
        student.className === classFilter

      const text = `
        ${student.name || ""}
        ${student.email || ""}
        ${student.fatherName || ""}
        ${student.mobile || ""}
        ${student.id || ""}
        ${student.className || ""}
        ${student.stream || ""}
      `

      const searchMatch = text
        .toLowerCase()
        .includes(search.toLowerCase())

      return (
        branchMatch &&
        classMatch &&
        searchMatch
      )
    }
  )

  const getClassCount = (className) => {
    return students.filter(
      (student) =>
        student.branch === branch &&
        student.className === className
    ).length
  }

  const branchStudentCount =
    students.filter(
      (student) =>
        student.branch === branch
    ).length

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
            Students
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage students of J. Solution Classes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500">
              Active Branch
            </p>

            <p className="font-extrabold text-blue-700">
              {branch}
            </p>
          </div>

          <button
            onClick={() =>
              showForm
                ? closeForm()
                : setShowForm(true)
            }
            className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-800"
          >
            {showForm
              ? "× Close Form"
              : "+ Add Student"}
          </button>

        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <button
          onClick={() => setClassFilter("All")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            classFilter === "All"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <p className="text-sm font-bold text-gray-500">
            All Classes
          </p>

          <p className="mt-2 text-3xl font-extrabold text-gray-950">
            {branchStudentCount}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Students
          </p>
        </button>

        {["9th", "10th", "11th", "12th"].map(
          (className) => (
            <button
              key={className}
              onClick={() =>
                setClassFilter(className)
              }
              className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                classFilter === className
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="text-sm font-bold text-gray-500">
                Class {className}
              </p>

              <p className="mt-2 text-3xl font-extrabold text-gray-950">
                {getClassCount(className)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Students
              </p>
            </button>
          )
        )}

      </div>

      {showForm && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <h2 className="text-xl font-extrabold text-gray-950">
            {editingId
              ? "Edit Student"
              : "Add New Student"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Student will be added to{" "}
            <span className="font-bold text-blue-700">
              {branch}
            </span>{" "}
            branch.
          </p>

          <form
            onSubmit={addStudent}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Student Name *
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Student Google Email *
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Student isi Google account se login karega.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Father's Name *
              </label>

              <input
                type="text"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Mobile Number *
              </label>

              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                maxLength="10"
                pattern="[0-9]{10}"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Class *
              </label>

              <select
                name="className"
                value={form.className}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none"
              >
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
            </div>

            {["11th", "12th"].includes(
              form.className
            ) && (
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Stream *
                </label>

                <select
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none"
                >
                  <option value="">
                    Select Stream
                  </option>

                  <option value="Science">
                    Science
                  </option>

                  <option value="Arts">
                    Arts
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Branch
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {branch}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Student ID
              </label>

              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 font-bold text-green-700">
                {editingId
                  ? students.find(
                      (student) =>
                        student.firestoreId ===
                        editingId
                    )?.id || "Existing ID"
                  : generateStudentId()}
              </div>
            </div>

            <div className="flex gap-3 md:col-span-2">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Student"
                  : "Save Student"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-gray-200 bg-gray-100 px-6 py-3 font-bold text-gray-700"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder={`Search ${branch} student...`}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 md:max-w-md"
          />

          <div className="rounded-xl bg-blue-50 px-4 py-2.5">
            <span className="text-sm font-bold text-blue-700">
              {branch} •{" "}
              {classFilter === "All"
                ? "All Classes"
                : `Class ${classFilter}`}
              : {filteredStudents.length}
            </span>
          </div>

        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1150px] text-left">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Student ID
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Student
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Email
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Father's Name
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Class
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Stream
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Mobile
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Action
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center"
                  >
                    <div className="text-4xl">
                      👨‍🎓
                    </div>

                    <p className="mt-3 font-bold text-gray-800">
                      No students found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(
                  (student) => (
                    <tr
                      key={
                        student.firestoreId ||
                        student.id
                      }
                      className="transition hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          {student.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">
                          {student.name}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-700">
                          {student.email || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.fatherName}
                      </td>

                      <td className="px-5 py-4">
                        {student.className}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {student.stream || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.mobile}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              editStudent(student)
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteStudent(
                                student.firestoreId,
                                student.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

export default Students
