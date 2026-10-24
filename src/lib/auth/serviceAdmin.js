import { timingSafeEqual } from "node:crypto";

// This credential is for Enixera's control plane, never for inference or host tools.
export function hasServiceAdminToken(request) {
  const expected = process.env.ENIXERA_ROUTER_ADMIN_KEY;
  const supplied = request.headers.get("authorization");
  if (!expected || expected.length < 32 || !supplied?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(supplied.slice(7));
  const wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

export function serviceAdminRoute(pathname, method) {
  if (/^\/api\/(providers|combos)(\/|$)/.test(pathname)) return "allow";
  if (pathname === "/api/keys" && method === "GET") return "allow";
  // The upstream router has no Enixera package budget enforcement. Refuse
  // provisioning instead of silently issuing an unrestricted customer key.
  if (/^\/api\/(keys|usage)(\/|$)/.test(pathname)) return "unsupported";
  return "deny";
}
