const LOCAL_FRONTEND_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function resolveFrontendOrigins(
  configuredOrigins: string | undefined,
  netlifySiteUrl: string | undefined,
  production: boolean,
): Set<string> {
  const origins = new Set(
    (configuredOrigins || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  if (netlifySiteUrl?.trim()) {
    let siteOrigin: URL;
    try {
      siteOrigin = new URL(netlifySiteUrl.trim());
    } catch {
      throw new Error("Netlify URL must be an absolute site URL.");
    }
    if (production && siteOrigin.protocol !== "https:") {
      throw new Error("Production Netlify URL must use HTTPS.");
    }
    origins.add(siteOrigin.origin);
  }

  if (production && origins.size === 0) {
    throw new Error(
      "Production requires FRONTEND_ORIGINS or Netlify's URL environment variable.",
    );
  }

  if (!production) {
    for (const origin of LOCAL_FRONTEND_ORIGINS) origins.add(origin);
  }

  return origins;
}
