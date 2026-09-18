import DriversWrapper from "@/components/drivers/driversWrapper";
import { getAllDriversController } from "@/backend/controllers/driverController";
import { withUserSsr } from "@/utilities/withUserSsr";
import React from "react";
import Head from "next/head";

export default function Drivers({ pageData }) {
  return (
    <>
      <Head>
        <title>Driver Management | CargoDesk</title>
        <meta
          name="description"
          content="Manage, track, and assign transport drivers with CargoDesk"
        />
      </Head>
      <DriversWrapper pageData={pageData} />
    </>
  );
}

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const pageData = {};
  try {
    const driversRes = await getAllDriversController();
    if (driversRes?.status && Array.isArray(driversRes.data)) {
      pageData.drivers = driversRes.data;
    }
  } catch (error) {
    console.error("Error fetching drivers in SSR:", error);
  }

  return {
    props: {
      pageData,
    },
  };
});
