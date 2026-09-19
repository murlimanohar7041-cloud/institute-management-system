import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

function Admission() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    className: "9th",
    stream: "",
    branch: "Itimha",
    message: "",
  })

  const [sending, setSending] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) {
      alert("Student Name bharna zaroori hai.")
      return
    }

    if (!form.email.trim()) {
      alert("Gmail / Email bharna zaroori hai.")
      return
    }

    if (!form.email.includes("@")) {
      alert("Valid Gmail / Email enter kijiye.")
      return
    }

    if (!form.mobile.trim()) {
      alert("Mobile Number bharna zaroori hai.")
      return
    }

    if (form.mobile.length !== 10) {
      alert("10 digit Mobile Number enter kijiye.")
      return
    }

    if (
      (form.className === "11th" || form.className === "12th") &&
      !form.stream
    ) {
      alert("11th/12th ke liye Stream select kijiye.")
      return
    }

    try {
      setSending(true)

      await addDoc(collection(db, "admissions"), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        className: form.className,
        stream: form.stream,
        branch: form.branch,
        message: form.message.trim(),
        status: "New",
        createdAt: serverTimestamp(),
      })

      alert("Admission enquiry successfully send ho gayi! ✅")

      setForm({
        name: "",
        email: "",
        mobile: "",
        className: "9th",
        stream: "",
        branch: "Itimha",
        message: "",
      })
    } catch (error) {
      console.error("Admission enquiry error:", error)
      alert("Enquiry send nahi ho payi. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      id="admission"
      className="scroll-mt-24 px-5 py-10 lg:px-8"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-red-600 p-8 text-white sm:p-12">

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

          <div>
            <p className="font-bold uppercase tracking-widest text-red-100">
              Start Your Journey
            </p>

            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Ready to start learning?
            </h2>

            <p className="mt-3 max-w-2xl text-red-100">
              Apply for admission at J. Solution Classes
              and start your learning journey with us.
            </p>

            <div className="mt-6 space-y-3 text-red-50">
              <p>✓ Classes 9th to 12th</p>
              <p>✓ Science & Arts for 11th–12th</p>
              <p>✓ Experienced Faculty</p>
              <p>✓ Itimha & Bardiha Branch</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 text-gray-800 shadow-2xl sm:p-8">

            <h3 className="text-2xl font-extrabold text-gray-900">
              Admission Enquiry
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Fill the form and our team will contact you.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">

              {/* Student Name */}
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Student Name"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />

              {/* Gmail / Email */}
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Gmail / Email Address"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />

              {/* Mobile */}
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="Mobile Number"
                maxLength="10"
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />

              {/* Class */}
              <select
                name="className"
                value={form.className}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              >
                <option value="9th">Class 9th</option>
                <option value="10th">Class 10th</option>
                <option value="11th">Class 11th</option>
                <option value="12th">Class 12th</option>
              </select>

              {/* Stream */}
              {(form.className === "11th" ||
                form.className === "12th") && (
                <select
                  name="stream"
                  value={form.stream}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
                >
                  <option value="">Select Stream</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                </select>
              )}

              {/* Branch */}
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              >
                <option value="Itimha">Itimha Branch</option>
                <option value="Bardiha">Bardiha Branch</option>
              </select>

              {/* Message */}
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Message (Optional)"
                rows="3"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
              />

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Enquiry"}
              </button>

            </form>
          </div>

        </div>
      </div>
    </section>
  )
}

export default Admission