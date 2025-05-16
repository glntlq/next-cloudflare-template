import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  devIndicators: false,
  useCache: true,
  reactCompiler: true,
  ppr: true,
  typedRoutes: false,
  dynamicIO: false,
  experimental: {
    staleTimes: {
      dynamic: 3600,
      static: 3600
    }
  }
}

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})
export default withNextIntl(nextConfig)
