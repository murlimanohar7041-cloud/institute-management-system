function Admission() {
  return (
    <section
      id="admission"
      className="scroll-mt-24 px-5 py-10 lg:px-8"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-red-600 p-8 text-white sm:p-12">

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

          <div>
            <p className="font-bold uppercase tracking-widest text-red-100">
              Start Your Journey
            </p>

            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Ready to start learning?
            </h2>

            <p className="mt-3 max-w-2xl text-red-100">
              Apply for admission at J. Solution Classes
              and start your learning journey with us.
            </p>
          </div>

          {/* Admission Button */}
          <a
            href="/admission"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-7 py-3.5 font-bold text-red-600 shadow-lg transition hover:bg-gray-100"
          >
            Apply for Admission
          </a>

        </div>
      </div>
    </section>
  )
}

export default Admission