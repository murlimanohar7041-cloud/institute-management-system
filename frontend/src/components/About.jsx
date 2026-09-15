const features = [
  {
    icon: "📚",
    title: "Quality Education",
    description:
      "Concept-focused teaching with simple and understandable explanations.",
  },
  {
    icon: "👨‍🏫",
    title: "Proper Guidance",
    description:
      "Students receive academic guidance throughout their learning journey.",
  },
  {
    icon: "📝",
    title: "Regular Practice",
    description:
      "Practice and revision help students improve their confidence.",
  },
  {
    icon: "🏫",
    title: "Two Branches",
    description:
      "Students can choose between our Itimha and Bardiha branches.",
  },
]

function About() {
  return (
    <section id="about" className="scroll-mt-24 bg-gray-50 py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <p className="font-bold uppercase tracking-widest text-red-600">
            About J. Solution
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Education that builds confidence.
          </h2>

          <p className="mt-6 leading-8 text-gray-600">
            J. Solution Classes focuses on helping students build strong
            academic fundamentals and prepare confidently for their school
            examinations.
          </p>

          <p className="mt-4 leading-8 text-gray-600">
            We provide academic support for Class 9th, 10th, 11th and 12th,
            with Science and Arts options for senior classes.
          </p>

          <a
            href="#contact"
            className="mt-7 inline-block rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            Contact Us
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-3xl">{item.icon}</div>

              <h3 className="mt-4 font-bold text-gray-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About