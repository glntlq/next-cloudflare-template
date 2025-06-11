'use server'

import { createAI } from '@/lib/ai'
import { createR2 } from '@/lib/r2'

export async function cloudflareTextToImage(prompt: string) {
  try {
    const ai = createAI()
    const r2 = createR2()

    const response = await ai.run('@cf/bytedance/stable-diffusion-xl-lightning', {
      prompt,
      negative_prompt: 'blurry, low resolution, distorted, overly bright, cartoonish, text, watermark',
      height: 720,
      width: 1280,
      num_steps: 8
    })

    // Read the ReadableStream<Uint8Array> and convert it to a base64 string
    const reader = response.getReader()
    const chunks: Uint8Array[] = []
    let done, value

    while ((({ done, value } = await reader.read()), !done)) {
      chunks.push(value!)
    }

    const imageBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      imageBuffer.set(chunk, offset)
      offset += chunk.length
    }

    const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`

    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    const filename = `${Date.now()}-${sanitizedPrompt}.png`

    try {
      await r2.put(filename, imageBuffer, {
        httpMetadata: {
          contentType: 'image/png'
        }
      })
    } catch (r2Error) {
      console.error('Error storing image in R2:', r2Error)
    }

    return {
      success: true,
      imageData: base64Image,
      imageUrl: filename,
      error: null
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return {
      success: false,
      imageData: null,
      imageUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
