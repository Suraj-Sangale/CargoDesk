import "../styles/globals.css";
import CommonLayout from "@/layout/commonLayout";
import LoginLayout from "@/layout/loginLayout";
import { FleetDriverProvider } from "@/context/fleetDriverContext";
import { Toaster } from "react-hot-toast";

export default function MyApp({ Component, pageProps }) {
  const selectLayout = (component) => {
    if (typeof Component.layoutName !== "undefined") {
      if (Component.layoutName === "login") {
        return <LoginLayout>{component}</LoginLayout>;
      }
    }

    return <CommonLayout pageProps={pageProps}>{component}</CommonLayout>;
  };

  return (
    <FleetDriverProvider
      initialFleets={pageProps?.pageData?.fleets || []}
      initialDrivers={pageProps?.pageData?.drivers || []}
    >
      {selectLayout(<Component {...pageProps} />)}

      <Toaster />
    </FleetDriverProvider>
  );
}
