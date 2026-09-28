import Head from "next/head";
import Dashboard from "@/components/dashboard";
import { withUserSsr } from "@/utilities/withUserSsr";

export default function Home({ pageData }) {
  return (
    <div>
      <Head>
        <title>My Dashboard | CargoDesk</title>
        <meta
          name="description"
          content="CargoDesk logistics and fleet management dashboard"
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

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const pageData = { user };
  return { props: { pageData } };
});
