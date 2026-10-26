import { requireValidUser } from "@/utilities/authServer";
import executeQuery from "@/helpers/dbConnection";
import { getModuleIdFromPath, ALL_MODULE_IDS } from "@/utilities/organizationModules";

/**
 * Higher-order function for getServerSideProps that automatically enforces authentication,
 * extracts the verified user, loads organization module access, restricts blocked modules,
 * and injects it into pageProps.
 *
 * @param {Function} [handler] - Optional custom SSR handler
 * @param {object} [options] - Options like { allowedRoles: ['admin'] }
 */
export function withUserSsr(handler, options = {}) {
  const allowedRoles = options?.allowedRoles || null;

  return async function getServerSideProps(context) {
    const { user, redirect } = requireValidUser(context, allowedRoles);
    if (redirect) return { redirect };

    const isSuperAdmin =
      user?.role === "super_admin" || user?.email === "suraj@agnibyte.com";

    // Legacy session cookie fallback: If orgId is missing from token, fetch it from database
    if (!user?.orgId && user?.userId) {
      try {
        const uRows = await executeQuery("SELECT orgId FROM users WHERE userId = ?", [user.userId]);
        if (uRows && uRows.length > 0 && uRows[0].orgId) {
          user.orgId = Number(uRows[0].orgId);
        }
      } catch (e) {
        console.error("Failed to fallback query orgId in withUserSsr:", e);
      }
    }

    // For non-superadmin users with an assigned organization, check organization module permissions
    if (!isSuperAdmin && user?.orgId) {
      try {
        const orgRows = await executeQuery(
          "SELECT orgId, orgName, allowedModules, status FROM organizations WHERE orgId = ?",
          [user.orgId]
        );

        if (orgRows && orgRows.length > 0) {
          const org = orgRows[0];
          user.orgName = org.orgName;

          let parsedModules = null;
          if (org.allowedModules) {
            try {
              parsedModules =
                typeof org.allowedModules === "string"
                  ? JSON.parse(org.allowedModules)
                  : org.allowedModules;
            } catch (_) {
              parsedModules = String(org.allowedModules)
                .split(",")
                .map((m) => m.trim());
            }
          } else {
            parsedModules = ALL_MODULE_IDS;
          }

          user.orgModules = Array.isArray(parsedModules) ? parsedModules : ALL_MODULE_IDS;

          // Check if current route is blocked for this organization
          const currentUrl = context.resolvedUrl || context.req?.url || "/";
          const currentModule = getModuleIdFromPath(currentUrl);

          if (
            currentModule &&
            Array.isArray(user.orgModules) &&
            !user.orgModules.includes(currentModule)
          ) {
            return {
              redirect: {
                destination: `/module-blocked?module=${encodeURIComponent(currentModule)}`,
                permanent: false,
              },
            };
          }
        }
      } catch (err) {
        console.error("Error loading org modules in withUserSsr:", err?.message);
      }
    }

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
