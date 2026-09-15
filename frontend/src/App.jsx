import "./App.css"

import AdminDashboard from "./pages/AdminDashboard"

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Classes from "./components/Classes"
import About from "./components/About"
import Results from "./components/Results"
import Branches from "./components/Branches"
import Notices from "./components/Notices"
import Admission from "./components/Admission"
import Contact from "./components/Contact"
import Footer from "./components/Footer"

import Login from "./pages/Login"

import StudentDashboard from "./pages/StudentDashboard"
import StudentHome from "./pages/StudentHome"

import FacultyDashboard from "./pages/FacultyDashboard"

import StudentRegister from "./pages/StudentRegister"


function Home() {
  return (
    <>
      <Navbar />

      <main>
  <div id="home">
    <Hero />
  </div>

  <Classes />
  <About />
  <Results />
  <Branches />
  <Notices />
  <Admission />
  <Contact />
</main>

      <Footer />
    </>
  )
}


function App() {
  const path = window.location.pathname


  // =========================
  // LOGIN
  // =========================

  if (path === "/login") {
    return <Login />
  }


  // =========================
  // STUDENT ADMISSION
  // =========================

  if (path === "/admission") {
    return <StudentRegister />
  }


  // =========================
  // ADMIN
  // =========================

  if (path === "/admin") {
    return <AdminDashboard />
  }


  // =========================
  // STUDENT DASHBOARD
  // =========================
  // Student login ke baad yahi open hoga

  if (path === "/student") {
    return <StudentHome />
  }


  // =========================
  // OLD STUDENT DASHBOARD
  // =========================
  // Isko abhi rakha gaya hai
  // taaki existing code/features safe rahein

  if (path === "/student/dashboard") {
    return <StudentDashboard />
  }


  // =========================
  // FACULTY DASHBOARD
  // =========================

  if (path === "/faculty") {
    return <FacultyDashboard />
  }


  // =========================
  // HOME WEBSITE
  // =========================

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Home />
    </div>
  )
}


export default App