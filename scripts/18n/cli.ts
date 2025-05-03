/**
 * 国际化翻译命令行工具
 * 用于自动化翻译项目中的国际化消息文件
 */
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { translateMessages, TranslationMode, TranslationOptions, TranslationResult } from './translate'
import { locales } from '@/i18n/routing'

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('mode', {
      alias: 'm',
      describe: '翻译模式',
      choices: ['full', 'keys', 'missing'] as TranslationMode[],
      default: 'full' as TranslationMode
    })
    .option('locales', {
      alias: 'l',
      describe: '目标语言（逗号分隔）',
      type: 'string'
    })
    .option('keys', {
      alias: 'k',
      describe: '要翻译的键（逗号分隔，使用点表示法表示嵌套键）',
      type: 'string'
    })
    .option('force', {
      alias: 'f',
      describe: '强制覆盖现有翻译',
      type: 'boolean',
      default: false
    })
    .option('list-locales', {
      describe: '列出可用的语言',
      type: 'boolean',
      default: false
    })
    .help().argv

  // 如果请求列出语言
  if (argv['list-locales']) {
    console.log('可用语言:')
    locales.forEach((locale) => {
      console.log(`- ${locale.code}: ${locale.name}`)
    })
    return
  }

  // 解析目标语言
  const targetLocales = argv.locales ? argv.locales.split(',').map((l) => l.trim()) : undefined

  // 解析键
  const keys = argv.keys ? argv.keys.split(',').map((k) => k.trim()) : []

  // 验证在'keys'模式下是否提供了键
  if (argv.mode === 'keys' && keys.length === 0) {
    console.error('错误: 使用"keys"模式时必须提供键')
    process.exit(1)
  }

  const options: TranslationOptions = {
    mode: argv.mode as TranslationMode,
    targetLocales,
    keys,
    force: argv.force
  }

  console.log(`开始在${argv.mode}模式下进行翻译...`)
  if (targetLocales) {
    console.log(`目标语言: ${targetLocales.join(', ')}`)
  } else {
    console.log('目标语言: 全部')
  }

  if (argv.mode === 'keys') {
    console.log(`要翻译的键: ${keys.join(', ')}`)
  }

  try {
    const results = await translateMessages(options)

    console.log('\n翻译结果:')
    console.log('====================')

    let successCount = 0
    let failureCount = 0

    for (const result of results) {
      if (result.success) {
        console.log(`✅ ${result.locale}: ${result.message}`)
        if (result.translatedKeys && result.translatedKeys.length > 0) {
          console.log(
            `   键: ${
              result.translatedKeys.length > 5
                ? `${result.translatedKeys.slice(0, 5).join(', ')}... (共${result.translatedKeys.length}个)`
                : result.translatedKeys.join(', ')
            }`
          )
        }
        successCount++
      } else {
        console.log(`❌ ${result.locale}: ${result.error}`)
        failureCount++
      }
    }

    console.log('\n摘要:')
    console.log(`总计: ${results.length}, 成功: ${successCount}, 失败: ${failureCount}`)

    if (failureCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('翻译脚本失败:', error)
    process.exit(1)
  }
}

main()
