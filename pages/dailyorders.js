import DailyOrdersWrapper from "@/components/dailyOrders/dailyOrdersWrapper";
import { requireValidUser } from "@/utilities/authServer";
import React from "react";

export default function Dailyorders({ pageData }) {
  return (
    <>
      <DailyOrdersWrapper pageData={pageData} />
    </>
  );
}
export async function getServerSideProps(context) {
  const { user, redirect } = await requireValidUser(context);
  if (redirect) return { redirect };

  const pageData = {};
  pageData.user = user;

  return { props: { pageData } };
}
