import { useMemo, useState } from "react"

function StudentDashboard({ branch }) {
  // =========================
  // LOAD STUDENTS
  // =========================
  const students = useMemo(() => {
    try {
      const savedStudents = localStorage.getItem("students")
      return savedStudents ? JSON.parse(savedStudents) : []
    } catch (error) {
      console.error("Error loading students:", error)
      return []
    }
  }, [])

  // =========================
  // LOAD FEES
  // =========================
  const fees = useMemo(() => {
    try {
      const savedFees = localStorage.getItem("fees")
      return savedFees ? JSON.parse(savedFees) : []
    } catch (error) {
      console.error("Error loading fees:", error)
      return []
    }
  }, [])

  // =========================
  // STATES
  // =========================
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("All")
  const [selectedStudent, setSelectedStudent] = useState(null)

  // =========================
  // FEE STRUCTURE
  // =========================
  const getFeeStructure = (student) => {
    if (!student) {
      return {
        amount: 0,
        type: "",
        label: "No fee structure",
      }
    }

    if (student.className === "9th") {
      return {
        amount: 200,
        type: "Monthly",
        label: "₹200 / Month",
      }
    }

    if (student.className === "10th") {
      return {
        amount: 300,
        type: "Monthly",
        label: "₹300 / Month",
      }
    }

    if (student.className === "11th") {
      if (student.stream === "Science") {
        return {
          amount: 6000,
          type: "Yearly",
          label: "₹6,000 / Year",
        }
      }

      if (student.stream === "Arts") {
        return {
          amount: 4000,
          type: "Yearly",
          label: "₹4,000 / Year",
        }
      }
    }

    if (student.className === "12th") {
      if (student.stream === "Science") {
        return {
          amount: 7000,
          type: "Yearly",
          label: "₹7,000 / Year",
        }
      }

      if (student.stream === "Arts") {
        return {
          amount: 5000,
          type: "Yearly",
          label: "₹5,000 / Year",
        }
      }
    }

    return {
      amount: 0,
      type: "",
      label: "Fee not configured",
    }
  }

  // =========================
  // CURRENT BRANCH STUDENTS
  // =========================
  const branchStudents = students.filter(
    (student) => student.branch === branch
  )

  // =========================
  // FILTER STUDENTS
  // =========================
  const filteredStudents = branchStudents.filter((student) => {
    const classMatch =
      classFilter === "All" ||
      student.className === classFilter

    const text = `
      ${student.id}
      ${student.name}
      ${student.fatherName}
      ${student.mobile}
      ${student.className}
      ${student.stream || ""}
    `

    const searchMatch = text
      .toLowerCase()
      .includes(search.toLowerCase())

    return classMatch && searchMatch
  })

  // =========================
  // CLASS COUNT
  // =========================
  const getClassCount = (className) => {
    return branchStudents.filter(
      (student) => student.className === className
    ).length
  }

  // =========================
  // STUDENT FEES
  // =========================
  const getStudentFees = (studentId) => {
    return fees.filter(
      (fee) =>
        fee.studentId === studentId &&
        fee.branch === branch
    )
  }

  const getTotalPaid = (studentId) => {
    return getStudentFees(studentId)
      .filter((fee) => fee.status === "Paid")
      .reduce(
        (total, fee) => total + Number(fee.amount || 0),
        0
      )
  }

  const getTotalPending = (studentId) => {
    return getStudentFees(studentId)
      .filter((fee) => fee.status === "Pending")
      .reduce(
        (total, fee) => total + Number(fee.amount || 0),
        0
      )
  }

  // =========================
  // SELECTED STUDENT DATA
  // =========================
  const selectedFees = selectedStudent
    ? getStudentFees(selectedStudent.id)
    : []

  const selectedPaid = selectedStudent
    ? getTotalPaid(selectedStudent.id)
    : 0

  const selectedPending = selectedStudent
    ? getTotalPending(selectedStudent.id)
    : 0

  const selectedStructure = selectedStudent
    ? getFeeStructure(selectedStudent)
    : null

  // =========================
  // VIEW DASHBOARD
  // =========================
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-blue-600">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
              {selectedStudent.name}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Complete student profile and fee information.
            </p>
          </div>

          <button
            onClick={() => setSelectedStudent(null)}
            className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-gray-800"
          >
            ← Back to Students
          </button>
        </div>

        {/* STUDENT PROFILE */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
              👨‍🎓
            </div>

            <div className="flex-1">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-2xl font-extrabold text-gray-950">
                    {selectedStudent.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Student ID:{" "}
                    <span className="font-bold text-blue-700">
                      {selectedStudent.id}
                    </span>
                  </p>
                </div>

                <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                  {branch}
                </span>

              </div>

            </div>

          </div>

          {/* DETAILS */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Student ID
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.id}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Student Name
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.name}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Father's Name
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.fatherName}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Mobile
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.mobile}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Class
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.className}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">
                Stream
              </p>

              <p className="mt-1 font-extrabold text-gray-900">
                {selectedStudent.stream || "—"}
              </p>
            </div>

          </div>
        </div>

        {/* FEE STRUCTURE */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-7">

          <p className="text-sm font-bold text-blue-600">
            Fee Structure
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-extrabold text-gray-950">
                {selectedStudent.className}
                {selectedStudent.stream
                  ? ` — ${selectedStudent.stream}`
                  : ""}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Applicable fee: {selectedStructure.label}
              </p>
            </div>

            <div className="text-3xl font-extrabold text-blue-700">
              ₹{selectedStructure.amount}
            </div>

          </div>
        </div>

        {/* FEE SUMMARY */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              Applicable Fee
            </p>

            <p className="mt-2 text-3xl font-extrabold text-gray-950">
              ₹{selectedStructure.amount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {selectedStructure.type}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-green-600">
              Paid
            </p>

            <p className="mt-2 text-3xl font-extrabold text-green-700">
              ₹{selectedPaid}
            </p>

            <p className="mt-1 text-xs text-green-600">
              Total paid
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-red-600">
              Pending
            </p>

            <p className="mt-2 text-3xl font-extrabold text-red-700">
              ₹{selectedPending}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Pending payments
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-blue-600">
              Payments
            </p>

            <p className="mt-2 text-3xl font-extrabold text-blue-700">
              {selectedFees.length}
            </p>

            <p className="mt-1 text-xs text-blue-600">
              Fee records
            </p>
          </div>

        </div>

        {/* PAYMENT HISTORY */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-gray-950">
              Payment History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All fee records of this student.
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-left">

              <thead className="border-b border-gray-200 bg-gray-50">

                <tr>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                    Fee ID
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                    Note
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {selectedFees.length === 0 ? (

                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-12 text-center"
                    >
                      <div className="text-4xl">
                        💰
                      </div>

                      <p className="mt-3 font-bold text-gray-800">
                        No payment records
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Payment records will appear here after payment.
                      </p>
                    </td>
                  </tr>

                ) : (

                  selectedFees.map((fee) => (

                    <tr
                      key={fee.id}
                      className="transition hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          {fee.id}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {fee.date}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-gray-900">
                        ₹{fee.amount}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            fee.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {fee.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {fee.note || "—"}
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* FUTURE PAYMENT SECTION */}
        <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

          <p className="text-sm font-bold text-yellow-700">
            💡 Next Step
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            Isi student dashboard se next step me payment
            system connect kiya jayega. Payment ke baad
            automatic receipt generate aur print ki ja sakegi.
          </p>

        </div>

      </div>
    )
  }

  // =========================
  // STUDENT LIST
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-semibold text-blue-600">
            Student Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
            Student Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View complete student information and fee details.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3">

          <p className="text-xs font-semibold text-gray-500">
            Active Branch
          </p>

          <p className="font-extrabold text-blue-700">
            {branch}
          </p>

        </div>

      </div>

      {/* CLASS SUMMARY */}
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
            All Students
          </p>

          <p className="mt-2 text-3xl font-extrabold text-gray-950">
            {branchStudents.length}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Students
          </p>

        </button>

        {["9th", "10th", "11th", "12th"].map(
          (className) => (

            <button
              key={className}
              onClick={() => setClassFilter(className)}
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

      {/* SEARCH */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-md">

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${branch} student...`}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-11 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              🔍
            </span>

          </div>

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

      {/* STUDENT CARDS */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {filteredStudents.length === 0 ? (

          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-gray-200 bg-white p-14 text-center shadow-sm">

            <div className="text-5xl">
              👨‍🎓
            </div>

            <p className="mt-4 font-bold text-gray-800">
              No students found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Register students from the Students section first.
            </p>

          </div>

        ) : (

          filteredStudents.map((student) => {

            const paid = getTotalPaid(student.id)
            const pending = getTotalPending(student.id)
            const structure = getFeeStructure(student)

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* CARD HEADER */}
                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                      👨‍🎓
                    </div>

                    <div>

                      <h3 className="font-extrabold text-gray-950">
                        {student.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-blue-600">
                        {student.id}
                      </p>

                    </div>

                  </div>

                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                    {student.className}
                  </span>

                </div>

                {/* INFO */}
                <div className="mt-5 space-y-2">

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      Father's Name
                    </span>

                    <span className="font-bold text-gray-800">
                      {student.fatherName}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      Mobile
                    </span>

                    <span className="font-bold text-gray-800">
                      {student.mobile}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      Stream
                    </span>

                    <span className="font-bold text-gray-800">
                      {student.stream || "—"}
                    </span>
                  </div>

                </div>

                {/* FEE */}
                <div className="mt-5 rounded-xl bg-gray-50 p-4">

                  <div className="flex justify-between">

                    <span className="text-xs font-bold text-gray-500">
                      Applicable Fee
                    </span>

                    <span className="text-sm font-extrabold text-gray-900">
                      {structure.label}
                    </span>

                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <div>
                      <p className="text-xs text-gray-500">
                        Paid
                      </p>

                      <p className="mt-1 font-extrabold text-green-600">
                        ₹{paid}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Pending
                      </p>

                      <p className="mt-1 font-extrabold text-red-600">
                        ₹{pending}
                      </p>
                    </div>

                  </div>

                </div>

                {/* BUTTON */}
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800"
                >
                  View Student Dashboard →
                </button>

              </div>
            )
          })

        )}

      </div>

      {/* INFO */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

        <p className="text-sm font-bold text-blue-700">
          ℹ️ Student Dashboard
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-600">
          Registered students automatically यहाँ दिखाई देंगे।
          किसी student के "View Student Dashboard" पर click
          करके उसकी complete information, fee structure,
          paid amount, pending amount और payment history देख
          सकते हैं।
        </p>

      </div>

    </div>
  )
}

export default StudentDashboard