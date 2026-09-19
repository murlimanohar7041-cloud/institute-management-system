import { useState } from "react"

function AdminSettings({ branch }) {
  const [instituteName, setInstituteName] = useState(
    localStorage.getItem("instituteName") ||
      "J. Solution Classes"
  )

  const [location, setLocation] = useState(
    localStorage.getItem("instituteLocation") ||
      "Nasriganj, Rohtas, Bihar"
  )

  const [phone, setPhone] = useState(
    localStorage.getItem("institutePhone") || ""
  )

  const [email, setEmail] = useState(
    localStorage.getItem("instituteEmail") ||
      "murlimanohar7041@gmail.com"
  )

  const [saved, setSaved] = useState(false)

  const saveSettings = (e) => {
    e.preventDefault()

    localStorage.setItem(
      "instituteName",
      instituteName
    )

    localStorage.setItem(
      "instituteLocation",
      location
    )

    localStorage.setItem(
      "institutePhone",
      phone
    )

    localStorage.setItem(
      "instituteEmail",
      email
    )

    setSaved(true)

    setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  const clearBranchData = () => {
    const confirmDelete = window.confirm(
      `Delete all data of ${branch} branch?`
    )

    if (!confirmDelete) return

    localStorage.removeItem(`results_${branch}`)
    localStorage.removeItem(`fees_${branch}`)
    localStorage.removeItem(`notices_${branch}`)
    localStorage.removeItem(`certificates_${branch}`)
    localStorage.removeItem(`admissions_${branch}`)

    alert(`${branch} branch data cleared.`)

    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">

      <div>
        <p className="text-sm font-semibold text-blue-600">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-extrabold">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage institute settings and branch information.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        {/* INSTITUTE SETTINGS */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-extrabold">
            Institute Information
          </h2>

          <form
            onSubmit={saveSettings}
            className="mt-5 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-bold">
                Institute Name
              </label>

              <input
                value={instituteName}
                onChange={(e) =>
                  setInstituteName(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Location
              </label>

              <input
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Phone
              </label>

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white"
            >
              Save Settings
            </button>

            {saved && (
              <p className="font-bold text-green-600">
                ✓ Settings saved successfully
              </p>
            )}

          </form>

        </div>

        {/* BRANCH SETTINGS */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-extrabold">
            Current Branch
          </h2>

          <div className="mt-5 rounded-2xl bg-blue-50 p-5">

            <p className="text-sm font-semibold text-blue-600">
              Active Branch
            </p>

            <h3 className="mt-2 text-2xl font-extrabold">
              {branch}
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {location}
            </p>

          </div>

          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">

            <h3 className="font-extrabold text-red-700">
              Danger Zone
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Delete all locally stored data of the current branch.
            </p>

            <button
              onClick={clearBranchData}
              className="mt-4 rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
            >
              Clear {branch} Data
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default AdminSettings