const branches = [
  {
    name: "Itimha Branch",
    address: "Itimha, Nasriganj, Rohtas, Bihar",
  },
  {
    name: "Bardiha Branch",
    address: "Bardiha, Nasriganj, Rohtas, Bihar",
  },
]

function Branches() {
  return (
    <section id="branches" className="scroll-mt-24 bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="text-center">
          <p className="font-bold uppercase tracking-widest text-red-600">
            Our Locations
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Our Branches
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Choose the J. Solution Classes branch convenient for you.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                📍
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-blue-700">
                {branch.name}
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                {branch.address}
              </p>

              <a
                href="tel:8809573469"
                className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                📞 Call Now
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Branches