import { useState } from "react"
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth"

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore"

import { auth, db } from "../firebase"

function Login() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const ADMIN_EMAIL = "murlimanohar7041@gmail.com"
  const FACULTY_EMAIL = "mdey9006690@gmail.com"

  const handleGoogleLogin = async () => {
    try {
      setError("")
      setLoading(true)

      // =========================
      // GOOGLE PROVIDER
      // =========================

      const provider = new GoogleAuthProvider()

      provider.setCustomParameters({
        prompt: "select_account",
      })

      // =========================
      // GOOGLE LOGIN
      // =========================

      const result = await signInWithPopup(auth, provider)

      const user = result.user

      const email = user.email?.trim().toLowerCase()

      if (!email) {
        setError("Google account email nahi mila.")
        await signOut(auth)
        return
      }

      console.log("Logged in email:", email)

      // =========================
      // ADMIN
      // =========================

      if (email === ADMIN_EMAIL.toLowerCase()) {
        console.log("Admin login successful")

        localStorage.setItem("userRole", "admin")
        localStorage.setItem("userEmail", email)
        localStorage.setItem(
          "userName",
          user.displayName || "Admin"
        )

        window.location.href = "/admin"
        return
      }

      // =========================
      // FACULTY
      // =========================

      if (email === FACULTY_EMAIL.toLowerCase()) {
        console.log("Faculty login successful")

        localStorage.setItem("userRole", "faculty")
        localStorage.setItem("userEmail", email)
        localStorage.setItem(
          "userName",
          user.displayName || "Faculty"
        )

        window.location.href = "/faculty"
        return
      }

      // =========================
      // STUDENT
      // =========================

      console.log("Checking student in Firestore...")

      const studentsRef = collection(db, "students")

      const studentQuery = query(
        studentsRef,
        where("email", "==", email)
      )

      const studentSnapshot = await getDocs(studentQuery)

      // =========================
      // STUDENT NOT FOUND
      // =========================

      if (studentSnapshot.empty) {
        console.log("Student not found")

        setError(
          "Aapka account student ke roop me registered nahi hai. Please pehle admission apply karein aur Admin approval lein."
        )

        await signOut(auth)
        return
      }

      // =========================
      // STUDENT DATA
      // =========================

      const studentDoc = studentSnapshot.docs[0]
      const student = studentDoc.data()

      console.log("Student found:", student)

      // =========================
      // APPROVAL CHECK
      // =========================

      if (student.status !== "approved") {
        console.log(
          "Student approval pending/rejected:",
          student.status
        )

        if (student.status === "rejected") {
          setError(
            "Aapki admission application reject ho gayi hai. Please Admin se contact karein."
          )
        } else {
          setError(
            "Aapki admission abhi approved nahi hui hai. Please Admin approval ka wait karein."
          )
        }

        await signOut(auth)
        return
      }

      // =========================
      // APPROVED STUDENT
      // =========================

      console.log("Student approved. Login successful.")

      localStorage.setItem("userRole", "student")
      localStorage.setItem("userEmail", email)

      localStorage.setItem(
        "userName",
        student.name || user.displayName || "Student"
      )

      localStorage.setItem(
        "studentId",
        student.studentId || ""
      )

      localStorage.setItem(
        "studentBranch",
        student.branch || ""
      )

      localStorage.setItem(
        "studentClass",
        student.className || ""
      )

      localStorage.setItem(
        "studentStream",
        student.stream || ""
      )

      // =========================
      // GO TO STUDENT DASHBOARD
      // =========================

      window.location.href = "/student"
      return

    } catch (err) {
      console.error("Google Login Error:", err)
      console.error("Error Code:", err.code)
      console.error("Error Message:", err.message)

      if (err.code === "auth/popup-closed-by-user") {
        setError("Google login window close kar di gayi.")
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Browser ne Google login popup block kar diya."
        )
      } else if (err.code === "auth/invalid-credential") {
        setError(
          "Google credential invalid hai. Firebase Authentication me Google Sign-in provider check karein."
        )
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Ye website Firebase Authorized Domains me registered nahi hai."
        )
      } else if (
        err.code === "permission-denied" ||
        err.code === "failed-precondition"
      ) {
        setError(
          "Firestore permission error. Firebase Firestore Rules check karein."
        )
      } else {
        setError(
          `Google login failed: ${err.code || "Unknown error"}`
        )
      }

      try {
        await signOut(auth)
      } catch (signOutError) {
        console.error("Sign out error:", signOutError)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 px-5 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

        {/* ================= LEFT SIDE ================= */}

        <div className="hidden bg-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-700">
              J
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-widest text-blue-200">
              J. Solution Classes
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight">
              Welcome to
              <br />
              J. Solution Classes
            </h1>

            <p className="mt-5 max-w-md leading-7 text-blue-100">
              Login to access your dashboard.
              Admin, Faculty and approved Students
              can use their Google account to continue.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-blue-100">
              Classes
            </p>

            <p className="mt-1 text-xl font-bold">
              9th • 10th • 11th • 12th
            </p>

            <p className="mt-2 text-sm text-blue-200">
              Science & Arts
            </p>
          </div>
        </div>

        {/* ================= LOGIN FORM ================= */}

        <div className="p-7 sm:p-10 lg:p-12">

          <div className="mb-8 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-700 text-2xl font-black text-white">
              J
            </div>
          </div>

          <p className="font-bold uppercase tracking-widest text-red-600">
            Secure Login
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-950">
            Welcome Back
          </h2>

          <p className="mt-2 text-gray-500">
            Continue with your Google account to access your dashboard.
          </p>

          {/* ================= GOOGLE LOGIN ================= */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >

            {/* Google Icon */}

            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21.35 12.27c0-.79-.07-1.55-.21-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
                fill="#4285F4"
              />

              <path
                d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.5Z"
                fill="#34A853"
              />

              <path
                d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.88H3.29A9.73 9.73 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.12l3.25-2.53Z"
                fill="#FBBC05"
              />

              <path
                d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.71 5.38l3.25 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
                fill="#EA4335"
              />
            </svg>

            {loading
              ? "Signing in..."
              : "Continue with Google"}

          </button>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* ================= INFO ================= */}

          <div className="mt-8 rounded-2xl bg-gray-50 p-5">

            <p className="text-sm font-bold text-gray-800">
              Login Information
            </p>

            <div className="mt-4 space-y-3 text-sm">

              <div>
                <p className="font-semibold text-gray-500">
                  Admin
                </p>

                <p className="font-bold text-gray-800">
                  murlimanohar7041@gmail.com
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">
                  Faculty
                </p>

                <p className="font-bold text-gray-800">
                  mdey9006690@gmail.com
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">
                  Students
                </p>

                <p className="font-bold text-gray-800">
                  Approved Google account only
                </p>
              </div>

            </div>
          </div>

          {/* ================= BACK ================= */}

          <a
            href="/"
            className="mt-7 block text-center text-sm font-semibold text-gray-500 transition hover:text-blue-700"
          >
            ← Back to Website
          </a>

        </div>
      </div>
    </div>
  )
}

export default Login