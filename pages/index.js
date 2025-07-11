import Head from "next/head";
import Dashboard from "@/components/dashboard";
import { NextSeo } from "next-seo";
import { getCurrentToken } from "@/utilities/utils";
import { getUserDetailsById } from "@/backend/controllers/userController";
import { parseCookies } from "nookies";

export default function Home({ pageData }) {
  return (
    <div>
      <Head>
        <title>My Dashboard</title>
        <meta
          name="description"
          content="Generated by create next app"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <Dashboard pageData={pageData} />
    </div>
  );
}

export async function getServerSideProps(context) {
  const cookies = parseCookies(context);
  const token = cookies.auth_token;

  const pageData = {};
  const res = context.res;

  let decoded;
  if (token) {
    decoded = getCurrentToken(token);

    if (!decoded || !decoded.userId) {
      // Token invalid or doesn't contain userId → clear cookie & redirect
      res.setHeader(
        "Set-Cookie",
        serialize("auth_token", "", {
          path: "/",
          expires: new Date(0),
          httpOnly: true,
          sameSite: "lax",
        })
      );

      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }
  } else {
    // No token → redirect
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Token is valid → fetch user details from DB
  const [userDetails] = await Promise.all([getUserDetailsById(decoded.userId)]);

  if (!userDetails?.status || !userDetails.data) {
    // User not found → clear cookie & redirect
    res.setHeader(
      "Set-Cookie",
      serialize("auth_token", "", {
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
      })
    );

    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Prepare structured user data
  const userData = {
    userId: userDetails.data.userId,
    firstName: userDetails.data.firstName || "",
    lastName: userDetails.data.lastName || "",
    email: userDetails.data.email || "",
    role: userDetails.data.role || "",
    status: userDetails.data.status || "",
  };

  pageData.user = userData;

  return {
    props: {
      pageData,
    },
  };
}
