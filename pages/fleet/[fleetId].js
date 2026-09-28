import React from "react";
import Head from "next/head";
import FleetDetailsWrapper from "@/components/fleetDetails/fleetDetailsWrapper";
import { getFleetByIdController } from "@/backend/controllers/fleetController";
import { getFleetActivityHistoryModel } from "@/backend/models/fleetActivityModel";
import { withUserSsr } from "@/utilities/withUserSsr";

export default function FleetDetailsPage({ pageData }) {
  const vehicleNo = pageData?.fleet?.vehicle_number || "Fleet";

  return (
    <>
      <Head>
        <title>{vehicleNo} - Fleet Details | CargoDesk</title>
        <meta
          name="description"
          content={`Detailed specifications, document records, and operational activity history for fleet vehicle ${vehicleNo}`}
        />
      </Head>

      <FleetDetailsWrapper
        initialFleet={pageData?.fleet || null}
        initialHistory={pageData?.history || []}
        initialSummary={pageData?.summary || {}}
      />
    </>
  );
}

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const { fleetId } = context.params || {};
  const pageData = {};

  try {
    if (fleetId) {
      // 1. Fetch Fleet Details & related counts
      const fleetRes = await getFleetByIdController(fleetId);
      if (fleetRes?.status && fleetRes.data) {
        pageData.fleet = fleetRes.data;
      }

      // 2. Fetch Initial Activity History
      const historyRes = await getFleetActivityHistoryModel({
        fleetId,
        page: 1,
        limit: 20,
      });

      if (historyRes?.status) {
        pageData.history = historyRes.data || [];
        pageData.summary = historyRes.summary || {};
      }
    }
  } catch (error) {
    console.error("Error fetching fleet details in SSR:", error);
  }

  return {
    props: {
      pageData,
    },
  };
});
