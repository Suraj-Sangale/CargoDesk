import { requireValidUser } from "@/utilities/authServer";

/**
 * Higher-order function for getServerSideProps that automatically enforces authentication,
 * extracts the verified user, and injects it into pageProps.
 *
 * @param {Function} [handler] - Optional custom SSR handler
 * @param {object} [options] - Options like { allowedRoles: ['admin'] }
 */
export function withUserSsr(handler, options = {}) {
  const allowedRoles = options?.allowedRoles || null;

  return async function getServerSideProps(context) {
    const { user, redirect } = requireValidUser(context, allowedRoles);
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
