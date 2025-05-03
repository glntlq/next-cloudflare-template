/**
 * 国际化翻译工具函数
 */
import type { TranslationResult } from './translate'

/**
 * 格式化翻译结果输出
 * @param results 翻译结果数组
 * @returns 格式化后的统计信息 {total, success, failure}
 */
export function formatTranslationResults(results: TranslationResult[]): { 
  total: number; 
  success: number; 
  failure: number 
} {
  console.log('\n翻译结果:')
  console.log('====================')

  let successCount = 0
  let failureCount = 0

  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.locale}: ${result.message}`)
      if (result.translatedKeys && result.translatedKeys.length > 0) {
        console.log(
          `   Keys: ${
            result.translatedKeys.length > 5
              ? `${result.translatedKeys.slice(0, 5).join(', ')}... (${result.translatedKeys.length} total)`
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

  console.log('\n总结:')
  console.log(`总计: ${results.length}, 成功: ${successCount}, 失败: ${failureCount}`)
  
  return {
    total: results.length,
    success: successCount,
    failure: failureCount
  }
}

/**
 * 从对象中提取指定的键
 * @param source 源对象
 * @param keys 要提取的键数组（支持点表示法）
 * @returns 提取后的对象
 */
export function extractKeys(source: Record<string, any>, keys: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const key of keys) {
    const parts = key.split('.')
    let current = source
    let currentResult = result
    
    // 遍历路径
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      
      if (i === parts.length - 1) {
        // 最后一部分，设置值
        if (current && typeof current === 'object' && part in current) {
          currentResult[part] = current[part]
        }
      } else {
        // 中间路径，确保对象存在
        if (!(part in currentResult)) {
          currentResult[part] = {}
        }
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
          currentResult = currentResult[part]
        } else {
          break
        }
      }
    }
  }
  
  return result
}

/**
 * 查找缺失的键
 * @param source 源对象（通常是英文消息）
 * @param target 目标对象（通常是其他语言消息）
 * @returns 缺失键的数组（点表示法）
 */
export function findMissingKeys(
  source: Record<string, any>, 
  target: Record<string, any>, 
  prefix = ''
): string[] {
  const missingKeys: string[] = []
  
  for (const key in source) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    
    if (!(key in target)) {
      // 键完全缺失
      missingKeys.push(currentPath)
    } else if (
      typeof source[key] === 'object' && 
      source[key] !== null && 
      typeof target[key] === 'object' && 
      target[key] !== null
    ) {
      // 递归检查嵌套对象
      const nestedMissing = findMissingKeys(source[key], target[key], currentPath)
      missingKeys.push(...nestedMissing)
    }
  }
  
  return missingKeys
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const output = { ...target }
  
  for (const key in source) {
    if (
      typeof source[key] === 'object' && 
      source[key] !== null && 
      key in output && 
      typeof output[key] === 'object' && 
      output[key] !== null
    ) {
      // 递归合并嵌套对象
      output[key] = deepMerge(output[key], source[key])
    } else {
      // 简单赋值
      output[key] = source[key]
    }
  }
  
  return output
}
