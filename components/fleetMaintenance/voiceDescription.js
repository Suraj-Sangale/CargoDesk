"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiMic, FiMicOff, FiAlertCircle, FiGlobe } from "react-icons/fi";

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
];

export default function VoiceDescription({
  value = "",
  onChange,
  placeholder = "Describe the maintenance issue, required parts, repairs, or service observations...",
  error = null,
  disabled = false,
  required = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript) {
          const currentVal = textareaRef.current ? textareaRef.current.value : value;
          const separator = currentVal && !currentVal.endsWith(" ") ? " " : "";
          const newVal = (currentVal + separator + finalTranscript.trim()).trimStart();
          if (onChange) {
            onChange(newVal);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. Please allow microphone access in your browser.");
        } else if (event.error === "network") {
          setSpeechError("Network error during speech recognition.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to initialize SpeechRecognition:", e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [selectedLang]);

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current || !speechSupported || disabled) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Maintenance Description {required && <span className="text-red-500">*</span>}
        </label>

        {/* Voice controls & Language selector */}
        <div className="flex items-center gap-2">
          {speechSupported && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2 py-1">
              <FiGlobe className="w-3 h-3 text-slate-500" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isListening || disabled}
                className="text-[11px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                title="Select speech recognition language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {speechSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              }`}
              title={isListening ? "Stop voice dictation" : "Dictate description using microphone"}
            >
              {isListening ? (
                <>
                  <FiMicOff className="w-3.5 h-3.5" />
                  <span>Listening... Stop</span>
                </>
              ) : (
                <>
                  <FiMic className="w-3.5 h-3.5 text-blue-600" />
                  <span>Voice Dictation</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium italic">
              Mic not supported in this browser
            </span>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={placeholder}
          className={`w-full px-3.5 py-3 text-sm bg-white text-slate-900 font-medium rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
            error
              ? "border-red-500 shadow-[0_2px_0_0_#ef4444]"
              : isListening
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:shadow-[0_2px_0_0_#3b82f6]"
          } ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
        />

        {isListening && (
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Recording speech...</span>
          </div>
        )}
      </div>

      {/* Speech error message */}
      {speechError && (
        <p className="text-amber-600 text-[11px] font-medium flex items-center gap-1 pl-1">
          <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{speechError}</span>
        </p>
      )}

      {/* Validation error message */}
      {error && (
        <p className="text-red-500 text-xs font-normal pl-1 flex items-center gap-1">
          <span>{typeof error === "object" ? error?.message : error}</span>
        </p>
      )}
    </div>
  );
}
