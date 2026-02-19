import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 text-white font-bold text-lg mb-6">
            5S
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            The 5 Stacks Baseline
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Build your defensible sustainability baseline. Track materials, energy, transport, workforce, packaging, infrastructure, outputs, and context — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              href="/signup"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              Start Your Baseline
            </Link>
            <Link
              href="/login"
              className="inline-block border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900 text-sm">8 Domains</p>
              <p className="text-xs text-gray-500 mt-1">Full coverage across your sustainability footprint</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900 text-sm">Multi-Site</p>
              <p className="text-xs text-gray-500 mt-1">Track across all your locations in one view</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900 text-sm">CSV Exports</p>
              <p className="text-xs text-gray-500 mt-1">Your data, your way. Export anytime</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900 text-sm">Free to Use</p>
              <p className="text-xs text-gray-500 mt-1">No credit card. No trial. Just start</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center">
        <a
          href="https://the5stacks.com"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Five Stacks Framework™
        </a>
      </footer>
    </div>
  );
}
