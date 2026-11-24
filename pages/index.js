import Head from "next/head";
import Dashboard from "@/components/dashboard";
import { withUserSsr } from "@/utilities/withUserSsr";
import { getAllVehicleDocumentsController } from "@/backend/controllers/vehicleDocumentController";

export default function Home({ pageData }) {
  return (
    <div>
      <Head>
        <title>My Dashboard | CargoDesk</title>
        <meta
          name="description"
          content="CargoDesk logistics and fleet management dashboard"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Dashboard pageData={pageData} />
    </div>
  );
}

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  if (user?.role === "maintenance_supervisor") {
    return {
      redirect: {
        destination: "/maintenance-supervisor",
        permanent: false,
      },
    };
  }

  const pageData = { user };
  pageData.documentsList = [];
  // const documentsResponse = await getAllVehicleDocumentsController({}, user);
  const documentsResponse = await getAllVehicleDocumentsController(
    {
      page: 1,
      limit: 2,
      // totalRecords: 35,
      // totalPages: 4,
      hasNextPage: true,
      hasPrevPage: true,
    },
    user,
  );
  if (documentsResponse && documentsResponse?.status == true) {
    pageData.responseData = documentsResponse;
  }

  return { props: { pageData } };
});
