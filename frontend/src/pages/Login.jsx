
import { useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "murlimanohar7041@gmail.com";

  const saveUserData = (role, userEmail, userName) => {
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userName", userName);
  };

  const checkFaculty = async (user, userEmail) => {
    const facultyRef = doc(db, "faculty", userEmail);
    const facultySnapshot = await getDoc(facultyRef);

    if (!facultySnapshot.exists()) {
      return false;
    }

    const faculty = facultySnapshot.data();

    if (faculty.status !== "active") {
      setError(
        "Aapka Faculty account currently inactive hai. Please Admin se contact karein."
      );
      await signOut(auth);
      return true;
    }

    saveUserData(
      "faculty",
      userEmail,
      faculty.name || user.displayName || "Faculty"
    );

    localStorage.setItem("facultyId", facultySnapshot.id);
    localStorage.setItem("facultyBranch", faculty.branch || "");
    localStorage.setItem("facultySubject", faculty.subject || "");

    window.location.href = "/faculty";
    return true;
  };

  const checkStudent = async (user, userEmail) => {
    const studentsRef = collection(db, "students");

    const studentQuery = query(
      studentsRef,
      where("email", "==", userEmail)
    );

    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      return false;
    }

    const studentDoc = studentSnapshot.docs[0];
    const student = studentDoc.data();

    if (student.status !== "approved") {
      if (student.status === "rejected") {
        setError(
          "Aapki admission application reject ho gayi hai. Please Admin se contact karein."
        );
      } else {
        setError(
          "Aapki admission abhi approved nahi hui hai. Please Admin approval ka wait karein."
        );
      }

      await signOut(auth);
      return true;
    }

    saveUserData(
      "student",
      userEmail,
      student.name || user.displayName || "Student"
    );

    localStorage.setItem("studentId", student.studentId || "");
    localStorage.setItem("studentBranch", student.branch || "");
    localStorage.setItem("studentClass", student.className || "");
    localStorage.setItem("studentStream", student.stream || "");

    window.location.href = "/student";
    return true;
  };

  const handleUserLogin = async (user) => {
    const userEmail = user.email?.trim().toLowerCase();

    if (!userEmail) {
      setError("Account email nahi mila.");
      await signOut(auth);
      return;
    }

    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      saveUserData(
        "admin",
        userEmail,
        user.displayName || "Admin"
      );

      window.location.href = "/admin";
      return;
    }

    try {
      const studentFound = await checkStudent(user, userEmail);
      if (studentFound) return;
    } catch (studentError) {
      console.error("Student check error:", studentError);
    }

    try {
      const facultyFound = await checkFaculty(user, userEmail);
      if (facultyFound) return;
    } catch (facultyError) {
      console.error("Faculty check error:", facultyError);
    }

    setError(
      "Aapka account registered nahi hai. Please Admin se contact karein."
    );

    await signOut(auth);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please email enter karein.");
      return;
    }

    if (!password) {
      setError("Please password enter karein.");
      return;
    }

    try {
      setLoading(true);

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await handleUserLogin(result.user);
    } catch (err) {
      console.error("Email Login Error:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Email ya password galat hai.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please valid email address enter karein.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Bahut zyada login attempts ho gaye. Thodi der baad try karein."
        );
      } else if (err.code === "auth/user-disabled") {
        setError("Ye account disabled hai. Admin se contact karein.");
      } else {
        setError(`Login failed: ${err.code || "Unknown error"}`);
      }

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      await handleUserLogin(result.user);
    } catch (err) {
      console.error("Google Login Error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Google login window close kar di gayi.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Browser ne Google login popup block kar diya.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Ye website Firebase Authorized Domains me registered nahi hai."
        );
      } else if (
        err.code === "auth/account-exists-with-different-credential"
      ) {
        setError(
          "Is email ka account kisi aur login method se already exist karta hai."
        );
      } else {
        setError(
          `Google login failed: ${err.code || "Unknown error"}`
        );
      }

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(
        "Password reset ke liye pehle apna email enter karein."
      );
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      );

      setSuccess(
        "Password reset link aapke email par bhej diya gaya hai."
      );
    } catch (err) {
      console.error("Password Reset Error:", err);

      if (err.code === "auth/user-not-found") {
        setError("Is email se koi account nahi mila.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please valid email address enter karein.");
      } else {
        setError(
          `Password reset failed: ${err.code || "Unknown error"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-3 py-2 sm:px-6 sm:py-8">
  <div className="mx-auto flex min-h-[calc(100dvh-16px)] w-full items-center justify-center sm:min-h-[calc(100vh-64px)]">
    <div className="grid w-full max-w-[360px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:max-w-md sm:rounded-3xl lg:max-w-5xl lg:grid-cols-2">
          {/* Desktop branding */}
          <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-900 p-10 text-white lg:flex xl:p-12">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-3xl font-black text-blue-700 shadow-lg">
                J
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                J. Solution Classes
              </p>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight xl:text-4xl">
                Learn Today,
                <br />
                Build Your Future.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100 xl:text-base">
                Access your J. Solution Classes dashboard securely
                and manage your academic journey from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
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
          </section>

          {/* Login form */}
          <section className="p-5 sm:p-8 lg:p-10 xl:p-12">
            {/* Compact mobile logo */}
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-sm">
                J
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-red-600">
                  J. Solution Classes
                </p>
                <p className="text-xs text-gray-500">
                  Student • Faculty • Admin
                </p>
              </div>
            </div>

            <div>
              <p className="hidden text-xs font-bold uppercase tracking-[0.16em] text-red-600 lg:block">
                J. Solution Classes
              </p>

              <h2 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
                Welcome Back
              </h2>

              <p className="mt-1.5 text-sm leading-5 text-gray-500">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="mt-5 sm:mt-7">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-bold text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-bold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 pr-12 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="min-h-9 text-sm font-bold text-blue-600 transition hover:text-blue-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 min-h-11 w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 sm:my-5">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                OR
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
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

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold leading-5 text-red-600"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm font-semibold leading-5 text-green-700"
              >
                {success}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 sm:mt-5 sm:p-4">
              <p className="text-center text-xs leading-5 text-gray-500">
                Secure login for authorized Admin, Faculty and approved
                Students.
              </p>
            </div>

            <a
              href="/"
              className="mt-3 block min-h-9 text-center text-sm font-semibold text-gray-500 transition hover:text-blue-700"
            >
              ← Back to Website
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;

