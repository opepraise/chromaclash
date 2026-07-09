/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  webpack: (config) => {
    // Optional peer deps pulled in by wallet connector SDKs that aren't used in the browser bundle.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      encoding: false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};
export default config;
