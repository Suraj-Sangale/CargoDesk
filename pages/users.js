import React from "react";
import Head from "next/head";
import UsersWrapper from "@/components/users/usersWrapper";
import { getAllUsersController } from "@/backend/controllers/userController";
import { getAllOrganizationsController } from "@/backend/controllers/organizationController";
import { withUserSsr } from "@/utilities/withUserSsr";

export default function UsersPage({ pageData }) {
  return (
    <>
      <Head>
        <title>Organizations, Sub-Users & Roles | CargoDesk</title>
        <meta
          name="description"
          content="Super Admin multi-tenant access: manage organizations, provision administrators, operations coordinators, and maintenance supervisors."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <UsersWrapper pageData={pageData} />
    </>
  );
}

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const isSuperAdmin =
    user?.role === "super_admin" || user?.email === "suraj@agnibyte.com";
  const filterOrgId = isSuperAdmin ? null : user?.orgId || null;
  const pageData = { user, users: [], organizations: [] };

  try {
    const [usersRes, orgsRes] = await Promise.all([
      getAllUsersController(filterOrgId),
      getAllOrganizationsController(),
    ]);

    if (usersRes?.status && Array.isArray(usersRes.data)) {
      pageData.users = usersRes.data;
    }

    if (orgsRes?.status && Array.isArray(orgsRes.data)) {
      pageData.organizations = orgsRes.data;
    }
  } catch (error) {
    console.error("Error prefetching data in SSR:", error);
  }

  return {
    props: {
      pageData,
    },
  };
});
