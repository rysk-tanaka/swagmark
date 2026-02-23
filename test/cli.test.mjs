import { describe, test, expect, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, rmSync, readFileSync } from 'node:fs'

const CLI_TMP = 'test/tmp-cli'

afterAll(() => {
  if (existsSync(CLI_TMP)) {
    rmSync(CLI_TMP, { recursive: true, force: true })
  }
})

describe('CLIオプション', () => {
  test('-V でバージョンがpackage.jsonと一致する', () => {
    const version = JSON.parse(readFileSync('package.json', 'utf-8')).version
    const output = execSync('node bin/cli.js -V', { stdio: 'pipe' }).toString().trim()
    expect(output).toContain(version)
  })

  test('-o オプションで出力ディレクトリが指定できる', () => {
    const outDir = `${CLI_TMP}/output`
    execSync(`node bin/cli.js test/fixtures/valid.yaml -o ${outDir}`, { stdio: 'pipe' })
    expect(existsSync(outDir)).toBe(true)
  })

  test('inputファイル未指定時に非ゼロで終了する', () => {
    expect(() => execSync('node bin/cli.js', { stdio: 'pipe' })).toThrow()
  })
})
