import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FiShieldOff } from "react-icons/fi";

export default function ForbiddenPage() {
  return (
    <>
      <Head>
        <title>403 - Access Denied | CargoDesk</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShieldOff className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Forbidden</h1>
          <p className="text-slate-500 text-sm mb-6">
            You do not have the required permissions to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

ForbiddenPage.layoutName = "login"; // Renders without dashboard shell
