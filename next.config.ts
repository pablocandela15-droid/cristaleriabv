import type { NextConfig } from "next";

/** Panel de administración (repo admin-cristaleriabv): /admin redirige allí. */
const PANEL_URL = "https://admin-cristaleriabv.vercel.app";

/** Fotos del panel: bucket público `web-fotos` del Supabase del proyecto. */
const FOTOS_PATH = "/storage/v1/object/public/web-fotos/**";
const SUPABASE_PROYECTO = "gorekooabfhqudeshtgq.supabase.co";

function supabaseRemotePatterns() {
  const patterns: { protocol: "http" | "https"; hostname: string; port: string; pathname: string }[] = [
    { protocol: "https", hostname: SUPABASE_PROYECTO, port: "", pathname: FOTOS_PATH },
  ];
  // Si NEXT_PUBLIC_SUPABASE_URL apunta a otro proyecto (o a un Supabase local), también se admite.
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    if (url.hostname !== SUPABASE_PROYECTO) {
      patterns.push({ protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname, port: url.port, pathname: FOTOS_PATH });
    }
  } catch {
    // Sin variable o con un valor no válido: solo el proyecto de siempre.
  }
  return patterns;
}

const nextConfig: NextConfig = {
  // Versión (commit) y despliegue con los que se construye, para la actividad que la web manda a Logs del panel
  // (src/lib/actividad): así el panel sabe si un error es de una versión antigua tras publicar.
  env: {
    ACTIVIDAD_VERSION: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 12),
    ACTIVIDAD_DESPLIEGUE: process.env.VERCEL_DEPLOYMENT_ID ?? "",
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseRemotePatterns(),
  },
  async redirects() {
    return [
      { source: "/admin", destination: PANEL_URL, permanent: false },
      { source: "/admin/:path*", destination: PANEL_URL, permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
