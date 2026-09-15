function Hero() {
  return (
    <section className="relative overflow-hidden bg-blue-50">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-100 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Classes 9th to 12th
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            Learn Today.
            <span className="block text-blue-700">
              Build Your Future.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Welcome to J. Solution Classes — quality education,
            proper guidance and focused academic support for students
            of Class 9th to 12th.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#admission"
              className="rounded-xl bg-red-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-700"
            >
              Admission Enquiry
            </a>

            <a
              href="#classes"
              className="rounded-xl border-2 border-blue-700 bg-white px-7 py-3.5 font-bold text-blue-700 transition hover:bg-blue-700 hover:text-white"
            >
              Explore Classes
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-8 border-t border-blue-100 pt-7">
            <div>
              <p className="text-2xl font-extrabold text-blue-700">9th–12th</p>
              <p className="text-sm text-gray-500">Classes</p>
            </div>

            <div>
              <p className="text-2xl font-extrabold text-blue-700">2</p>
              <p className="text-sm text-gray-500">Branches</p>
            </div>

            <div>
              <p className="text-2xl font-extrabold text-blue-700">Science</p>
              <p className="text-sm text-gray-500">& Arts</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-100">
            <div className="rounded-[1.5rem] bg-blue-700 p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-700">
                  J
                </div>

                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold">
                  2026
                </span>
              </div>

              <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-blue-100">
                J. Solution Classes
              </p>

              <h2 className="mt-3 text-3xl font-extrabold leading-tight">
                Your Education.
                <br />
                Our Guidance.
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">9th</p>
                  <p className="text-sm text-blue-100">Class</p>
                </div>

                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">10th</p>
                  <p className="text-sm text-blue-100">Class</p>
                </div>

                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">11th</p>
                  <p className="text-sm text-blue-100">Science & Arts</p>
                </div>

                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">12th</p>
                  <p className="text-sm text-blue-100">Science & Arts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 rounded-2xl bg-red-600 px-5 py-4 text-white shadow-xl">
            <p className="text-xs font-medium text-red-100">
              Learn with confidence
            </p>
            <p className="font-bold">Grow with J. Solution</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero