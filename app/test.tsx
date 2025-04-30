'use client'

import { useState, useRef } from 'react'

import { imageToText } from '@/actions/imageToText'
import { getTableSchemas, getUsersTest } from '@/actions/test'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const TextButton = () => {
  const [image, setImage] = useState<File | null>(null)
  const [prompt, setPrompt] = useState<string>('')
  const [response, setResponse] = useState<AiImageToTextOutput>()
  const [loading, setLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0])
    }
  }

  const processImage = async () => {
    if (!image) {
      alert('Please select an image first')
      return
    }

    setLoading(true)
    try {
      // Convert the image to binary data
      const imageBuffer = await image.arrayBuffer()
      const imageData = new Uint8Array(imageBuffer)

      const data = await imageToText({ buffer: imageData, prompt })
      // Get Cloudflare AI instance

      setResponse(data)
    } catch (error) {
      console.error('Error processing image:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="image-upload" className="font-medium">
          Upload Image
        </label>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} />
        {image && (
          <div className="mt-2">
            <p>Selected image: {image.name}</p>
            <img src={URL.createObjectURL(image)} alt="Preview" className="mt-2 max-h-64 max-w-xs object-contain" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="prompt" className="font-medium">
          Prompt (Optional)
        </label>
        <Input
          id="prompt"
          type="text"
          placeholder="Describe this image in detail"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <Button onClick={processImage} disabled={!image || loading}>
        {loading ? 'Processing...' : 'Analyze Image'}
      </Button>

      {response && (
        <div className="mt-4 rounded-md border bg-gray-50 p-4">
          <h3 className="mb-2 font-medium">AI Response:</h3>
          <p className="whitespace-pre-wrap">{JSON.stringify(response)}</p>
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <h3 className="mb-2 font-medium">Database Test:</h3>
        <Button
          onClick={async () => {
            const data = await getTableSchemas()
            const users = await getUsersTest()
            // eslint-disable-next-line no-console
            console.log('Data:', users, data)
          }}
        >
          Test Database
        </Button>
      </div>
    </div>
  )
}
