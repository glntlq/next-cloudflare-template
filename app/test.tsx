'use client'

import { getTableSchemas, getUsersTest } from '@/actions/test'
import { Button } from '@/components/ui/button'

export const TextButton = () => {
  return (
    <Button
      onClick={async () => {
        const data = await getTableSchemas()
        const users = await getUsersTest()
        // eslint-disable-next-line no-console
        console.log('Data:', users, data)
      }}
    >
      Test
    </Button>
  )
}
