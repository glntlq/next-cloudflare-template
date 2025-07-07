'use server'

import { createAI } from '@/lib/ai'
import { createR2 } from '@/lib/r2'

export type ImageRatio = '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | 'custom'
export type ImageStyle = 'realistic' | 'artistic' | 'anime' | 'cinematic' | 'fantasy' | 'abstract'

interface ImageGenerationOptions {
  prompt: string
  negativePrompt?: string
  ratio?: ImageRatio
  style?: ImageStyle
  customWidth?: number
  customHeight?: number
  steps?: number
  seed?: number
}

const styleEnhancers: Record<ImageStyle, string> = {
  realistic: 'highly detailed, photorealistic, sharp focus, professional photography, 8k',
  artistic: 'artistic style, vibrant colors, expressive, detailed brushstrokes, creative composition',
  anime: 'anime style, cel shading, vibrant colors, detailed, clean lines, 2D illustration',
  cinematic: 'cinematic lighting, dramatic composition, movie scene, high production value, film grain',
  fantasy: 'fantasy art, magical atmosphere, ethereal lighting, detailed environment, vibrant colors',
  abstract: 'abstract art, non-representational, geometric shapes, bold colors, expressive composition'
}

const styleNegativePrompts: Record<ImageStyle, string> = {
  realistic:
    'cartoon, illustration, drawing, painting, anime, blurry, low resolution, distorted, deformed, text, watermark',
  artistic: 'photorealistic, blurry, low quality, distorted, deformed, text, watermark',
  anime: 'photorealistic, blurry, low quality, 3D, distorted, deformed, text, watermark',
  cinematic:
    'cartoon, illustration, drawing, painting, anime, blurry, low resolution, distorted, deformed, text, watermark',
  fantasy: 'blurry, low quality, distorted, deformed, text, watermark',
  abstract: 'photorealistic, blurry, low quality, distorted, deformed, text, watermark'
}

function getDimensions(
  ratio: ImageRatio,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  if (ratio === 'custom' && customWidth && customHeight) {
    return { width: customWidth, height: customHeight }
  }

  switch (ratio) {
    case '1:1':
      return { width: 1024, height: 1024 }
    case '16:9':
      return { width: 1280, height: 720 }
    case '4:3':
      return { width: 1024, height: 768 }
    case '3:2':
      return { width: 1200, height: 800 }
    case '9:16':
      return { width: 720, height: 1280 }
    default:
      return { width: 1024, height: 1024 }
  }
}

export async function cloudflareTextToImage({
  prompt,
  negativePrompt,
  ratio = '16:9',
  style = 'realistic',
  customWidth,
  customHeight,
  steps = 8,
  seed
}: ImageGenerationOptions) {
  try {
    const ai = createAI()
    const r2 = createR2()

    const enhancedPrompt = `${prompt}, ${styleEnhancers[style]}`

    const finalNegativePrompt = negativePrompt
      ? `${negativePrompt}, ${styleNegativePrompts[style]}`
      : styleNegativePrompts[style]

    const { width, height } = getDimensions(ratio, customWidth, customHeight)

    const response = await ai.run('@cf/bytedance/stable-diffusion-xl-lightning', {
      prompt: enhancedPrompt,
      negative_prompt: finalNegativePrompt,
      height,
      width,
      num_steps: steps,
      seed: seed || Math.floor(Math.random() * 2147483647)
    })

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
    const timestamp = Date.now()
    const filename = `${timestamp}-${sanitizedPrompt}-${width}x${height}.png`

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
      error: null,
      metadata: {
        prompt: enhancedPrompt,
        negativePrompt: finalNegativePrompt,
        width,
        height,
        steps,
        seed,
        style,
        timestamp
      }
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
