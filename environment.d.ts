namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    NEXT_PUBLIC_BASE_URL: string
    AI: Ai
  }
}

interface CloudflareEnv {
  DB: D1Database
  KV: KVNamespace
  AI: Ai
}

type Env = CloudflareEnv
