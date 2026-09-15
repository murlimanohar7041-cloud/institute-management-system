function AdminClasses({ branch }) {
  const classes = [
    {
      number: "09",
      title: "Class 9th",
      subtitle: "Foundation & Strong Basics",
      description:
        "Build strong concepts and develop a solid academic foundation.",
    },
    {
      number: "10",
      title: "Class 10th",
      subtitle: "Board Preparation",
      description:
        "Focused learning, revision and practice for board examinations.",
    },
    {
      number: "11",
      title: "Class 11th",
      subtitle: "Science & Arts",
      description:
        "Strong subject fundamentals for the senior secondary journey.",
    },
    {
      number: "12",
      title: "Class 12th",
      subtitle: "Science & Arts",
      description:
        "Focused preparation, revision and examination guidance.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-5 sm:p-7 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-red-600">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-gray-950 sm:text-3xl">
            Classes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage classes and academic programs for {branch} branch.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-5 py-3">
          <p className="text-xs font-semibold text-blue-500">
            Active Branch
          </p>

          <p className="font-bold text-blue-700">
            {branch}
          </p>
        </div>
      </div>

      {/* Branch Banner */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-blue-700 p-6 text-white shadow-md sm:p-7">
        <p className="text-sm font-semibold text-blue-200">
          Currently Managing
        </p>

        <h2 className="mt-1 text-2xl font-extrabold">
          J. Solution Classes — {branch}
        </h2>

        <p className="mt-2 text-sm text-blue-100">
          Manage academic programs for this branch.
        </p>
      </div>

      {/* Classes */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {classes.map((item) => (
          <div
            key={item.title}
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-extrabold text-blue-700">
                {item.number}
              </div>

              <span className="font-bold text-red-600">
                JSC
              </span>
            </div>

            <h3 className="mt-6 text-xl font-bold text-gray-950">
              {item.title}
            </h3>

            <p className="mt-2 font-semibold text-blue-700">
              {item.subtitle}
            </p>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {item.description}
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400">
                Branch
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {branch}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stream Information */}
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-extrabold text-gray-950">
          Senior Secondary Streams
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Available for Class 11th and 12th students.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-white p-5">
            <div className="text-2xl">🔬</div>

            <h3 className="mt-3 font-bold text-gray-950">
              Science
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Science stream students
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-5">
            <div className="text-2xl">📚</div>

            <h3 className="mt-3 font-bold text-gray-950">
              Arts
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Arts stream students
            </p>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-bold text-blue-700">
          ℹ️ Branch-wise Management
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-600">
          These classes are being managed for the{" "}
          <span className="font-bold">{branch}</span> branch.
          When the admin switches between Itimha and Bardiha,
          the active branch changes automatically.
        </p>
      </div>
    </div>
  )
}

export default AdminClasses