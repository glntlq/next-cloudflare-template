namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BASE_URL: string
    NEXT_PUBLIC_ADMIN_ID: string
  }
}

interface CloudflareEnv {
  DB: D1Database
  KV: KVNamespace
  AI: Ai
}

type Env = CloudflareEnv
