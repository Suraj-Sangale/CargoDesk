import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiAlertTriangle, FiHome, FiMail, FiPhone, FiArrowLeft } from "react-icons/fi";

export default function ModuleBlockedPage() {
  const router = useRouter();
  const { module } = router.query;

  return (
    <>
      <Head>
        <title>Page Not Accessible | CargoDesk</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-slate-900/95 px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 text-center text-white relative">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center mx-auto mb-3 text-rose-300 shadow-inner">
              <FiAlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Page Not Accessible</h1>
            <p className="text-xs text-rose-200 mt-1">
              {module
                ? `The "${String(module).toUpperCase()}" module is disabled for your organization.`
                : "This module has been restricted for your organization."}
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 text-center space-y-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
              <p className="text-xs font-semibold text-slate-800">Why am I seeing this?</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your organization's administrator or the Super Admin has restricted access to this page for your company.
              </p>
              <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-slate-700">
                  <FiMail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>support@cargodesk.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <FiPhone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>+91 98200 11223 (Support Desk)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              For more details or to enable this feature, please contact your organization administrator or CargoDesk support.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FiHome className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Link>
              <a
                href="mailto:support@cargodesk.com"
                className="py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200/60 transition-all flex items-center justify-center gap-1.5"
              >
                <FiMail className="w-4 h-4" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

ModuleBlockedPage.layoutName = "login";
