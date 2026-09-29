import { useState } from "react"
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

function StudentRegister() {
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    email: "",
    mobile: "",
    className: "9th",
    stream: "",
    branch: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [applicationId, setApplicationId] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const generateApplicationId = () => {
    const year = new Date().getFullYear()
    const randomNumber = Math.floor(100000 + Math.random() * 900000)

    return `JSC-${year}-${randomNumber}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log("1. Submit started")

    setSuccess("")
    setSubmitting(true)

    try {
      // Mobile validation
      if (!/^[0-9]{10}$/.test(form.mobile)) {
        alert("Please enter a valid 10-digit mobile number.")
        return
      }

      // Stream validation
      if (
        (form.className === "11th" || form.className === "12th") &&
        !form.stream
      ) {
        alert("Please select your stream.")
        return
      }

      // Branch validation
      if (!form.branch) {
        alert("Please select your branch.")
        return
      }

      const newApplicationId = generateApplicationId()

      console.log("2. Application ID:", newApplicationId)
      console.log("3. Sending data to Firestore...")

      const admissionData = {
        applicationId: newApplicationId,
        name: form.name.trim(),
        fatherName: form.fatherName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile,
        className: form.className,
        stream: form.stream || "",
        branch: form.branch,
        role: "student",
        status: "pending",
        studentId: "",
        createdAt: serverTimestamp(),
      }

      console.log("4. Admission data:", admissionData)

      const docRef = await addDoc(
        collection(db, "admissions"),
        admissionData
      )

      console.log("5. Firestore addDoc completed")
      console.log("6. Firestore Document ID:", docRef.id)

      setApplicationId(newApplicationId)

      setSuccess(
        "Your admission application has been submitted successfully."
      )

      setForm({
        name: "",
        fatherName: "",
        email: "",
        mobile: "",
        className: "9th",
        stream: "",
        branch: "",
      })

      console.log("7. Form submitted successfully")
    } catch (error) {
      console.error("SUBMISSION ERROR:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)

      alert(
        "Application submit nahi hua.\n\n" +
          (error.message || "Unknown error")
      )
    } finally {
      console.log("8. Finally completed")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg sm:p-8">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-red-600">
            Student Admission
          </h1>

          <p className="mt-2 text-gray-600">
            J. Solution Classes
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-xl bg-green-100 p-5 text-green-800">
            <p className="font-bold">
              {success}
            </p>

            <p className="mt-2">
              Your Application ID:
            </p>

            <p className="mt-1 text-2xl font-extrabold">
              {applicationId}
            </p>

            <p className="mt-3 text-sm">
              Please save this Application ID for checking
              your admission status.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Student Name */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Student Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter student name"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          {/* Father Name */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Father's Name
            </label>

            <input
              type="text"
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              placeholder="Enter father's name"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          {/* Gmail */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Gmail
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Mobile Number
            </label>

            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength="10"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          {/* Class */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Class
            </label>

            <select
              name="className"
              value={form.className}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            >
              <option value="9th">9th</option>
              <option value="10th">10th</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
            </select>
          </div>

          {/* Stream */}
          {(form.className === "11th" ||
            form.className === "12th") && (
            <div>
              <label className="mb-2 block font-semibold text-gray-700">
                Stream
              </label>

              <select
                name="stream"
                value={form.stream}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
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

          {/* Branch */}
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Branch
            </label>

            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            >
              <option value="">
                Select Branch
              </option>

              <option value="Itimha">
                Itimha
              </option>

              <option value="Bardiha">
                Bardiha
              </option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>

        </form>

        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">
            Important:
          </p>

          <p className="mt-1">
            Admission approve hone ke baad aap apne
            registered Gmail se Google Login kar sakte hain.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="font-semibold text-red-600 hover:underline"
          >
            Already approved? Login here
          </a>
        </div>

      </div>
    </div>
  )
}

export default StudentRegister