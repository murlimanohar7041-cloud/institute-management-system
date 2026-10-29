import { useEffect, useState } from "react";

const heading = "Learn Today.";

function Hero() {
const [visibleLetters, setVisibleLetters] = useState(0);

useEffect(() => {
const timer = setInterval(() => {
setVisibleLetters((previous) => {
if (previous >= heading.length) {
clearInterval(timer);
return previous;
}
return previous + 1;
});
}, 90);


return () => clearInterval(timer);


}, []);

return ( <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-red-50"> <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" /> <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-red-200/30 blur-3xl" />


  <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:px-8">
    <div className="hero-content">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
        Admissions Open · Classes 9th to 12th
      </div>

      <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
        <span aria-label={heading}>
          {heading.split("").map((letter, index) => (
            <span
              key={index}
              className="hero-letter inline-block"
              style={{
                opacity: index < visibleLetters ? 1 : 0,
                transform:
                  index < visibleLetters
                    ? "translateY(0)"
                    : "translateY(18px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </span>

        <span className="hero-subtitle mt-2 block text-blue-700">
          Build Your Future.
        </span>
      </h1>

      <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
        Welcome to <strong className="text-gray-900">J. Solution Classes</strong> —
        quality education, expert guidance and focused academic support
        for students of Class 9th to 12th.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#admission"
          className="hero-button rounded-xl bg-red-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition duration-300 hover:-translate-y-1 hover:bg-red-700"
        >
          Admission Enquiry →
        </a>

        <a
          href="#classes"
          className="hero-button rounded-xl border-2 border-blue-700 bg-white px-6 py-3.5 font-bold text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:text-white"
        >
          Explore Classes
        </a>

        <a
          href="/live-demo"
          className="hero-button rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-1 hover:bg-blue-800"
        >
          🚀 Live Demo
        </a>
      </div>

      <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-blue-100 pt-7">
        <div>
          <p className="text-xl font-extrabold text-blue-700 sm:text-2xl">9th–12th</p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">All Classes</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-blue-700 sm:text-2xl">4</p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">Branches</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-blue-700 sm:text-2xl">Science</p>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">& Arts</p>
        </div>
      </div>
    </div>

    <div className="hero-photo-wrap relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-400 to-red-400 opacity-20 blur-sm" />

      <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
          alt="Students studying together in a coaching environment"
          className="hero-student-photo h-[340px] w-full object-cover sm:h-[440px] lg:h-[500px]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
          <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            J. Solution Classes
          </span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            Learn Together.
            <br />
            Achieve Together.
          </h2>
          <p className="mt-2 text-sm text-blue-50">
            Your goals deserve the right guidance.
          </p>
        </div>
      </div>

      <div className="hero-float-card absolute -left-3 top-8 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl sm:-left-6 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-2xl">
            📚
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900">Expert Guidance</p>
            <p className="text-xs text-gray-500">Learn with confidence</p>
          </div>
        </div>
      </div>

      <div className="hero-float-card absolute -bottom-5 right-3 rounded-2xl border border-red-100 bg-white p-4 shadow-xl sm:right-6 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-2xl">
            🎯
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900">Classes 9th–12th</p>
            <p className="text-xs text-gray-500">Science & Arts</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <style>{`
    @keyframes heroEnter {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes heroFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-9px); }
    }

    .hero-content {
      animation: heroEnter 0.8s ease both;
    }

    .hero-subtitle {
      animation: heroEnter 0.8s ease 0.45s both;
    }

    .hero-button {
      animation: heroEnter 0.7s ease both;
    }

    .hero-photo-wrap {
      animation: heroEnter 0.9s ease 0.2s both;
    }

    .hero-float-card {
      animation: heroFloat 4s ease-in-out infinite;
    }

    .hero-student-photo {
      transition: transform 0.7s ease;
    }

    .hero-photo-wrap:hover .hero-student-photo {
      transform: scale(1.035);
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-content,
      .hero-subtitle,
      .hero-button,
      .hero-photo-wrap,
      .hero-float-card {
        animation: none !important;
      }
    }
  `}</style>
</section>


);
}

export default Hero;
