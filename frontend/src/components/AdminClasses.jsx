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
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 p-3 sm:p-5 md:p-7 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-red-600 sm:text-sm">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-gray-950 sm:text-3xl">
            Classes
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500 sm:text-sm sm:leading-6">
            Manage classes and academic programs for {branch} branch.
          </p>
        </div>

        <div className="w-full rounded-xl bg-blue-50 px-4 py-3 sm:w-auto sm:min-w-[150px] sm:px-5">
          <p className="text-xs font-semibold text-blue-500">
            Active Branch
          </p>

          <p className="mt-1 truncate font-bold text-blue-700">
            {branch}
          </p>
        </div>
      </div>

      {/* Branch Banner */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-blue-700 p-5 text-white shadow-md sm:mt-6 sm:p-7">
        <p className="text-xs font-semibold text-blue-200 sm:text-sm">
          Currently Managing
        </p>

        <h2 className="mt-1 break-words text-xl font-extrabold leading-tight sm:text-2xl">
          J. Solution Classes — {branch}
        </h2>

        <p className="mt-2 text-xs leading-5 text-blue-100 sm:text-sm sm:leading-6">
          Manage academic programs for this branch.
        </p>
      </div>

      {/* Classes */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {classes.map((item) => (
          <div
            key={item.title}
            className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition duration-300 sm:p-6 sm:hover:-translate-y-2 sm:hover:border-blue-200 sm:hover:shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg font-extrabold text-blue-700 sm:h-14 sm:w-14 sm:text-xl">
                {item.number}
              </div>

              <span className="shrink-0 text-sm font-bold text-red-600">
                JSC
              </span>
            </div>

            <h3 className="mt-5 break-words text-lg font-bold leading-tight text-gray-950 sm:mt-6 sm:text-xl">
              {item.title}
            </h3>

            <p className="mt-2 break-words text-sm font-semibold leading-5 text-blue-700">
              {item.subtitle}
            </p>

            <p className="mt-3 break-words text-sm leading-6 text-gray-600">
              {item.description}
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 px-3 py-3 sm:px-4">
              <p className="text-xs font-semibold text-gray-400">
                Branch
              </p>

              <p className="mt-1 break-words text-sm font-bold text-gray-800 sm:text-base">
                {branch}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stream Information */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:mt-8 sm:p-6">
        <h2 className="text-lg font-extrabold text-gray-950">
          Senior Secondary Streams
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm sm:leading-6">
          Available for Class 11th and 12th students.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-xl border border-blue-100 bg-white p-4 sm:p-5">
            <div className="text-2xl">🔬</div>

            <h3 className="mt-3 font-bold text-gray-950">
              Science
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
              Science stream students
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-4 sm:p-5">
            <div className="text-2xl">📚</div>

            <h3 className="mt-3 font-bold text-gray-950">
              Arts
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
              Arts stream students
            </p>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:mt-6 sm:p-5">
        <p className="text-sm font-bold text-blue-700">
          ℹ️ Branch-wise Management
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm sm:leading-6">
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