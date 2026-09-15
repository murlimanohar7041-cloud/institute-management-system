function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="font-bold uppercase tracking-widest text-red-600">
            Contact
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-950 sm:text-4xl">
            Get in touch with us
          </h2>

          <p className="mt-5 leading-7 text-gray-600">
            Have a question about classes, admission or branches?
            Contact J. Solution Classes.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-sm font-bold text-gray-500">Phone</p>
              <a
                href="tel:8809573469"
                className="font-bold text-blue-700"
              >
                8809573469
              </a>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-500">Email</p>
              <a
                href="mailto:murlimanohar7041@gmail.com"
                className="break-all font-bold text-blue-700"
              >
                murlimanohar7041@gmail.com
              </a>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-500">Branches</p>
              <p className="text-gray-700">
                Itimha & Bardiha, Nasriganj, Rohtas, Bihar
              </p>
            </div>
          </div>
        </div>

        <form
          className="rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <h3 className="text-2xl font-bold text-gray-950">
            Admission Enquiry
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Fill in your details and our team can contact you.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Student Name"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-600"
            />

            <input
              type="tel"
              placeholder="Mobile Number"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-600"
            />

            <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-600">
              <option>Select Class</option>
              <option>Class 9th</option>
              <option>Class 10th</option>
              <option>Class 11th - Science</option>
              <option>Class 11th - Arts</option>
              <option>Class 12th - Science</option>
              <option>Class 12th - Arts</option>
            </select>

            <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-600">
              <option>Select Branch</option>
              <option>Itimha</option>
              <option>Bardiha</option>
            </select>

            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700"
            >
              Send Enquiry
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Contact