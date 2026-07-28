import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  sassOptions: {
    // SCSS Modules 어디서든 `@use "abstracts" as *;`로 디자인 토큰 접근
    loadPaths: [path.join(process.cwd(), "styles")],
  },
};

export default nextConfig;
