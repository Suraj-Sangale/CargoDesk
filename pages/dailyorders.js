import DailyOrdersWrapper from "@/components/dailyOrders/dailyOrdersWrapper";
import { withUserSsr } from "@/utilities/withUserSsr";
import React from "react";

export default function Dailyorders({ pageData }) {
  return (
    <>
      <DailyOrdersWrapper pageData={pageData} />
    </>
  );
}
export const getServerSideProps = withUserSsr();
