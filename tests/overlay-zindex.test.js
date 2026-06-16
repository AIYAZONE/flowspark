const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('AlertDialog 应该位于 Dialog 之上（z-index 更高）', () => {
  const dialogSource = fs.readFileSync(path.join(__dirname, '../src/components/ui/dialog.tsx'), 'utf8')
  const alertDialogSource = fs.readFileSync(
    path.join(__dirname, '../src/components/ui/alert-dialog.tsx'),
    'utf8'
  )

  assert.match(dialogSource, /\bz-10000\b/)
  assert.match(alertDialogSource, /\bz-10001\b/)
  assert.match(alertDialogSource, /\bz-10002\b/)
})
