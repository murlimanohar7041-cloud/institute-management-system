
import React from "react";

const demoRoles = [
  {
    title: "Admin Demo",
    description: "Explore the institute management dashboard.",
    icon: "👨‍💼",
    color: "bg-red-600 hover:bg-red-700",
    role: "admin",
  },
  {
    title: "Faculty Demo",
    description: "Explore faculty tools and student information.",
    icon: "👨‍🏫",
    color: "bg-blue-700 hover:bg-blue-800",
    role: "faculty",
  },
  {
    title: "Student Demo",
    description: "Explore student results, fees and notices.",
    icon: "🎓",
    color: "bg-green-600 hover:bg-green-700",
    role: "student",
  },
];

export default function LiveDemo() {
  const openDemo = (role) => {
    window.location.href = `/demo/${role}`;
  };

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <a
          href="/"
          className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to Home
        </a>

        <div className="mt-8 text-center">
          <span className="inline-block rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700">
            J. Solution Classes
          </span>

          <h1 className="mt-5 text-3xl font-extrabold text-gray-900 sm:text-5xl">
            Explore Our Live Demo
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Choose a demo role to explore the institute management system.
            Demo data will be separate from the original institute records.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {demoRoles.map((item) => (
            <article
              key={item.role}
              className="rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="text-5xl" aria-hidden="true">
                {item.icon}
              </div>

              <h2 className="mt-4 text-xl font-extrabold text-gray-900">
                {item.title}
              </h2>

              <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600">
                {item.description}
              </p>

              <button
                type="button"
                onClick={() => openDemo(item.role)}
                className={`mt-6 w-full rounded-xl px-5 py-3 font-bold text-white transition ${item.color}`}
              >
                Open {item.title}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Public demonstration only. Please do not enter real personal
          information.
        </p>
      </div>
    </main>
  );
}
