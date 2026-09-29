import { useEffect, useState } from "react"

import { generateNextStudentId } from "../utils/studentIdGenerator"

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

  // =========================================================
  // BRANCH NORMALIZATION
  // =========================================================

  const normalizedBranch = String(branch || "")
    .trim()
    .toLowerCase()

  const displayBranch =
    normalizedBranch === "itimha"
      ? "Itimha"
      : normalizedBranch === "bardiha"
      ? "Bardiha"
      : branch || ""

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

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
        console.error(
          "Error loading students:",
          error
        )

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

  // =========================================================
  // FORM CHANGE
  // =========================================================

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

  // =========================================================
  // APPLICATION ID
  // =========================================================

  const generateApplicationId = () => {
    const year = new Date().getFullYear()

    let maxNumber = 0

    students.forEach((student) => {
      const value = student.applicationId || ""

      const match = value.match(
        /^JSC-(\d{4})-(\d+)$/
      )

      if (
        match &&
        Number(match[1]) === year
      ) {
        const number = Number(match[2])

        if (number > maxNumber) {
          maxNumber = number
        }
      }
    })

    return `JSC-${year}-${String(
      maxNumber + 1
    ).padStart(6, "0")}`
  }

  // =========================================================
  // STUDENT ID GENERATOR
  //
  // Itimha  -> JSCI/001
  // Bardiha -> JSCB/001
  // =========================================================

  const generateStudentId = () => {
    let branchPrefix = "JSC"

    if (normalizedBranch === "itimha") {
      branchPrefix = "JSCI"
    } else if (normalizedBranch === "bardiha") {
      branchPrefix = "JSCB"
    }

    // Only students of current branch
    const branchStudents = students.filter(
      (student) =>
        String(student.branch || "")
          .trim()
          .toLowerCase() === normalizedBranch
    )

    // Find the highest existing NEW-style ID
    let maxNumber = 0

    branchStudents.forEach((student) => {
      const existingId =
        student.studentId ||
        student.id ||
        ""

      const regex = new RegExp(
        `^${branchPrefix}/(\\d+)$`,
        "i"
      )

      const match = String(existingId).match(
        regex
      )

      if (match) {
        const number = Number(match[1])

        if (number > maxNumber) {
          maxNumber = number
        }
      }
    })

    let number = maxNumber + 1

    let newId = `${branchPrefix}/${String(
      number
    ).padStart(3, "0")}`

    // Extra safety: duplicate ID nahi hona chahiye
    while (
      students.some(
        (student) =>
          String(
            student.studentId || ""
          ).toUpperCase() ===
            newId.toUpperCase() ||
          String(
            student.id || ""
          ).toUpperCase() ===
            newId.toUpperCase()
      )
    ) {
      number++

      newId = `${branchPrefix}/${String(
        number
      ).padStart(3, "0")}`
    }

    return newId
  }

  // =========================================================
  // ADD / UPDATE STUDENT
  // =========================================================

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
      ["11th", "12th"].includes(
        form.className
      ) &&
      !form.stream
    ) {
      alert("Please select stream")
      return
    }

    try {
      setSaving(true)

      const email = form.email
        .trim()
        .toLowerCase()

      // =====================================================
      // EDIT STUDENT
      // =====================================================

      if (editingId) {
        const studentRef = doc(
          db,
          "students",
          editingId
        )

        const updatedData = {
          name: form.name.trim(),
          email,
          fatherName:
            form.fatherName.trim(),
          mobile: form.mobile,
          className: form.className,
          stream: form.stream,

          // Always save proper branch name
          branch: displayBranch,

          status: "approved",

          updatedAt:
            new Date().toISOString(),
        }

        await updateDoc(
          studentRef,
          updatedData
        )

        const oldStudent =
          students.find(
            (item) =>
              item.firestoreId ===
              editingId
          )

        await sendStudentNotification({
          studentEmail: email,

          studentId:
            oldStudent?.studentId ||
            oldStudent?.id ||
            "",

          studentFirestoreId:
            editingId,

          studentName:
            updatedData.name,

          branch: displayBranch,

          className:
            updatedData.className,

          stream:
            updatedData.stream,

          title:
            "Profile Updated by Admin",

          message:
            "Admin ne aapke student profile details update ki hain.",

          type: "Profile",
        })

        const updatedStudents =
          students.map((student) =>
            student.firestoreId ===
            editingId
              ? {
                  ...student,
                  ...updatedData,
                }
              : student
          )

        setStudents(updatedStudents)

        localStorage.setItem(
          "students",
          JSON.stringify(
            updatedStudents
          )
        )

        alert(
          "Student updated successfully!"
        )

        setEditingId(null)

        await deleteDoc(
          doc(
            db,
            "revokedStudents",
            email
          )
        ).catch(() => {})
      }

      // =====================================================
      // ADD NEW STUDENT
      // =====================================================

      else {
        // IMPORTANT:
        // New ID will ALWAYS be JSCI/JSCB
        const studentId =
          generateStudentId()

        const applicationId =
          generateApplicationId()

        const newStudent = {
          id: studentId,

          studentId: studentId,

          applicationId:
            applicationId,

          name: form.name.trim(),

          email,

          fatherName:
            form.fatherName.trim(),

          mobile: form.mobile,

          className:
            form.className,

          stream:
            form.stream,

          // IMPORTANT:
          // Save correct branch
          branch: displayBranch,

          status: "approved",

          createdAt:
            new Date().toISOString(),
        }

        const docRef =
          await addDoc(
            collection(
              db,
              "students"
            ),
            newStudent
          )

        const studentWithFirestoreId =
          {
            firestoreId:
              docRef.id,

            ...newStudent,
          }

        const updatedStudents = [
          ...students,
          studentWithFirestoreId,
        ]

        setStudents(
          updatedStudents
        )

        localStorage.setItem(
          "students",
          JSON.stringify(
            updatedStudents
          )
        )

        await deleteDoc(
          doc(
            db,
            "revokedStudents",
            email
          )
        ).catch(() => {})

        alert(
          `Student registered successfully!

Application ID: ${applicationId}

Student ID: ${studentId}`
        )
      }

      // Reset form
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

  // =========================================================
  // DELETE STUDENT
  // =========================================================

  const deleteStudent = async (
    firestoreId,
    studentId
  ) => {
    const student = students.find(
      (item) =>
        item.firestoreId ===
          firestoreId ||
        item.id === studentId ||
        item.studentId === studentId
    )

    const confirmDelete =
      window.confirm(
        `Are you sure you want to delete ${
          student?.name ||
          "this student"
        }?

Delete karne ke baad student ko dobara Admission Enquiry submit karni hogi.`
      )

    if (!confirmDelete) return

    try {
      if (student?.email) {
        const email = student.email
          .trim()
          .toLowerCase()

        await setDoc(
          doc(
            db,
            "revokedStudents",
            email
          ),
          {
            email,

            studentId:
              student?.studentId ||
              student?.id ||
              studentId ||
              null,

            name:
              student?.name || "",

            branch:
              student?.branch ||
              displayBranch ||
              "",

            status: "revoked",

            revokedAt:
              new Date().toISOString(),
          }
        )
      }

      if (firestoreId) {
        await deleteDoc(
          doc(
            db,
            "students",
            firestoreId
          )
        )
      }

      const updatedStudents =
        students.filter(
          (item) =>
            item.firestoreId !==
              firestoreId &&
            item.id !== studentId &&
            item.studentId !== studentId
        )

      setStudents(
        updatedStudents
      )

      localStorage.setItem(
        "students",
        JSON.stringify(
          updatedStudents
        )
      )

      alert(
        "Student deleted successfully!\n\nStudent ka login access revoke kar diya gaya hai."
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

  // =========================================================
  // EDIT STUDENT
  // =========================================================

  const editStudent = (student) => {
    setForm({
      name:
        student.name || "",

      email:
        student.email || "",

      fatherName:
        student.fatherName || "",

      mobile:
        student.mobile || "",

      className:
        student.className || "9th",

      stream:
        student.stream || "",
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

  // =========================================================
  // CLOSE FORM
  // =========================================================

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

  // =========================================================
  // FILTER STUDENTS
  // =========================================================

  const filteredStudents =
    students.filter((student) => {
      const studentBranch =
        String(
          student.branch || ""
        )
          .trim()
          .toLowerCase()

      const branchMatch =
        studentBranch ===
        normalizedBranch

      const classMatch =
        classFilter === "All" ||
        student.className ===
          classFilter

      const text = `
        ${student.name || ""}
        ${student.email || ""}
        ${student.fatherName || ""}
        ${student.mobile || ""}
        ${student.id || ""}
        ${student.studentId || ""}
        ${student.className || ""}
        ${student.stream || ""}
      `

      const searchMatch =
        text
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )

      return (
        branchMatch &&
        classMatch &&
        searchMatch
      )
    })

  // =========================================================
  // CLASS COUNT
  // =========================================================

  const getClassCount = (
    className
  ) => {
    return students.filter(
      (student) =>
        String(
          student.branch || ""
        )
          .trim()
          .toLowerCase() ===
          normalizedBranch &&
        student.className ===
          className
    ).length
  }

  // =========================================================
  // BRANCH STUDENT COUNT
  // =========================================================

  const branchStudentCount =
    students.filter(
      (student) =>
        String(
          student.branch || ""
        )
          .trim()
          .toLowerCase() ===
        normalizedBranch
    ).length

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Students
            </h1>

            <p className="text-gray-500 mt-1">
              Manage students for{" "}
              <span className="font-semibold text-blue-600">
                {displayBranch}
              </span>{" "}
              branch
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                closeForm()
              } else {
                setShowForm(true)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            {showForm
              ? "Close Form"
              : "+ Add Student"}
          </button>
        </div>

        {/* Statistics */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-7">

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">
              Total Students
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {branchStudentCount}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">
              Class 9th
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {getClassCount("9th")}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">
              Class 10th
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {getClassCount("10th")}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">
              Class 11th
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {getClassCount("11th")}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">
              Class 12th
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {getClassCount("12th")}
            </p>
          </div>

        </div>

        {/* Add / Edit Form */}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-7 mb-7">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? "Edit Student"
                    : "Add New Student"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Branch:{" "}
                  <span className="font-semibold">
                    {displayBranch}
                  </span>
                </p>

                {!editingId && (
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    New Student ID format:{" "}
                    {normalizedBranch ===
                    "itimha"
                      ? "JSCI/001"
                      : normalizedBranch ===
                        "bardiha"
                      ? "JSCB/001"
                      : "JSC/001"}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={addStudent}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >

              {/* Name */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter student email"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Father */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Father's Name
                </label>

                <input
                  type="text"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mobile */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  maxLength={10}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Class */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class
                </label>

                <select
                  name="className"
                  value={form.className}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="9th">
                    9th
                  </option>

                  <option value="10th">
                    10th
                  </option>

                  <option value="11th">
                    11th
                  </option>

                  <option value="12th">
                    12th
                  </option>
                </select>
              </div>

              {/* Stream */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stream
                </label>

                <select
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  disabled={
                    !["11th", "12th"].includes(
                      form.className
                    )
                  }
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
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

                {!["11th", "12th"].includes(
                  form.className
                ) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Stream is only available for
                    11th and 12th.
                  </p>
                )}
              </div>

              {/* Branch */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch
                </label>

                <input
                  type="text"
                  value={displayBranch}
                  readOnly
                  className="w-full border rounded-xl px-4 py-3 bg-gray-100 text-gray-700"
                />
              </div>

              {/* Buttons */}

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Student"
                    : "Add Student"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Search */}

        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-7">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Student
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name, email, mobile, Student ID..."
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Class
              </label>

              <select
                value={classFilter}
                onChange={(e) =>
                  setClassFilter(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">
                  All Classes
                </option>

                <option value="9th">
                  9th
                </option>

                <option value="10th">
                  10th
                </option>

                <option value="11th">
                  11th
                </option>

                <option value="12th">
                  12th
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* Students Table */}

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

          <div className="p-5 border-b">

            <h2 className="text-xl font-bold text-gray-900">
              {displayBranch} Students
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing{" "}
              <span className="font-semibold">
                {filteredStudents.length}
              </span>{" "}
              student(s)
            </p>

          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading students...
            </div>
          ) : filteredStudents.length ===
            0 ? (
            <div className="p-10 text-center">

              <div className="text-5xl mb-4">
                🎓
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                No students found
              </h3>

              <p className="text-gray-500 mt-1">
                {search ||
                classFilter !== "All"
                  ? "Try changing your search or filter."
                  : `No students have been added to ${displayBranch} branch yet.`}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Student ID
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Student
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Father Name
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Mobile
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Class
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Stream
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Branch
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.firestoreId ||
                          student.id
                        }
                        className="hover:bg-gray-50"
                      >

                        {/* Student ID */}

                        <td className="px-5 py-4">

                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
                            {student.studentId ||
                              student.id ||
                              "N/A"}
                          </span>

                        </td>

                        {/* Student */}

                        <td className="px-5 py-4">

                          <div>

                            <p className="font-semibold text-gray-900">
                              {student.name ||
                                "N/A"}
                            </p>

                            <p className="text-sm text-gray-500">
                              {student.email ||
                                "N/A"}
                            </p>

                          </div>

                        </td>

                        {/* Father */}

                        <td className="px-5 py-4 text-gray-700">
                          {student.fatherName ||
                            "N/A"}
                        </td>

                        {/* Mobile */}

                        <td className="px-5 py-4 text-gray-700">
                          {student.mobile ||
                            "N/A"}
                        </td>

                        {/* Class */}

                        <td className="px-5 py-4">

                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                            {student.className ||
                              "N/A"}
                          </span>

                        </td>

                        {/* Stream */}

                        <td className="px-5 py-4 text-gray-700">
                          {student.stream ||
                            "—"}
                        </td>

                        {/* Branch */}

                        <td className="px-5 py-4">

                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                            {student.branch ||
                              "N/A"}
                          </span>

                        </td>

                        {/* Actions */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                editStudent(
                                  student
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm transition"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteStudent(
                                  student.firestoreId,
                                  student.studentId ||
                                    student.id
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium text-sm transition"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}

export default Students