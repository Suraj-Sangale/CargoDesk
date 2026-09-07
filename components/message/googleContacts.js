import React, { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiInfo, FiShield } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export default function GoogleContacts({ contacts, setContacts }) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dynamically import gapi-script only on the client
    const loadGapi = async () => {
      try {
        const { gapi } = await import("gapi-script");

        gapi.load("client:auth2", () => {
          gapi.client.init({
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
            scope: "https://www.googleapis.com/auth/contacts.readonly",
          });
          setGapiLoaded(true);
        });
      } catch (err) {
        console.warn("Google API failed to load", err);
      }
    };

    if (typeof window !== "undefined") {
      loadGapi();
    }
  }, []);

  const extractContactsFromGoogleData = (data) => {
    try {
      return data
        .map((person) => {
          try {
            const name = person.names?.[0]?.displayName?.trim();
            let contactNo = person.phoneNumbers?.[0]?.value?.replace(/\D/g, "");

            if (contactNo && contactNo.length >= 10) {
              contactNo = contactNo.slice(-10);
            } else {
              contactNo = null;
            }

            if (name && contactNo) {
              return { name, contactNo };
            }
            return null;
          } catch (innerErr) {
            console.warn("Skipping a contact due to error:", innerErr);
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error("Error extracting contacts:", error);
      return [];
    }
  };

  const fetchContacts = () => {
    const gapi = window.gapi;
    if (!gapi || !gapi.client) return;

    gapi.client
      .request({
        path: "https://people.googleapis.com/v1/people/me/connections",
        params: {
          personFields: "names,emailAddresses,phoneNumbers",
          pageSize: 100,
        },
      })
      .then((res) => {
        const contactsData = extractContactsFromGoogleData(
          res.result.connections || []
        );
        setContacts(contactsData);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const signIn = () => {
    const gapi = window.gapi;
    if (!gapi || !gapi.auth2) return;
    setLoading(true);

    try {
      gapi.auth2
        .getAuthInstance()
        .signIn()
        .then(fetchContacts)
        .catch((err) => {
          console.warn("Sign-in cancelled or failed", err);
          setLoading(false);
        });
    } catch (e) {
      console.warn("Auth instance error", e);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Icon + Title + Action */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <FcGoogle className="w-6 h-6" />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Google Contacts
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Import your contacts directly from your Google account.
              </p>
            </div>

            <button
              type="button"
              onClick={signIn}
              disabled={!gapiLoaded || loading}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white text-slate-800 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <ImSpinner9 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Secure Import Info Box */}
        <div className="lg:max-w-xs bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <FiInfo className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 mb-0.5">
              Secure Import
            </h4>
            <p className="text-[11px] leading-relaxed text-blue-800/80 font-medium">
              We only access your contact information to import into CargoDesk. Your data is safe and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
