/**
 * 国际化翻译核心功能
 * 使用AI模型自动翻译消息文件
 */
import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'

import { locales } from '@/i18n/routing'
import { extractKeys, findMissingKeys, deepMerge } from './utils'

/**
 * 翻译模式
 * - full: 完整翻译所有键
 * - missing: 仅翻译缺失的键
 * - keys: 仅翻译指定的键
 */
export type TranslationMode = 'full' | 'missing' | 'keys'

/**
 * 翻译选项
 */
export type TranslationOptions = {
  /** 翻译模式 */
  mode: TranslationMode
  /** 目标语言代码（如果未提供，则翻译所有语言） */
  targetLocales?: string[]
  /** 要翻译的键（仅在'keys'模式下使用） */
  keys?: string[]
  /** 使用的AI模型 */
  model?: string
  /** 是否强制覆盖现有翻译 */
  force?: boolean
}

/**
 * 翻译结果
 */
export type TranslationResult = {
  /** 翻译是否成功 */
  success: boolean
  /** 语言代码 */
  locale: string
  /** 成功消息 */
  message?: string
  /** 已翻译的键 */
  translatedKeys?: string[]
  /** 错误信息 */
  error?: string
}

/**
 * 翻译消息文件
 * @param options 翻译选项
 * @returns 翻译结果数组
 */
export async function translateMessages(options: TranslationOptions): Promise<TranslationResult[]> {
  const { mode = 'full', targetLocales, keys = [], force = false } = options

  const results: TranslationResult[] = []

  try {
    // 读取英文消息文件作为源
    const messagesDir = path.join(process.cwd(), 'messages')
    const englishMessagesPath = path.join(messagesDir, 'en.json')
    const englishMessagesText = await fs.readFile(englishMessagesPath, 'utf-8')
    const englishMessages = JSON.parse(englishMessagesText)

    // 确定要翻译的语言
    const localesToTranslate = targetLocales
      ? locales.filter((l) => targetLocales.includes(l.code) && l.code !== 'en')
      : locales.filter((l) => l.code !== 'en')

    // 处理每种语言
    for (const locale of localesToTranslate) {
      try {
        console.log(`处理 ${locale.name} (${locale.code})...`)

        let sourceToTranslate: any
        let existingTranslations: any = {}
        let missingKeys: string[] = []
        const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

        // 检查语言文件是否已存在
        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // 文件不存在或无法解析，将创建新文件
          console.log(`未找到 ${locale.code} 的现有翻译，将创建新文件。`)
        }

        // 根据模式确定要翻译的内容
        switch (mode) {
          case 'full':
            sourceToTranslate = englishMessages
            break

          case 'keys':
            if (keys.length === 0) {
              throw new Error('Keys模式需要至少一个要翻译的键')
            }
            sourceToTranslate = extractKeys(englishMessages, keys)
            break

          case 'missing':
            missingKeys = findMissingKeys(englishMessages, existingTranslations)
            if (missingKeys.length === 0) {
              results.push({
                success: true,
                locale: locale.code,
                message: `${locale.name} 没有发现缺失的键`,
                translatedKeys: []
              })
              continue // 跳到下一个语言
            }
            sourceToTranslate = extractKeys(englishMessages, missingKeys)
            break
        }

        // 如果没有要翻译的内容，则跳过
        if (Object.keys(sourceToTranslate).length === 0) {
          results.push({
            success: true,
            locale: locale.code,
            message: `${locale.name} 没有需要翻译的内容`,
            translatedKeys: []
          })
          continue
        }

        // 准备翻译提示
        const prompt = `
        I need to translate a JSON structure from English to ${locale.name}.
        
        Let me approach this step by step:
        
        1. First, I'll carefully read and understand the entire JSON structure.
        2. I'll identify all the text values that need translation, leaving the keys unchanged.
        3. For each value, I'll translate it from English to ${locale.name} while preserving:
           - Any placeholders like {name}, {count}, etc.
           - Any formatting or special characters
           - The original meaning and context
        4. I'll maintain the exact same JSON structure and nesting
        5. I'll verify that my output is valid JSON with properly escaped characters
        
        Here's the JSON to translate:
        ${JSON.stringify(sourceToTranslate, null, 2)}
        
        I'll respond with only the translated JSON, without any additional text, explanations, or formatting.
        `

        // 调用AI模型进行翻译
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt,
              stream: false,
              max_tokens: 4000
            })
          }
        )

        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
        }

        const {
          result
        }: {
          result: {
            response: string
          }
        } = await response.json()

        console.log(result)

        const jsonMatch = result.response?.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('响应中未找到有效的JSON')
        }

        const jsonString = jsonMatch[0]
        const translatedContent = JSON.parse(jsonString)

        // 与现有翻译合并或使用新翻译
        let finalContent: any

        if (mode === 'full' && force) {
          // 完全替换
          finalContent = translatedContent
        } else {
          // 与现有内容合并
          finalContent = deepMerge(existingTranslations, translatedContent)
        }

        // 将翻译后的消息写入文件
        await fs.writeFile(localeFilePath, JSON.stringify(finalContent, null, 2), 'utf-8')

        // 确定哪些键被翻译了
        const translatedKeys =
          mode === 'keys' ? keys : mode === 'missing' ? missingKeys : Object.keys(translatedContent)

        results.push({
          success: true,
          locale: locale.code,
          message: `成功将 ${translatedKeys.length} 个键翻译为 ${locale.name}`,
          translatedKeys
        })
      } catch (error) {
        console.error(`处理 ${locale.code} 时出错:`, error)
        results.push({
          success: false,
          locale: locale.code,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  } catch (error) {
    console.error('翻译过程失败:', error)
    return [
      {
        success: false,
        locale: 'all',
        error: error instanceof Error ? error.message : String(error)
      }
    ]
  }
}
