import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  basePath: '/marta-devdays',
  assetPrefix: '/marta-devdays',
  images: { unoptimized: true },
  serverExternalPackages: ['gtfs-realtime-bindings'],
};

export default config;
