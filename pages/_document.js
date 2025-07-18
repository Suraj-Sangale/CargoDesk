import FontLoad from "@/layout/fontLoad";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <FontLoad />
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
