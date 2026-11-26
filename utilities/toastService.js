
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
    color: "#000000",
    iconPrimary: "#000000",
    iconSecondary: "#fff573",
  },
  default: {
    backgroundColor: "#fff",
    color: "#1c1b1b",
    iconPrimary: "#1c1b1b",
    iconSecondary: "#fff",
  },
};

export const showToast = ({
  message,
  type = "success",
  position = "bottom-right",
  duration = 5000,
  style = {},
  iconTheme = {},
  customRender = null,
}) => {
  const theme = TOAST_THEMES[type] || TOAST_THEMES.default;

  const options = {
    duration,
    position,
    style: {
      background: theme.backgroundColor,
      color: theme.color,
      borderRadius: "8px",
      padding: "12px 26px",
      ...style,
    },
    iconTheme: {
      primary: theme.iconPrimary,
      secondary: theme.iconSecondary,
      ...iconTheme,
    },
  };

  const toastMethods = {
    success: toast.success,
    error: toast.error,
    loading: toast.loading,
  };

  if (type === "custom" && customRender) {
    return toast(customRender, options);
  }

  const toastMethod = toastMethods[type] || toast;

  return toastMethod(message, options);
};
