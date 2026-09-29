import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "../firebase"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [activeSection, setActiveSection] = useState("home")
  const [loggingOut, setLoggingOut] = useState(false)

  const links = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Classes", id: "classes" },
    { name: "Results", id: "results" },
    { name: "Branches", id: "branches" },
    { name: "Notices", id: "notices" },
    { name: "Admission", href: "/admission" },
    { name: "Contact", id: "contact" },
  ]

  // Firebase login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  // Active section detect
  useEffect(() => {
    const sections = document.querySelectorAll(
      "#home, #about, #classes, #results, #branches, #notices, #contact"
    )

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        rootMargin: "-100px 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const closeMenu = () => {
    setMenuOpen(false)
  }

  // Section click
  const handleSectionClick = (id) => {
    closeMenu()

    const section = document.getElementById(id)

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })

      setActiveSection(id)
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true)

      await signOut(auth)

      closeMenu()
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      alert("Logout failed. Please try again.")
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

        {/* Logo */}
        <a
          href="/"
          onClick={() => {
            closeMenu()
            setActiveSection("home")
          }}
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-2xl font-black text-white shadow-md shadow-blue-200">
            J
          </div>

          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight text-gray-950">
              J. Solution
            </h1>

            <p className="text-sm font-bold text-red-600">
              Classes
            </p>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => {
            const isActive = activeSection === link.id

            if (link.href) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative py-2 text-sm font-semibold text-gray-600 transition hover:text-blue-700"
                >
                  {link.name}
                </a>
              )
            }

            return (
              <button
                key={link.name}
                type="button"
                onClick={() => handleSectionClick(link.id)}
                className={`relative py-2 text-sm font-semibold transition ${
                  isActive
                    ? "text-blue-700"
                    : "text-gray-600 hover:text-blue-700"
                }`}
              >
                {link.name}

                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-red-600" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Desktop Login / Logout */}
        <div className="hidden lg:block">
          {!user ? (
            <a
              href="/login"
              className="inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Login
            </a>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-blue-200 hover:text-blue-700 lg:hidden"
        >
          {menuOpen ? (
            <span className="text-2xl leading-none">×</span>
          ) : (
            <span className="text-2xl leading-none">☰</span>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <nav className="mx-auto max-w-7xl px-5 py-4">
            <div className="flex flex-col">
              {links.map((link) => {
                if (link.href) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={closeMenu}
                      className="border-b border-gray-100 py-3.5 font-semibold text-gray-700 transition hover:pl-2 hover:text-blue-700"
                    >
                      {link.name}
                    </a>
                  )
                }

                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handleSectionClick(link.id)}
                    className={`border-b border-gray-100 py-3.5 text-left font-semibold transition hover:pl-2 ${
                      activeSection === link.id
                        ? "text-blue-700"
                        : "text-gray-700 hover:text-blue-700"
                    }`}
                  >
                    {link.name}
                  </button>
                )
              })}

              {/* Mobile Login / Logout */}
              {!user ? (
                <a
                  href="/login"
                  onClick={closeMenu}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-700"
                >
                  Login
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar