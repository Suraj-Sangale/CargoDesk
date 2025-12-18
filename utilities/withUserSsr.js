import { requireValidUser } from "@/utilities/authServer";

export function withUserSsr(handler) {
  return async function getServerSideProps(context) {
    const { user, redirect } = await requireValidUser(context);
    if (redirect) return { redirect };

    if (!handler) {
      return {
        props: {
          pageData: { user },
        },
      };
    }

    const handlerResult = await handler(context, { user });

    if (handlerResult?.redirect || handlerResult?.notFound) {
      return handlerResult;
    }

    const handlerProps = handlerResult?.props || {};
    const mergedProps = {
      ...handlerProps,
      pageData: {
        ...(handlerProps.pageData || {}),
        user,
      },
    };

    return { props: mergedProps };
  };
}


