import { getCloudflareContext } from '@opennextjs/cloudflare'

export const createKV = () => getCloudflareContext().env.KV
