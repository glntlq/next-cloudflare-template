'use server'

import { createAI } from '@/lib/ai'

export const imageToText = async ({ buffer, prompt }: { buffer: Uint8Array<ArrayBuffer>; prompt?: string }) => {
  // Get Cloudflare AI instance
  const cloudflareAI = createAI()

  // Run the AI model with the image and prompt
  const result = await cloudflareAI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    image: Array.from(buffer),
    prompt: prompt ?? 'Describe this image in detail',
    max_tokens: 512
  })
  return result
}
