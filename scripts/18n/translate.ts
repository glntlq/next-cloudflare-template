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
  const {
    mode = 'full',
    targetLocales,
    keys = [],
    force = false,
    model = '@cf/meta/llama-4-scout-17b-16e-instruct'
  } = options

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

    if (localesToTranslate.length === 0) {
      return [{ success: false, locale: 'all', error: '没有找到要翻译的目标语言' }]
    }

    // 根据模式确定要翻译的内容
    let sourceToTranslate: any
    let missingKeysByLocale: Record<string, string[]> = {}

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
        // 收集所有语言的缺失键
        for (const locale of localesToTranslate) {
          let existingTranslations = {}
          const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

          try {
            const existingContent = await fs.readFile(localeFilePath, 'utf-8')
            existingTranslations = JSON.parse(existingContent)
          } catch (err) {
            console.log(`未找到 ${locale.code} 的现有翻译，将创建新文件。`)
          }

          const missingKeys = findMissingKeys(englishMessages, existingTranslations)
          if (missingKeys.length > 0) {
            missingKeysByLocale[locale.code] = missingKeys
          }
        }

        // 如果所有语言都没有缺失键，则提前返回
        if (Object.keys(missingKeysByLocale).length === 0) {
          return localesToTranslate.map((locale) => ({
            success: true,
            locale: locale.code,
            message: `${locale.name} 没有发现缺失的键`,
            translatedKeys: []
          }))
        }

        // 使用所有缺失键的并集作为源
        const allMissingKeys = [...new Set(Object.values(missingKeysByLocale).flat())]
        sourceToTranslate = extractKeys(englishMessages, allMissingKeys)
        break
    }

    // 如果没有要翻译的内容，则提前返回
    if (Object.keys(sourceToTranslate).length === 0) {
      return localesToTranslate.map((locale) => ({
        success: true,
        locale: locale.code,
        message: `${locale.name} 没有需要翻译的内容`,
        translatedKeys: []
      }))
    }

    // 准备多语言翻译提示
    const languageList = localesToTranslate.map((l) => `${l.code}: ${l.name}`).join(', ')
    const compactJSON = JSON.stringify(sourceToTranslate) // 移除格式化空白以节省tokens

    console.log(compactJSON, 'compactJSON')

    const prompt = `
    I need to translate a JSON structure from English to multiple languages: ${languageList}.
    
    The JSON structure contains messages for an application. Please translate all text values (not the keys) to each target language.
    
    Rules:
    1. Preserve all placeholders like {name}, {count}, etc.
    2. Maintain the exact same JSON structure for each language
    3. Return a single JSON object with language codes as top-level keys
    
    Source JSON (English):
    ${compactJSON}
    
    Please respond with a JSON object where each top-level key is a language code, and the value is the translated JSON structure:
    {
      "zh": { /* Chinese translation */ },
      "ja": { /* Japanese translation */ },
      ...etc for all requested languages
    }
    
    Return only the JSON without any additional text or explanations.
    `

    // 调用AI模型进行批量翻译
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
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

    const { result }: { result: { response: string } } = await response.json()

    // 提取JSON响应
    const jsonMatch = result.response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('响应中未找到有效的JSON')
    }

    const jsonString = jsonMatch[0]
    const allTranslations = JSON.parse(jsonString)

    // 处理每种语言的翻译结果
    for (const locale of localesToTranslate) {
      try {
        const localeCode = locale.code
        const translatedContent = allTranslations[localeCode]

        if (!translatedContent) {
          results.push({
            success: false,
            locale: localeCode,
            error: `未找到 ${locale.name} 的翻译结果`
          })
          continue
        }

        // 读取现有翻译（如果有）
        let existingTranslations = {}
        const localeFilePath = path.join(messagesDir, `${localeCode}.json`)

        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // 文件不存在，将创建新文件
        }

        // 确定最终内容
        let finalContent: any
        if (mode === 'full' && force) {
          finalContent = translatedContent
        } else {
          finalContent = deepMerge(existingTranslations, translatedContent)
        }

        // 写入文件
        await fs.writeFile(localeFilePath, JSON.stringify(finalContent, null, 2), 'utf-8')

        // 确定哪些键被翻译了
        let translatedKeys: string[]
        if (mode === 'keys') {
          translatedKeys = keys
        } else if (mode === 'missing') {
          translatedKeys = missingKeysByLocale[localeCode] || []
        } else {
          translatedKeys = Object.keys(translatedContent)
        }

        results.push({
          success: true,
          locale: localeCode,
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
