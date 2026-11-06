// Read-only probe: asks the Naga for each side-button and wheel-tilt binding (Razer "get" = cmd 0x8c).
// Usage: node scripts/diag/read-keymap.cjs [slots, default 0,1,2]   e.g. 0,3
const { findByIds } = require('usb')
const dev = findByIds(0x1532, 0x0067)
if (!dev) { console.log('Naga not found'); process.exit(1) }
dev.open()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const ctrl = (type, req, val, idx, dataOrLen) => new Promise((res, rej) =>
  dev.controlTransfer(type, req, val, idx, dataOrLen, (e, d) => (e ? rej(e) : res(d))))
const report = (cls, cmd, size, args) => {
  const r = Buffer.alloc(90); r[1] = 0x1f; r[5] = size; r[6] = cls; r[7] = cmd
  args.forEach((v, i) => (r[8 + i] = v))
  let crc = 0; for (let i = 2; i < 88; i++) crc ^= r[i]; r[88] = crc; return r
}
const STATUS = { 0: 'new', 1: 'busy', 2: 'ok', 3: 'fail', 4: 'timeout', 5: 'unsupported' }
;(async () => {
  for (const slot of (process.argv[2] || "0,1,2").split(",").map(Number)) {
    const row = []
    // Side buttons 1-12 are sources 0x40-0x4b, wheel tilt left/right are 0x34/0x35.
    const sources = [
      ...Array.from({ length: 12 }, (_, i) => [`${i + 1}`, 0x40 + i]),
      ['tilt-L', 0x34],
      ['tilt-R', 0x35],
    ]
    for (const [name, source] of sources) {
      await ctrl(0x21, 0x09, 0x0300, 0x00, report(0x02, 0x8c, 0x0a, [slot, source]))
      await wait(30)
      const d = await ctrl(0xa1, 0x01, 0x0300, 0x00, 90)
      row.push(`${name}:${STATUS[d[0]] ?? d[0]} [${[...d.subarray(8, 16)].map((x) => x.toString(16).padStart(2, '0')).join(' ')}]`)
    }
    console.log(`slot ${slot}\n  ` + row.join('\n  '))
  }
  dev.close()
})().catch((e) => { console.log('error', e.message); try { dev.close() } catch {} })
