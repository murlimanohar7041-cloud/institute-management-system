import { useState } from "react"

function Fees({ branch }) {
  // =========================================================
  // FEE STRUCTURE
  // =========================================================

  const getFeeStructure = (className, stream) => {
    if (className === "9th") {
      return {
        type: "Monthly",
        total: 200,
        label: "₹200 / month",
      }
    }

    if (className === "10th") {
      return {
        type: "Monthly",
        total: 300,
        label: "₹300 / month",
      }
    }

    if (className === "11th" && stream === "Arts") {
      return {
        type: "Yearly",
        total: 4000,
        label: "₹4,000 / year",
      }
    }

    if (className === "11th" && stream === "Science") {
      return {
        type: "Yearly",
        total: 6000,
        label: "₹6,000 / year",
      }
    }

    if (className === "12th" && stream === "Arts") {
      return {
        type: "Yearly",
        total: 5000,
        label: "₹5,000 / year",
      }
    }

    if (className === "12th" && stream === "Science") {
      return {
        type: "Yearly",
        total: 7000,
        label: "₹7,000 / year",
      }
    }

    return {
      type: "Unknown",
      total: 0,
      label: "Fee not configured",
    }
  }

  // =========================================================
  // LOAD FEES
  // =========================================================

  const [fees, setFees] = useState(() => {
    try {
      const savedFees = localStorage.getItem("fees")
      return savedFees ? JSON.parse(savedFees) : []
    } catch (error) {
      console.error("Error loading fees:", error)
      return []
    }
  })

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  const students = (() => {
    try {
      const savedStudents = localStorage.getItem("students")
      return savedStudents ? JSON.parse(savedStudents) : []
    } catch (error) {
      console.error("Error loading students:", error)
      return []
    }
  })()

  // =========================================================
  // UI STATES
  // =========================================================

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("All")

  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    className: "",
    stream: "",
    feeType: "",
    totalFee: "",
    amount: "",
    month: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  })

  // =========================================================
  // CURRENT BRANCH STUDENTS
  // =========================================================

  const branchStudents = students.filter(
    (student) => student.branch === branch
  )

  // =========================================================
  // CURRENT BRANCH FEES
  // =========================================================

  const branchFees = fees.filter(
    (fee) => fee.branch === branch
  )

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    // -------------------------------------------------------
    // STUDENT SELECT
    // -------------------------------------------------------

    if (name === "studentId") {
      const selectedStudent = branchStudents.find(
        (student) => String(student.id) === String(value)
      )

      if (selectedStudent) {
        const feeInfo = getFeeStructure(
          selectedStudent.className,
          selectedStudent.stream
        )

        setForm((prev) => ({
          ...prev,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          className: selectedStudent.className || "",
          stream: selectedStudent.stream || "",
          feeType: feeInfo.type,
          totalFee: feeInfo.total,
          amount: "",
          month: "",
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          studentId: "",
          studentName: "",
          className: "",
          stream: "",
          feeType: "",
          totalFee: "",
          amount: "",
          month: "",
        }))
      }

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // =========================================================
  // GET STUDENT PAYMENT TOTAL
  // =========================================================

  const getStudentPaidAmount = (studentId) => {
    return branchFees
      .filter(
        (fee) =>
          String(fee.studentId) === String(studentId)
      )
      .reduce(
        (total, fee) => total + Number(fee.amount || 0),
        0
      )
  }

  // =========================================================
  // GET STUDENT PENDING
  // =========================================================

  const getStudentPending = (studentId, totalFee) => {
    const paid = getStudentPaidAmount(studentId)

    return Math.max(
      Number(totalFee || 0) - paid,
      0
    )
  }

  // =========================================================
  // ADD FEE / PAYMENT
  // =========================================================

  const addFee = (e) => {
    e.preventDefault()

    if (!form.studentId) {
      alert("Please select a student")
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    // -------------------------------------------------------
    // MONTHLY FEE VALIDATION
    // -------------------------------------------------------

    if (
      form.feeType === "Monthly" &&
      !form.month
    ) {
      alert("Please select a month")
      return
    }

    // -------------------------------------------------------
    // CHECK TOTAL FEE
    // -------------------------------------------------------

    const alreadyPaid = getStudentPaidAmount(
      form.studentId
    )

    const totalFee = Number(form.totalFee)

    const newAmount = Number(form.amount)

    const remaining = totalFee - alreadyPaid

    if (newAmount > remaining) {
      alert(
        `Maximum payable amount is ₹${remaining}`
      )
      return
    }

    // -------------------------------------------------------
    // MONTHLY DUPLICATE CHECK
    // -------------------------------------------------------

    if (form.feeType === "Monthly") {
      const alreadyPaidThisMonth =
        branchFees.some(
          (fee) =>
            String(fee.studentId) ===
              String(form.studentId) &&
            fee.month === form.month
        )

      if (alreadyPaidThisMonth) {
        alert(
          `${form.month} payment is already recorded for this student.`
        )
        return
      }

      // Monthly fee should be exactly 200/300
      if (newAmount !== totalFee) {
        alert(
          `For ${form.className}, monthly fee is ₹${totalFee}.`
        )
        return
      }
    }

    // -------------------------------------------------------
    // STATUS
    // -------------------------------------------------------

    const newPaidTotal =
      alreadyPaid + newAmount

    const status =
      newPaidTotal >= totalFee
        ? "Paid"
        : "Partial"

    // -------------------------------------------------------
    // NEW PAYMENT
    // -------------------------------------------------------

    const newFee = {
      id: `FEE-${Date.now()}`,

      studentId: form.studentId,

      studentName: form.studentName,

      className: form.className,

      stream: form.stream,

      feeType: form.feeType,

      totalFee: totalFee,

      amount: newAmount,

      paidAfterPayment: newPaidTotal,

      pendingAfterPayment: Math.max(
        totalFee - newPaidTotal,
        0
      ),

      month:
        form.feeType === "Monthly"
          ? form.month
          : "",

      status: status,

      date: form.date,

      note: form.note.trim(),

      branch: branch,

      createdAt:
        new Date().toISOString(),
    }

    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    setFees((prev) => {
      const updatedFees = [
        ...prev,
        newFee,
      ]

      localStorage.setItem(
        "fees",
        JSON.stringify(updatedFees)
      )

      return updatedFees
    })

    // -------------------------------------------------------
    // RESET
    // -------------------------------------------------------

    setForm({
      studentId: "",
      studentName: "",
      className: "",
      stream: "",
      feeType: "",
      totalFee: "",
      amount: "",
      month: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
      note: "",
    })

    setShowForm(false)

    alert("Payment saved successfully!")
  }

  // =========================================================
  // DELETE PAYMENT
  // =========================================================

  const deleteFee = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment record?"
    )

    if (!confirmDelete) return

    setFees((prev) => {
      const updatedFees = prev.filter(
        (fee) => fee.id !== id
      )

      localStorage.setItem(
        "fees",
        JSON.stringify(updatedFees)
      )

      return updatedFees
    })
  }

  // =========================================================
  // FILTER FEES
  // =========================================================

  const filteredFees = branchFees.filter(
    (fee) => {
      const classMatch =
        classFilter === "All" ||
        fee.className === classFilter

      const text = `
        ${fee.studentName}
        ${fee.className}
        ${fee.stream || ""}
        ${fee.id}
        ${fee.status}
        ${fee.amount}
        ${fee.month || ""}
        ${fee.note || ""}
      `

      const searchMatch =
        text
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )

      return (
        classMatch &&
        searchMatch
      )
    }
  )

  // =========================================================
  // TOTAL PAYMENT
  // =========================================================

  const totalPaidAmount =
    branchFees.reduce(
      (total, fee) =>
        total +
        Number(fee.amount || 0),
      0
    )

  // =========================================================
  // CLASS STUDENT COUNT
  // =========================================================

  const getClassStudentCount = (
    className
  ) => {
    return branchStudents.filter(
      (student) =>
        student.className === className
    ).length
  }

  // =========================================================
  // CLASS PAYMENT TOTAL
  // =========================================================

  const getClassPaid = (
    className
  ) => {
    return branchFees
      .filter(
        (fee) =>
          fee.className === className
      )
      .reduce(
        (total, fee) =>
          total +
          Number(fee.amount || 0),
        0
      )
  }

  // =========================================================
  // CLASS FILTER COUNT
  // =========================================================

  const getClassFeeCount = (
    className
  ) => {
    return branchFees.filter(
      (fee) =>
        fee.className === className
    ).length
  }

  // =========================================================
  // CURRENT SELECTED STUDENT INFO
  // =========================================================

  const selectedStudentPaid =
    form.studentId
      ? getStudentPaidAmount(
          form.studentId
        )
      : 0

  const selectedStudentPending =
    form.studentId
      ? getStudentPending(
          form.studentId,
          form.totalFee
        )
      : 0

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <p className="text-sm font-semibold text-red-600">
            Fee Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
            Fees & Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage student fees for {branch} branch.
          </p>

        </div>

        <button
          onClick={() =>
            setShowForm(!showForm)
          }
          className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-800"
        >
          {showForm
            ? "× Close Form"
            : "+ Add Payment"}
        </button>

      </div>

      {/* =====================================================
          FEE STRUCTURE
      ===================================================== */}

      <div className="mt-6">

        <h2 className="mb-3 text-lg font-extrabold text-gray-900">
          Fee Structure
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              Class 9th
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹200
            </p>
            <p className="text-xs text-gray-500">
              Per Month
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              Class 10th
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹300
            </p>
            <p className="text-xs text-gray-500">
              Per Month
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              11th Arts
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹4,000
            </p>
            <p className="text-xs text-gray-500">
              Per Year
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              11th Science
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹6,000
            </p>
            <p className="text-xs text-gray-500">
              Per Year
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              12th Arts
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹5,000
            </p>
            <p className="text-xs text-gray-500">
              Per Year
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">
              12th Science
            </p>
            <p className="mt-2 text-xl font-extrabold text-blue-700">
              ₹7,000
            </p>
            <p className="text-xs text-gray-500">
              Per Year
            </p>
          </div>

        </div>

      </div>

      {/* =====================================================
          CLASS SUMMARY
      ===================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <button
          onClick={() =>
            setClassFilter("All")
          }
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
            Registered Students
          </p>

        </button>

        {[
          "9th",
          "10th",
          "11th",
          "12th",
        ].map((className) => (

          <button
            key={className}
            onClick={() =>
              setClassFilter(
                className
              )
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
              {getClassStudentCount(
                className
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Students
            </p>

            <p className="mt-2 text-xs font-bold text-blue-600">
              {getClassFeeCount(
                className
              )} Payments
            </p>

          </button>

        ))}

      </div>

      {/* =====================================================
          PAYMENT SUMMARY
      ===================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <p className="text-sm font-bold text-gray-500">
            Total Payment
          </p>

          <p className="mt-2 text-3xl font-extrabold text-gray-950">
            ₹{totalPaidAmount}
          </p>

        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">

          <p className="text-sm font-bold text-green-600">
            Payment Records
          </p>

          <p className="mt-2 text-3xl font-extrabold text-green-700">
            {branchFees.length}
          </p>

        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

          <p className="text-sm font-bold text-blue-600">
            Registered Students
          </p>

          <p className="mt-2 text-3xl font-extrabold text-blue-700">
            {branchStudents.length}
          </p>

        </div>

      </div>

      {/* =====================================================
          ADD PAYMENT FORM
      ===================================================== */}

      {showForm && (

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-extrabold text-gray-950">
                Add Student Payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a registered student. Fee will be calculated automatically.
              </p>

            </div>

            <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              {branch}
            </span>

          </div>

          <form
            onSubmit={addFee}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >

            {/* =================================================
                STUDENT
            ================================================= */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Select Student *
              </label>

              <select
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  Select registered student
                </option>

                {branchStudents.length === 0 ? (

                  <option
                    value=""
                    disabled
                  >
                    No students registered in {branch}
                  </option>

                ) : (

                  branchStudents.map(
                    (student) => (

                      <option
                        key={student.id}
                        value={student.id}
                      >

                        {student.name}
                        {" — "}
                        {student.className}

                        {student.stream
                          ? ` — ${student.stream}`
                          : ""}

                      </option>

                    )
                  )

                )}

              </select>

              {branchStudents.length === 0 && (

                <p className="mt-2 text-sm font-semibold text-red-600">
                  ⚠️ First register a student in Students section.
                </p>

              )}

            </div>

            {/* =================================================
                STUDENT NAME
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Student Name
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.studentName ||
                  "Automatically selected"}
              </div>

            </div>

            {/* =================================================
                CLASS
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Class
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.className ||
                  "Automatically selected"}
              </div>

            </div>

            {/* =================================================
                STREAM
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Stream
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.stream || "—"}
              </div>

            </div>

            {/* =================================================
                FEE TYPE
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Fee Type
              </label>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-bold text-blue-700">
                {form.feeType || "—"}
              </div>

            </div>

            {/* =================================================
                TOTAL FEE
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Applicable Fee
              </label>

              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 font-extrabold text-green-700">
                {form.totalFee
                  ? `₹${form.totalFee} ${
                      form.feeType === "Monthly"
                        ? "/ month"
                        : "/ year"
                    }`
                  : "Automatically calculated"}
              </div>

            </div>

            {/* =================================================
                PAID
            ================================================= */}

            {form.studentId && (

              <div>

                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Already Paid
                </label>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 font-extrabold text-blue-700">
                  ₹{selectedStudentPaid}
                </div>

              </div>

            )}

            {/* =================================================
                PENDING
            ================================================= */}

            {form.studentId && (

              <div>

                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Pending
                </label>

                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 font-extrabold text-red-700">
                  ₹{selectedStudentPending}
                </div>

              </div>

            )}

            {/* =================================================
                MONTH
            ================================================= */}

            {form.feeType === "Monthly" && (

              <div>

                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Select Month *
                </label>

                <select
                  name="month"
                  value={form.month}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >

                  <option value="">
                    Select month
                  </option>

                  <option value="January">
                    January
                  </option>

                  <option value="February">
                    February
                  </option>

                  <option value="March">
                    March
                  </option>

                  <option value="April">
                    April
                  </option>

                  <option value="May">
                    May
                  </option>

                  <option value="June">
                    June
                  </option>

                  <option value="July">
                    July
                  </option>

                  <option value="August">
                    August
                  </option>

                  <option value="September">
                    September
                  </option>

                  <option value="October">
                    October
                  </option>

                  <option value="November">
                    November
                  </option>

                  <option value="December">
                    December
                  </option>

                </select>

              </div>

            )}

            {/* =================================================
                PAYMENT AMOUNT
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Payment Amount *
              </label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder={
                  form.totalFee
                    ? `Enter amount (Max ₹${selectedStudentPending})`
                    : "Select student first"
                }
                min="1"
                max={
                  selectedStudentPending ||
                  undefined
                }
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {/* =================================================
                DATE
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Payment Date *
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {/* =================================================
                NOTE
            ================================================= */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-bold text-gray-700">
                Note
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Optional note"
                rows="3"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {/* =================================================
                SAVE
            ================================================= */}

            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  !form.studentId ||
                  !form.amount ||
                  selectedStudentPending <= 0
                }
                className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Save Payment
              </button>

            </div>

          </form>

        </div>

      )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-md">

            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={`Search ${branch} payment...`}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-11 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              🔍
            </span>

          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-2.5">

            <span className="text-sm font-bold text-blue-700">
              {branch}
              {" • "}
              {classFilter === "All"
                ? "All Classes"
                : `Class ${classFilter}`}
              {" : "}
              {filteredFees.length}
            </span>

          </div>

        </div>

      </div>

      {/* =====================================================
          PAYMENT TABLE
      ===================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px] text-left">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Payment ID
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Student
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Class
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Stream
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Fee
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Paid
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Pending
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Month
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Date
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase text-gray-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {filteredFees.length === 0 ? (

                <tr>

                  <td
                    colSpan="11"
                    className="px-5 py-14 text-center"
                  >

                    <div className="text-4xl">
                      💰
                    </div>

                    <p className="mt-3 font-bold text-gray-800">
                      No payment records found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Click "Add Payment" to record a student payment.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredFees.map(
                  (fee) => {

                    const studentTotalFee =
                      Number(
                        fee.totalFee || 0
                      )

                    const currentPaid =
                      getStudentPaidAmount(
                        fee.studentId
                      )

                    const currentPending =
                      Math.max(
                        studentTotalFee -
                          currentPaid,
                        0
                      )

                    return (

                      <tr
                        key={fee.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* PAYMENT ID */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {fee.id}
                          </span>

                        </td>

                        {/* STUDENT */}

                        <td className="px-5 py-4">

                          <p className="font-bold text-gray-900">
                            {fee.studentName}
                          </p>

                          {fee.note && (

                            <p className="mt-1 text-xs text-gray-500">
                              {fee.note}
                            </p>

                          )}

                        </td>

                        {/* CLASS */}

                        <td className="px-5 py-4">

                          <span className="font-semibold text-gray-800">
                            {fee.className}
                          </span>

                        </td>

                        {/* STREAM */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {fee.stream || "—"}
                        </td>

                        {/* TOTAL FEE */}

                        <td className="px-5 py-4">

                          <p className="font-bold text-gray-900">
                            ₹{fee.totalFee}
                          </p>

                          <p className="text-xs text-gray-500">
                            {fee.feeType}
                          </p>

                        </td>

                        {/* PAYMENT */}

                        <td className="px-5 py-4">

                          <span className="font-extrabold text-green-700">
                            ₹{fee.amount}
                          </span>

                        </td>

                        {/* PENDING */}

                        <td className="px-5 py-4">

                          <span
                            className={`font-extrabold ${
                              currentPending === 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            ₹{currentPending}
                          </span>

                        </td>

                        {/* MONTH */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {fee.month || "Yearly"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                              currentPending === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {currentPending === 0
                              ? "Paid"
                              : "Partial"}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {fee.date}
                        </td>

                        {/* DELETE */}

                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              deleteFee(
                                fee.id
                              )
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

        <p className="text-sm font-bold text-blue-700">
          ℹ️ {branch} Branch — Fee System
        </p>

        <div className="mt-2 space-y-1 text-sm leading-6 text-gray-600">

          <p>
            • Class 9th: ₹200 per month
          </p>

          <p>
            • Class 10th: ₹300 per month
          </p>

          <p>
            • 11th Arts: ₹4,000 per year
          </p>

          <p>
            • 11th Science: ₹6,000 per year
          </p>

          <p>
            • 12th Arts: ₹5,000 per year
          </p>

          <p>
            • 12th Science: ₹7,000 per year
          </p>

          <p className="pt-2 font-semibold text-blue-700">
            Student select karte hi applicable fee automatically calculate hogi.
            11th/12th me partial payment bhi record ki ja sakti hai.
          </p>

        </div>

      </div>

    </div>
  )
}

export default Fees