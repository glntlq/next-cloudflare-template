import { exec } from 'child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

// 查找本地D1数据库文件
function findLocalD1Database() {
  const basePath = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

  if (!existsSync(basePath)) {
    console.error("本地D1数据库目录不存在。请先运行 'pnpm db:migrate-local' 创建数据库。")
    return null
  }

  const files = readdirSync(basePath)
  const sqliteFiles = files.filter((file) => file.endsWith('.sqlite'))

  if (sqliteFiles.length === 0) {
    console.error("找不到本地D1数据库文件。请先运行 'pnpm db:migrate-local' 创建数据库。")
    return null
  }

  return path.join(process.cwd(), basePath, sqliteFiles[0])
}

async function startDrizzleStudio() {
  const dbPath = findLocalD1Database()
  if (!dbPath) return

  console.log(`找到本地D1数据库: ${dbPath}`)

  // 备份原始配置文件
  const configPath = path.join(process.cwd(), 'drizzle.config.ts')
  const originalConfig = readFileSync(configPath, 'utf-8')

  try {
    // 更新配置文件以使用具体的数据库文件路径
    const updatedConfig = originalConfig.replace(/url:.*$/m, `url: '${dbPath.replace(/\\/g, '\\\\')}'`)
    writeFileSync(configPath, updatedConfig)

    console.log('临时更新配置文件以指向具体的数据库文件')
    console.log('启动 Drizzle Studio...')

    // 启动Drizzle Studio
    const studioProcess = exec('drizzle-kit studio --port 3333')

    studioProcess.stdout?.on('data', (data) => {
      console.log(data)
    })

    studioProcess.stderr?.on('data', (data) => {
      console.error(data)
    })

    // 确保在进程终止时恢复配置
    process.on('SIGINT', () => {
      writeFileSync(configPath, originalConfig)
      console.log('\n已恢复原始配置文件')
      process.exit()
    })

    studioProcess.on('close', (code) => {
      // 恢复原始配置
      writeFileSync(configPath, originalConfig)
      console.log('已恢复原始配置文件')
      console.log(`Drizzle Studio 已关闭，退出码: ${code}`)
    })
  } catch (error) {
    // 出错时恢复配置
    writeFileSync(configPath, originalConfig)
    console.error('发生错误，已恢复原始配置文件:', error)
  }
}

startDrizzleStudio()
