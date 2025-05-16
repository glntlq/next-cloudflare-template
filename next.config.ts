import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  devIndicators: false
}

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})
export default withNextIntl(nextConfig)
