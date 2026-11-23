import React from "react";
import Head from "next/head";
import OrganizationDetailsWrapper from "@/components/organizations/organizationDetailsWrapper";
import { getOrganizationDetailsController } from "@/backend/controllers/organizationController";
import { withUserSsr } from "@/utilities/withUserSsr";

export default function OrganizationDetailsPage({ pageData }) {
  const orgName = pageData?.organizationDetails?.organization?.orgName || "Organization";

  return (
    <>
      <Head>
        <title>{orgName} - Organization Details | CargoDesk</title>
        <meta
          name="description"
          content={`Super Admin tenant management: overview, fleets, staff allocation and drivers for ${orgName}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <OrganizationDetailsWrapper
        initialData={pageData?.organizationDetails || null}
        currentUser={pageData?.user || null}
      />
    </>
  );
}

export const getServerSideProps = withUserSsr(
  async (context, { user }) => {
    const { id } = context.params || {};

    if (!id) {
      return { notFound: true };
    }

    try {
      const res = await getOrganizationDetailsController(id, user);

      if (!res?.status || !res?.data) {
        return { notFound: true };
      }

      return {
        props: {
          pageData: {
            organizationDetails: res.data,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching organization details in SSR:", error);
      return { notFound: true };
    }
  },
  { allowedRoles: ["super_admin"] }
);
