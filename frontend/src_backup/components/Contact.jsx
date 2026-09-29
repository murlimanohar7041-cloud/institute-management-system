function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-24 px-5 py-16 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

          {/* Contact Information */}
          <div>
            <p className="font-bold uppercase tracking-widest text-red-600">
              Contact
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Get in touch with us
            </h2>

            <p className="mt-4 max-w-xl text-gray-600">
              Have a question about classes, admission or branches?
              Contact J. Solution Classes.
            </p>

            <div className="mt-8 space-y-6">

              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Phone
                </p>
                <a
                  href="tel:8809573469"
                  className="font-bold text-blue-600 hover:underline"
                >
                  8809573469
                </a>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Email
                </p>
                <a
                  href="mailto:murlimanohar7041@gmail.com"
                  className="font-bold text-blue-600 hover:underline"
                >
                  murlimanohar7041@gmail.com
                </a>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Branches
                </p>
                <p className="text-gray-700">
                  Itimha & Bardiha, Nasriganj, Rohtas, Bihar
                </p>
              </div>

            </div>
          </div>

          {/* Contact Card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

            <div className="rounded-2xl bg-red-50 p-6">
              <div className="text-4xl">📚</div>

              <h3 className="mt-4 text-2xl font-extrabold text-gray-900">
                J. Solution Classes
              </h3>

              <p className="mt-2 text-gray-600">
                Classes 9th to 12th with Science and Arts streams
                for 11th and 12th.
              </p>

              <a
                href="#admission"
                className="mt-6 inline-flex rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-red-700"
              >
                Apply for Admission →
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

export default Contact