/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kin-store/core", "@kin-store/react", "@kin-store/plugins"],
  turbopack: {
     root: '../../'
  }
};

export default nextConfig;
