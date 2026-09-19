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

function AdminResults({ branch }) {
  const [results, setResults] = useState([])
  const [students, setStudents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentEmail: "",
    className: "9th",
    stream: "",
    exam: "Annual Examination",
    percentage: "",
  })

  useEffect(() => {
    loadData()
  }, [branch])

  const loadData = async () => {
    try {
      setLoading(true)

      const studentQuery = query(
        collection(db, "students"),
        where("branch", "==", branch)
      )

      const studentSnapshot = await getDocs(studentQuery)

      const studentList = studentSnapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter(
          (student) =>
            String(student.status || "").toLowerCase() === "approved"
        )

      setStudents(studentList)

      const resultQuery = query(
        collection(db, "results"),
        where("branch", "==", branch)
      )

      const resultSnapshot = await getDocs(resultQuery)

      const resultList = resultSnapshot.docs.map((item) => ({
        firestoreId: item.id,
        ...item.data(),
      }))

      resultList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })

      setResults(resultList)
    } catch (error) {
      console.error("Error loading results:", error)

      alert(
        `Results load nahi ho pa rahe hain.\n\n${error.message}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "studentId") {
      const selectedStudent = students.find(
        (student) =>
          String(student.firestoreId) === String(value)
      )

      if (!selectedStudent) {
        setForm((prev) => ({
          ...prev,
          studentId: "",
          studentName: "",
          studentEmail: "",
          className: "9th",
          stream: "",
        }))

        return
      }

      setForm((prev) => ({
        ...prev,
        studentId: selectedStudent.firestoreId,
        studentName:
          selectedStudent.name ||
          selectedStudent.studentName ||
          "",
        studentEmail:
          selectedStudent.email ||
          selectedStudent.gmail ||
          selectedStudent.studentEmail ||
          "",
        className:
          selectedStudent.className ||
          selectedStudent.class ||
          "9th",
        stream: selectedStudent.stream || "",
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "className" &&
      !["11th", "12th"].includes(value)
        ? { stream: "" }
        : {}),
    }))
  }

  const addResult = async (e) => {
    e.preventDefault()

    const selectedStudent = students.find(
      (student) =>
        String(student.firestoreId) ===
        String(form.studentId)
    )

    if (!selectedStudent) {
      alert("Please select a student.")
      return
    }

    if (!form.percentage) {
      alert("Please enter percentage.")
      return
    }

    const percentage = Number(form.percentage)

    if (
      Number.isNaN(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      alert(
        "Percentage 0 se 100 ke beech hona chahiye."
      )
      return
    }

    try {
      setSaving(true)

      const resultId = `RES-${Date.now()}`

      const studentGeneratedId =
        selectedStudent.id ||
        selectedStudent.studentId ||
        selectedStudent.studentID ||
        selectedStudent.firestoreId

      const studentEmail = (
        selectedStudent.email ||
        selectedStudent.gmail ||
        selectedStudent.studentEmail ||
        form.studentEmail ||
        ""
      )
        .toLowerCase()
        .trim()

      const studentName =
        selectedStudent.name ||
        selectedStudent.studentName ||
        form.studentName ||
        ""

      const className =
        selectedStudent.className ||
        selectedStudent.class ||
        form.className ||
        "9th"

      const stream =
        selectedStudent.stream ||
        form.stream ||
        ""

      const resultData = {
        resultId,
        studentId: studentGeneratedId,
        studentFirestoreId:
          selectedStudent.firestoreId,
        studentName,
        studentEmail,
        className,
        stream,
        exam: form.exam,
        percentage,
        branch,
        status: "Published",
        createdAt: serverTimestamp(),
      }

      console.log("Saving result:", resultData)

      // ==============================
      // SAVE RESULT
      // ==============================

      await addDoc(
        collection(db, "results"),
        resultData
      )

      // ==============================
      // REALTIME STUDENT NOTIFICATION
      // ==============================

      await sendStudentNotification({
        studentEmail,
        studentId: studentGeneratedId,
        studentFirestoreId: selectedStudent.firestoreId,
        studentName,
        branch,
        className,
        stream,
        title: "New Result Published",
        message: `Your ${form.exam} result has been published. Percentage: ${percentage}%`,
        type: "Result",
      })

      alert(
        "✅ Result successfully saved!\n\n🔔 Student notification sent."
      )

      setForm({
        studentId: "",
        studentName: "",
        studentEmail: "",
        className: "9th",
        stream: "",
        exam: "Annual Examination",
        percentage: "",
      })

      setShowForm(false)

      await loadData()
    } catch (error) {
      console.error(
        "Error saving result:",
        error
      )

      alert(
        `❌ Result save nahi hua.\n\nError: ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteResult = async (
    firestoreId,
    resultId
  ) => {
    const confirmed = window.confirm(
      `Kya aap ${resultId} result delete karna chahte hain?`
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteDoc(
        doc(db, "results", firestoreId)
      )

      setResults((prev) =>
        prev.filter(
          (item) =>
            item.firestoreId !== firestoreId
        )
      )

      alert(
        "Result deleted successfully."
      )
    } catch (error) {
      console.error(
        "Error deleting result:",
        error
      )

      alert(
        `Result delete nahi hua.\n\nError: ${error.message}`
      )
    }
  }

  const filteredResults = results.filter(
    (item) => {
      const text = `
        ${item.studentName || ""}
        ${item.studentEmail || ""}
        ${item.studentId || ""}
        ${item.exam || ""}
        ${item.resultId || ""}
        ${item.className || ""}
        ${item.stream || ""}
      `

      return text
        .toLowerCase()
        .includes(search.toLowerCase())
    }
  )

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-gray-950">
            Results
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage results for {branch} branch.
          </p>
        </div>

        <button
          onClick={() =>
            setShowForm(!showForm)
          }
          className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
        >
          {showForm
            ? "× Close Form"
            : "+ Add Result"}
        </button>

      </div>

      {/* ADD RESULT FORM */}

      {showForm && (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-extrabold">
            Add Student Result
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select registered student and enter examination result.
          </p>

          <form
            onSubmit={addResult}
            className="mt-5 grid gap-5 md:grid-cols-2"
          >

            {/* STUDENT */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Select Student *
              </label>

              <select
                name="studentId"
                value={form.studentId || ""}
                onChange={handleChange}
                required
                className="w-full rounded-xl border px-4 py-3"
              >

                <option value="">
                  Select registered student
                </option>

                {students.length === 0 ? (
                  <option disabled>
                    No approved students found
                  </option>
                ) : (
                  students.map((student) => (
                    <option
                      key={student.firestoreId}
                      value={student.firestoreId}
                    >
                      {student.name ||
                        student.studentName ||
                        "Unnamed Student"}

                      {" — "}

                      {student.id ||
                        student.studentId ||
                        "No ID"}

                      {" — "}

                      {student.className ||
                        student.class}

                      {student.stream
                        ? ` — ${student.stream}`
                        : ""}
                    </option>
                  ))
                )}

              </select>

              {students.length === 0 && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  ⚠️ Pehle approved student register karein.
                </p>
              )}

            </div>

            {/* STUDENT EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Student Gmail
              </label>

              <div className="rounded-xl border bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                {form.studentEmail ||
                  "Automatically selected"}
              </div>

            </div>

            {/* CLASS */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Class
              </label>

              <div className="rounded-xl border bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.className}
              </div>

            </div>

            {/* STREAM */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Stream
              </label>

              <div className="rounded-xl border bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.stream || "—"}
              </div>

            </div>

            {/* EXAM */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Examination *
              </label>

              <select
                name="exam"
                value={form.exam}
                onChange={handleChange}
                className="w-full rounded-xl border px-4 py-3"
              >

                <option value="Annual Examination">
                  Annual Examination
                </option>

                <option value="Half Yearly Examination">
                  Half Yearly Examination
                </option>

                <option value="Monthly Test">
                  Monthly Test
                </option>

                <option value="Board Examination">
                  Board Examination
                </option>

              </select>

            </div>

            {/* PERCENTAGE */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Percentage *
              </label>

              <input
                type="number"
                name="percentage"
                value={form.percentage}
                onChange={handleChange}
                placeholder="Enter percentage"
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full rounded-xl border px-4 py-3"
              />

            </div>

            {/* SAVE */}

            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  saving ||
                  !form.studentId ||
                  !form.percentage
                }
                className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving
                  ? "Saving..."
                  : "Save Result"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* SEARCH */}

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">

        <input
          type="search"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search student, Gmail, result ID, exam..."
          className="w-full max-w-md rounded-xl border px-4 py-3"
        />

      </div>

      {/* RESULTS TABLE */}

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white shadow-sm">

        <table className="w-full min-w-[1100px] text-left">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-5 py-4">
                Result ID
              </th>

              <th className="px-5 py-4">
                Student
              </th>

              <th className="px-5 py-4">
                Student ID
              </th>

              <th className="px-5 py-4">
                Class
              </th>

              <th className="px-5 py-4">
                Exam
              </th>

              <th className="px-5 py-4">
                Percentage
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

            {loading ? (

              <tr>

                <td
                  colSpan="8"
                  className="px-5 py-14 text-center"
                >
                  <p className="font-bold text-gray-600">
                    Loading results...
                  </p>
                </td>

              </tr>

            ) : filteredResults.length === 0 ? (

              <tr>

                <td
                  colSpan="8"
                  className="px-5 py-14 text-center"
                >

                  <div className="text-4xl">
                    📝
                  </div>

                  <p className="mt-3 font-bold">
                    No results found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Add a result using the button above.
                  </p>

                </td>

              </tr>

            ) : (

              filteredResults.map((item) => (

                <tr
                  key={item.firestoreId}
                  className="hover:bg-gray-50"
                >

                  <td className="px-5 py-4">

                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {item.resultId}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <p className="font-bold text-gray-900">
                      {item.studentName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.studentEmail}
                    </p>

                  </td>

                  <td className="px-5 py-4">

                    <span className="font-bold text-gray-700">
                      {item.studentId}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    {item.className}

                    {item.stream
                      ? ` - ${item.stream}`
                      : ""}

                  </td>

                  <td className="px-5 py-4">
                    {item.exam}
                  </td>

                  <td className="px-5 py-4">

                    <span className="font-extrabold text-green-600">
                      {item.percentage}%
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <span className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                      {item.status || "Published"}
                    </span>

                  </td>

                  <td className="px-5 py-4">

                    <button
                      onClick={() =>
                        deleteResult(
                          item.firestoreId,
                          item.resultId
                        )
                      }
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}

export default AdminResults