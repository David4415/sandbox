import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    devIndicators : false
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source map upload token, a build-time secret kept out of git
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Upload a wider set of client files for better stack traces
  widenClientFileUpload: true,
  // Proxy browser events through our own domain so ad-blockers cannot drop them
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
})
