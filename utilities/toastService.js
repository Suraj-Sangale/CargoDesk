
import React from "react";
import toast from "react-hot-toast";

const TOAST_THEMES = {
  success: {
    backgroundColor: "#05b36a",
    color: "#fff",
    iconPrimary: "#fff",
    iconSecondary: "#05b36a",
  },
  error: {
    backgroundColor: "#fa582f",
    color: "#fff",
    iconPrimary: "#fff",
    iconSecondary: "#fa582f",
  },
  info: {
    backgroundColor: "#fff573",
    color: "#000",
    iconPrimary: "#000",
    iconSecondary: "#fff573",
  },
  default: {
    backgroundColor: "#fff",
    color: "#1c1b1b",
    iconPrimary: "#1c1b1b",
    iconSecondary: "#fff",
  },
};

const CustomToast = ({ message, type, duration, style, onClose }) => {
  const theme = TOAST_THEMES[type] || TOAST_THEMES.default;

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-lg"
      style={{
        background: theme.backgroundColor,
        color: theme.color,
        minWidth: "280px",
        ...style,
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="text-sm font-medium">{message}</span>

        <button
          onClick={onClose}
          className="shrink-0 text-lg font-bold opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {/* <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
        <div
          className="h-full origin-left bg-current"
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>
        {`
          @keyframes toast-progress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}
      </style> */}
    </div>
  );
};

export const showToast = ({
  message,
  type = "success",
  position = "bottom-right",
  duration = 5000,
  style = {},
}) => {
  const toastId = toast.custom(
    (t) => (
      <CustomToast
        message={message}
        type={type}
        duration={duration}
        style={style}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    {
      id: undefined,
      duration,
      position,
    }
  );

  return toastId;
};
