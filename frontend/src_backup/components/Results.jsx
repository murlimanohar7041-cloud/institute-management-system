function Results() {
  return (
    <section id="results" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-blue-700 p-8 text-white sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-bold uppercase tracking-widest text-red-300">
                Student Success
              </p>

              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Helping students move forward with confidence.
              </h2>

              <p className="mt-5 leading-7 text-blue-100">
                Student results and achievements will be managed and
                displayed here through the Admin Dashboard in the future.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold">9th</p>
                <p className="mt-1 text-sm text-blue-100">
                  Foundation
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold">10th</p>
                <p className="mt-1 text-sm text-blue-100">
                  Board Focus
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold">Science</p>
                <p className="mt-1 text-sm text-blue-100">
                  Senior Classes
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-6">
                <p className="text-3xl font-extrabold">Arts</p>
                <p className="mt-1 text-sm text-blue-100">
                  Senior Classes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Results