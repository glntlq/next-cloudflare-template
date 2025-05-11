'use server'

import { sleep } from 'cloudflare/core.mjs'

export async function ServerLessActiveTimesTest(n: number) {
  await sleep(n)
}
