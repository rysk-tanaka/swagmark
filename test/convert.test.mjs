import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { convert } from '../src/convert.mjs'
import { readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TMP_DIR = 'test/tmp'

/** convert を実行して出力 Markdown 文字列を返すヘルパー */
async function convertAndRead(fixture, subDir = '') {
  const outDir = subDir ? join(TMP_DIR, subDir) : TMP_DIR
  const name = fixture.replace(/\.yaml$/, '')
  await convert(`test/fixtures/${fixture}`, { output: outDir, index: false })
  return readFileSync(join(outDir, `${name}.md`), 'utf-8')
}

let validMd

beforeAll(async () => {
  validMd = await convertAndRead('valid.yaml')
})

afterAll(() => {
  if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// P1: HTTPメソッドバッジ
// ---------------------------------------------------------------------------

describe('HTTPメソッドバッジ', () => {
  test('GETエンドポイントに青バッジURLが含まれる', () => {
    expect(validMd).toContain('https://badgers.space/badge/_/GET/blue')
  })

  test('POSTエンドポイントに緑バッジURLが含まれる', () => {
    expect(validMd).toContain('https://badgers.space/badge/_/POST/green')
  })

  test('PUTエンドポイントにオレンジバッジURLが含まれる', () => {
    expect(validMd).toContain('https://badgers.space/badge/_/PUT/orange')
  })

  test('DELETEエンドポイントに赤バッジURLが含まれる', () => {
    expect(validMd).toContain('https://badgers.space/badge/_/DELETE/red')
  })

  test('PATCHエンドポイントに紫バッジURLが含まれる', () => {
    expect(validMd).toContain('https://badgers.space/badge/_/PATCH/purple')
  })

  test('バッジにaltテキスト（絵文字+メソッド名）が含まれる', () => {
    expect(validMd).toContain('![🔵 GET]')
    expect(validMd).toContain('![🟢 POST]')
    expect(validMd).toContain('![🟠 PUT]')
    expect(validMd).toContain('![🔴 DELETE]')
    expect(validMd).toContain('![🟣 PATCH]')
  })
})

// ---------------------------------------------------------------------------
// P1: <details>/<summary> 構造
// ---------------------------------------------------------------------------

describe('<details>/<summary> 構造', () => {
  test('各エンドポイントが<details>タグで囲まれる', () => {
    const openCount = (validMd.match(/<details>/g) || []).length
    const closeCount = (validMd.match(/<\/details>/g) || []).length
    expect(openCount).toBeGreaterThan(0)
    expect(closeCount).toBe(openCount)
  })

  test('<summary>内にメソッドバッジとパスが含まれる', () => {
    expect(validMd).toMatch(/<summary>[\s\S]*?badgers\.space[\s\S]*?<\/summary>/)
  })

  test('<details>の直後に<summary>が続く', () => {
    expect(validMd).toMatch(/<details>\n<summary>/)
  })
})

// ---------------------------------------------------------------------------
// P1: curlサンプル生成
// ---------------------------------------------------------------------------

describe('curlサンプル生成', () => {
  test('GETリクエストに-dオプションが含まれない', () => {
    const getSection = validMd.match(/GET[\s\S]*?```shell([\s\S]*?)```/)
    expect(getSection?.[1]).not.toContain(" -d '")
  })

  test('POSTリクエストにリクエストボディ(-d)が含まれる', () => {
    const postSection = validMd.match(/POST[\s\S]*?```shell([\s\S]*?)```/)
    expect(postSection?.[1]).toContain(" -d '")
  })

  test('不要なwgetコメント行が出力に含まれない', () => {
    expect(validMd).not.toContain('# You can also use wget')
  })
})

// ---------------------------------------------------------------------------
// P1: GFMテーブル
// ---------------------------------------------------------------------------

describe('GFMテーブル', () => {
  test('パラメータテーブルが正しいカラム構造で生成される', () => {
    expect(validMd).toContain('|Name|In|Type|Required|Description|')
  })

  test('レスポンステーブルにステータスコードが含まれる', () => {
    expect(validMd).toContain('|Status|Meaning|Description|Schema|')
    expect(validMd).toMatch(/\|2\d\d\|/)
  })
})

// ---------------------------------------------------------------------------
// P2: YAML読み込みとエラーハンドリング
// ---------------------------------------------------------------------------

describe('YAML読み込み', () => {
  test('有効なOpenAPI 3.0 YAMLをパースできる', async () => {
    await expect(
      convert('test/fixtures/valid.yaml', { output: join(TMP_DIR, 'valid-ok'), index: false }),
    ).resolves.toBeUndefined()
  })

  test('存在しないファイルパスでエラーをthrowする', async () => {
    await expect(
      convert('nonexistent.yaml', { output: join(TMP_DIR, 'nonexistent') }),
    ).rejects.toThrow()
  })

  test('不正なYAMLでエラーをthrowする', async () => {
    await expect(
      convert('test/fixtures/invalid.yaml', { output: join(TMP_DIR, 'invalid') }),
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// スナップショット
// ---------------------------------------------------------------------------

describe('スナップショット', () => {
  test('サンプルOpenAPIからの出力がスナップショットと一致する', () => {
    expect(validMd).toMatchSnapshot()
  })
})
