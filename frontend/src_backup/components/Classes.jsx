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

function Classes() {
  return (
    <section id="classes" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-red-600">
            Academic Programs
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Classes We Offer
          </h2>

          <p className="mt-4 text-gray-600">
            Quality academic support for students from Class 9th to 12th.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-extrabold text-blue-700">
                  {item.number}
                </div>

                <span className="font-bold text-red-600">JSC</span>
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

              <a
                href="#contact"
                className="mt-5 inline-block font-bold text-red-600"
              >
                Enquire Now →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Classes