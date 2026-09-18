import FleetsWrapper from "@/components/fleets/fleetsWrapper";
import { getAllFleetsController } from "@/backend/controllers/fleetController";
import { withUserSsr } from "@/utilities/withUserSsr";
import React from "react";
import Head from "next/head";

export default function Fleets({ pageData }) {
  return (
    <>
      <Head>
        <title>Fleet Management | CargoDesk</title>
        <meta
          name="description"
          content="Manage and track your vehicle fleets with CargoDesk"
        />
      </Head>
      <FleetsWrapper pageData={pageData} />
    </>
  );
}

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const pageData = {};
  try {
    const fleetsRes = await getAllFleetsController();
    if (fleetsRes?.status && Array.isArray(fleetsRes.data)) {
      pageData.fleets = fleetsRes.data;
    }
  } catch (error) {
    console.error("Error fetching fleets in SSR:", error);
  }

  return {
    props: {
      pageData,
    },
  };
});
