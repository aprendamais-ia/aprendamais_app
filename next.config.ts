import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Detected sibling lockfile in /Users/macbookpro — pin tracing root explicitly.
  outputFileTracingRoot: __dirname,
  // typedRoutes desabilitado até as rotas reais existirem (E1, Fase 1)
  // typedRoutes: true,
};

export default nextConfig;
