import { useState } from "react"

import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"

import { auth, db } from "../firebase"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const ADMIN_EMAIL = "murlimanohar7041@gmail.com"

  // =====================================================
  // SAVE USER DATA
  // =====================================================
  const saveUserData = (role, userEmail, userName) => {
    localStorage.setItem("userRole", role)
    localStorage.setItem("userEmail", userEmail)
    localStorage.setItem("userName", userName)
  }

  // =====================================================
  // CHECK FACULTY
  // =====================================================
  const checkFaculty = async (user, userEmail) => {
    const facultyRef = doc(db, "faculty", userEmail)

    const facultySnapshot = await getDoc(facultyRef)

    if (!facultySnapshot.exists()) {
      return false
    }

    const faculty = facultySnapshot.data()

    if (faculty.status !== "active") {
      setError(
        "Aapka Faculty account currently inactive hai. Please Admin se contact karein."
      )

      await signOut(auth)

      return true
    }

    saveUserData(
      "faculty",
      userEmail,
      faculty.name || user.displayName || "Faculty"
    )

    localStorage.setItem(
      "facultyId",
      facultySnapshot.id
    )

    localStorage.setItem(
      "facultyBranch",
      faculty.branch || ""
    )

    localStorage.setItem(
      "facultySubject",
      faculty.subject || ""
    )

    window.location.href = "/faculty"

    return true
  }

  // =====================================================
  // CHECK STUDENT
  // =====================================================
  const checkStudent = async (user, userEmail) => {
    const studentsRef = collection(db, "students")

    const studentQuery = query(
      studentsRef,
      where("email", "==", userEmail)
    )

    const studentSnapshot = await getDocs(studentQuery)

    // Student record nahi mila
    if (studentSnapshot.empty) {
      return false
    }

    const studentDoc = studentSnapshot.docs[0]
    const student = studentDoc.data()

    // =================================================
    // STUDENT NOT APPROVED
    // =================================================
    if (student.status !== "approved") {
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

      return true
    }

    // =================================================
    // APPROVED STUDENT
    // =================================================
    saveUserData(
      "student",
      userEmail,
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

    window.location.href = "/student"

    return true
  }

  // =====================================================
  // CHECK USER ROLE
  // =====================================================
  const handleUserLogin = async (user) => {
    const userEmail = user.email?.trim().toLowerCase()

    if (!userEmail) {
      setError("Account email nahi mila.")

      await signOut(auth)

      return
    }

    console.log("Logged in email:", userEmail)

    // =================================================
    // ADMIN
    // =================================================
    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      saveUserData(
        "admin",
        userEmail,
        user.displayName || "Admin"
      )

      window.location.href = "/admin"

      return
    }

    // =================================================
    // STUDENT FIRST
    // =================================================
    try {
      const studentFound = await checkStudent(
        user,
        userEmail
      )

      if (studentFound) {
        return
      }
    } catch (studentError) {
      console.error(
        "Student check error:",
        studentError
      )
    }

    // =================================================
    // FACULTY
    // =================================================
    try {
      const facultyFound = await checkFaculty(
        user,
        userEmail
      )

      if (facultyFound) {
        return
      }
    } catch (facultyError) {
      console.error(
        "Faculty check error:",
        facultyError
      )
    }

    // =================================================
    // ACCOUNT NOT REGISTERED
    // =================================================
    setError(
      "Aapka account registered nahi hai. Please Admin se contact karein."
    )

    await signOut(auth)
  }

  // =====================================================
  // EMAIL + PASSWORD LOGIN
  // =====================================================
  const handleEmailLogin = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    if (!email.trim()) {
      setError("Please email enter karein.")
      return
    }

    if (!password) {
      setError("Please password enter karein.")
      return
    }

    try {
      setLoading(true)

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      )

      await handleUserLogin(result.user)
    } catch (err) {
      console.error("Email Login Error:", err)

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Email ya password galat hai.")
      } else if (err.code === "auth/invalid-email") {
        setError(
          "Please valid email address enter karein."
        )
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Bahut zyada login attempts ho gaye. Thodi der baad try karein."
        )
      } else if (err.code === "auth/user-disabled") {
        setError(
          "Ye account disabled hai. Admin se contact karein."
        )
      } else {
        setError(
          `Login failed: ${err.code || "Unknown error"}`
        )
      }

      try {
        await signOut(auth)
      } catch (signOutError) {
        console.error(signOutError)
      }
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // GOOGLE LOGIN
  // =====================================================
  const handleGoogleLogin = async () => {
    try {
      setError("")
      setSuccess("")
      setLoading(true)

      const provider = new GoogleAuthProvider()

      provider.setCustomParameters({
        prompt: "select_account",
      })

      const result = await signInWithPopup(
        auth,
        provider
      )

      await handleUserLogin(result.user)
    } catch (err) {
      console.error("Google Login Error:", err)

      if (err.code === "auth/popup-closed-by-user") {
        setError(
          "Google login window close kar di gayi."
        )
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Browser ne Google login popup block kar diya."
        )
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Ye website Firebase Authorized Domains me registered nahi hai."
        )
      } else if (
        err.code ===
        "auth/account-exists-with-different-credential"
      ) {
        setError(
          "Is email ka account kisi aur login method se already exist karta hai."
        )
      } else {
        setError(
          `Google login failed: ${err.code || "Unknown error"}`
        )
      }

      try {
        await signOut(auth)
      } catch (signOutError) {
        console.error(signOutError)
      }
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================
  const handleForgotPassword = async () => {
    setError("")
    setSuccess("")

    if (!email.trim()) {
      setError(
        "Password reset ke liye pehle apna email enter karein."
      )

      return
    }

    try {
      setLoading(true)

      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      )

      setSuccess(
        "Password reset link aapke email par bhej diya gaya hai."
      )
    } catch (err) {
      console.error(
        "Password Reset Error:",
        err
      )

      if (err.code === "auth/user-not-found") {
        setError(
          "Is email se koi account nahi mila."
        )
      } else if (err.code === "auth/invalid-email") {
        setError(
          "Please valid email address enter karein."
        )
      } else {
        setError(
          `Password reset failed: ${
            err.code || "Unknown error"
          }`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="hidden bg-gradient-to-br from-blue-700 to-blue-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-700 shadow-lg">
                J
              </div>

              <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
                J. Solution Classes
              </p>

              <h1 className="mt-4 text-4xl font-extrabold leading-tight">
                Learn Today,
                <br />
                Build Your Future.
              </h1>

              <p className="mt-6 max-w-md leading-7 text-blue-100">
                Access your J. Solution Classes
                dashboard securely and manage your
                academic journey from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold text-blue-200">
                Classes
              </p>

              <p className="mt-2 text-xl font-bold">
                9th • 10th • 11th • 12th
              </p>

              <p className="mt-2 text-sm text-blue-200">
                Science & Arts
              </p>
            </div>
          </div>

          {/* LOGIN SIDE */}
          <div className="p-7 sm:p-10 lg:p-12">

            {/* MOBILE LOGO */}
            <div className="mb-8 lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-700 text-2xl font-black text-white shadow-md">
                J
              </div>
            </div>

            <div>
              <p className="font-bold uppercase tracking-[0.18em] text-red-600">
                J. Solution Classes
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-gray-950">
                Welcome Back
              </h2>

              <p className="mt-2 text-gray-500">
                Sign in to continue to your dashboard.
              </p>
            </div>

            {/* EMAIL LOGIN */}
            <form
              onSubmit={handleEmailLogin}
              className="mt-8"
            >

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* PASSWORD */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.2 1.9-2.4 3" />
                        <path d="M6.6 6.6C4.8 7.8 3.5 9.5 2.5 12c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* FORGOT PASSWORD */}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm font-bold text-blue-600 transition hover:text-blue-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* SIGN IN */}
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                OR
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* GOOGLE LOGIN */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="21"
                height="21"
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
                  d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.71 5.38l3.25 2.53 3.25 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
                  fill="#EA4335"
                />
              </svg>

              Continue with Google
            </button>

            {/* ERROR */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-600">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-700">
                {success}
              </div>
            )}

            {/* SECURITY NOTE */}
            <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-center text-xs leading-5 text-gray-500">
                Secure login for authorized Admin,
                Faculty and approved Students.
              </p>
            </div>

            {/* BACK */}
            <a
              href="/"
              className="mt-6 block text-center text-sm font-semibold text-gray-500 transition hover:text-blue-700"
            >
              ← Back to Website
            </a>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Login