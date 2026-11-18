import { requireValidUser } from "@/utilities/authServer";
import executeQuery from "@/helpers/dbConnection";
import { getModuleIdFromPath, ALL_MODULE_IDS } from "@/utilities/organizationModules";
import { getOrSetCache, deleteCache, invalidateCachePattern } from "@/helpers/cacheService";

// Fast L1 in-memory cache to prevent redundant remote DB round-trips on every page navigation
const orgCache = new Map();
const ORG_CACHE_TTL_MS = 60 * 1000; // 60 seconds L1 TTL

export function invalidateOrgSsrCache(orgId) {
  if (orgId) {
    orgCache.delete(Number(orgId));
    deleteCache(`cargodesk:org:${Number(orgId)}:ssr_details`);
  } else {
    orgCache.clear();
    invalidateCachePattern("cargodesk:org:*:ssr_details");
  }
}

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

    // Restrict maintenance supervisors exclusively to the dedicated maintenance supervisor landing page
    if (user?.role === "maintenance_supervisor") {
      const currentUrl = context.resolvedUrl || context.req?.url || "/";
      const cleanPath = currentUrl.split("?")[0];
      if (cleanPath !== "/maintenance-supervisor" && !cleanPath.startsWith("/api/")) {
        return {
          redirect: {
            destination: "/maintenance-supervisor",
            permanent: false,
          },
        };
      }
    }

    const isSuperAdmin =
      user?.role === "super_admin" || user?.email === "suraj@agnibyte.com";

    // Legacy session cookie fallback: If orgId is missing from token, fetch it with Redis cache
    if (!user?.orgId && user?.userId) {
      try {
        const cachedOrgId = await getOrSetCache(
          `cargodesk:user:${user.userId}:orgId`,
          3600,
          async () => {
            const uRows = await executeQuery("SELECT orgId FROM users WHERE userId = ? LIMIT 1", [user.userId]);
            return uRows && uRows.length > 0 && uRows[0].orgId ? Number(uRows[0].orgId) : null;
          }
        );
        if (cachedOrgId) {
          user.orgId = cachedOrgId;
        }
      } catch (e) {
        console.error("Failed to fallback query orgId in withUserSsr:", e);
      }
    }

    // For non-superadmin users with an assigned organization, check organization module permissions
    if (!isSuperAdmin && user?.orgId) {
      try {
        const numericOrgId = Number(user.orgId);
        const cached = orgCache.get(numericOrgId);
        let org = null;

        if (cached && cached.expiresAt > Date.now()) {
          org = cached.data;
        } else {
          // L2 Redis cache (10 min TTL) with L3 MySQL fallback
          org = await getOrSetCache(
            `cargodesk:org:${numericOrgId}:ssr_details`,
            600,
            async () => {
              const orgRows = await executeQuery(
                "SELECT orgId, orgName, allowedModules, status FROM organizations WHERE orgId = ?",
                [numericOrgId]
              );
              return orgRows && orgRows.length > 0 ? orgRows[0] : null;
            }
          );

          if (org) {
            orgCache.set(numericOrgId, {
              data: org,
              expiresAt: Date.now() + ORG_CACHE_TTL_MS,
            });
          }
        }

        if (org) {
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
