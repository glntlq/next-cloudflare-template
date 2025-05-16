'use server'

import { createAI } from '@/lib/ai'

export async function cloudflareTextToImage(prompt: string) {
  try {
    const ai = createAI()
    const response = await ai.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: prompt
    })

    const base64Image = response.image?.startsWith('data:image/')
      ? response.image
      : `data:image/png;base64,${response.image}`

    return {
      success: true,
      imageData: base64Image,
      error: null
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return {
      success: false,
      imageData: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
