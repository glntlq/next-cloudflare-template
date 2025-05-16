'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { sleep } from 'cloudflare/core.mjs'

export async function ServerLessActiveTimesTest(n: number) {
  await sleep(n)
}

export async function enqueueDurableObjectTask(taskData: any) {
  const queue = getCloudflareContext().env.NEXT_CACHE_DO_QUEUE

  // Get the Durable Object stub
  const queueId = queue?.idFromName('default-queue')
  if (queueId) {
    const queueStub = queue?.get(queueId)

    // Send a request to the Durable Object
    const response = await queueStub?.fetch('https://queue.internal/enqueue', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
    if (response?.ok) {
      const data = await response?.json()
      return data
    } else {
      const data = await response?.json()
      throw new Error(`Failed to enqueue task: ${JSON.stringify(data)}`)
    }
  }
}
