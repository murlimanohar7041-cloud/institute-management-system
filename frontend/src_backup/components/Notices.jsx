const notices = [
  "Admission enquiry is now open.",
  "New batch information will be updated soon.",
  "Important institute announcements will appear here.",
]

function Notices() {
  return (
    <section id="notices" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-bold uppercase tracking-widest text-red-600">
              Updates
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-gray-950">
              Latest Notices
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            Notices can be managed from the Admin Dashboard.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {notices.map((notice, index) => (
            <div
              key={notice}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                Notice 0{index + 1}
              </span>

              <p className="mt-5 font-semibold leading-7 text-gray-800">
                {notice}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                J. Solution Classes
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Notices