function Footer() {
  return (
    <footer className="bg-blue-950 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl font-black text-blue-700">
              J
            </div>

            <div>
              <h2 className="font-bold">J. Solution Classes</h2>
              <p className="text-xs text-blue-200">
                Quality Education
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm leading-6 text-blue-200">
            Quality education and proper guidance for students of
            Class 9th to 12th.
          </p>
        </div>

        <div>
          <h3 className="font-bold">Quick Links</h3>

          <div className="mt-4 grid gap-3 text-sm text-blue-200">
            <a href="#about" className="hover:text-white">
              About
            </a>

            <a href="#classes" className="hover:text-white">
              Classes
            </a>

            <a href="#results" className="hover:text-white">
              Results
            </a>

            <a href="#branches" className="hover:text-white">
              Branches
            </a>

            <a href="#notices" className="hover:text-white">
              Notices
            </a>

            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Contact</h3>

          <div className="mt-4 space-y-3 text-sm text-blue-200">
            <p>📞 8809573469</p>
            <p>✉️ murlimanohar7041@gmail.com</p>
            <p>📍 Itimha & Bardiha, Nasriganj</p>
            <p>Rohtas, Bihar</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-blue-800 px-5 pt-6 text-center text-sm text-blue-300 lg:px-8">
        © 2026 J. Solution Classes. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer