import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ["pabi", "localhost", "192.168.86.49", "100.89.99.106"],
    env: {
        NEXT_PUBLIC_APP_VERSION: pkg.version,
    },
};

export default nextConfig;
