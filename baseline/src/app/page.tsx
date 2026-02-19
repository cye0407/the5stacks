import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-900 text-white font-bold text-sm flex items-center justify-center">
            5S
          </div>
          <span className="text-sm font-semibold text-gray-900">The 5 Stacks Baseline</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            The Five Stacks Framework
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Build your defensible<br />sustainability baseline
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Stop guessing what you need to report. Track materials, energy, transport, workforce, packaging, infrastructure, outputs, and context across every site — then export it when the auditor calls.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-block bg-gray-900 text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
            >
              Start Your Baseline
            </Link>
            <a
              href="https://the5stacks.com"
              className="inline-block border border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-semibold hover:border-gray-400 transition-colors text-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the Book
            </a>
          </div>
        </div>
      </section>

      {/* What it covers */}
      <section className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            8 Domains. One Baseline.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-10">
            Everything you need to know before anyone asks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Materials", desc: "Raw inputs, suppliers, recycled content, hazardous flags" },
              { title: "Energy", desc: "Electricity, fuels, water — by source and by site" },
              { title: "Transport", desc: "Logistics, distances, modes, fuel consumption" },
              { title: "Workforce", desc: "Headcount, training hours, health & safety" },
              { title: "Packaging", desc: "Types, weights, recyclability, reuse rates" },
              { title: "Infrastructure", desc: "Sites, assets, land use, certifications" },
              { title: "Outputs", desc: "Waste, emissions, effluents, product volumes" },
              { title: "Context", desc: "Financial, regulatory, market, stakeholder" },
            ].map((d) => (
              <div key={d.title} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 text-sm mb-1">{d.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            How It Works
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-10">
            Three steps. No consultants required.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-sm flex items-center justify-center mb-3">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Set up your company</h3>
              <p className="text-sm text-gray-600">Add your sites, run through the SWOT, set your goals. Five minutes to get the foundations right.</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-sm flex items-center justify-center mb-3">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Enter your data</h3>
              <p className="text-sm text-gray-600">Work through each domain at your pace. Monthly, quarterly, or all at once — the tool adapts to you.</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-sm flex items-center justify-center mb-3">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Export when ready</h3>
              <p className="text-sm text-gray-600">CSV exports across all domains. Your data, structured and ready for any framework or auditor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Free. No credit card. No trial period.
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            The Baseline is the first stack. Get your data in order, and the rest follows.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-gray-900 px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Baseline
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Five Stacks Framework&trade;
          </p>
          <a
            href="https://the5stacks.com"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            the5stacks.com
          </a>
        </div>
      </footer>
    </div>
  );
}
