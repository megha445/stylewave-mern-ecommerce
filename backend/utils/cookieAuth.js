const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  path: "/",
};

export const COOKIE_NAMES = {
  admin: "admin_token",
  seller: "seller_token",
  user: "user_token",
};

export const setAuthCookie = (res, role, token, maxAgeMs) => {
  res.cookie(COOKIE_NAMES[role], token, { ...COOKIE_OPTIONS, maxAge: maxAgeMs });
};

export const clearAuthCookie = (res, role) => {
  res.clearCookie(COOKIE_NAMES[role], COOKIE_OPTIONS);
};

export const getTokenFromRequest = (req, role) => {
  const cookieName = COOKIE_NAMES[role];
  if (req.cookies?.[cookieName]) return req.cookies[cookieName];
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  return null;
};

export const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};
