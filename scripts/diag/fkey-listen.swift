// Listen-only tap: logs only function keys and system-defined (media/brightness) events.
import AppKit
import CoreGraphics

let names: [Int64: String] = [122: "F1", 120: "F2", 99: "F3", 118: "F4", 96: "F5", 97: "F6", 98: "F7", 100: "F8",
  101: "F9", 109: "F10", 103: "F11", 111: "F12", 105: "F13", 107: "F14", 113: "F15", 106: "F16",
  64: "F17", 79: "F18", 80: "F19", 90: "F20"]
var firstEvent: Date?
var tapRef: CFMachPort?
let fmt = DateFormatter(); fmt.dateFormat = "HH:mm:ss.SSS"

func log(_ s: String) { print("\(fmt.string(from: Date())) \(s)"); fflush(stdout) }

let callback: CGEventTapCallBack = { _, type, event, _ in
  if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
    if let t = tapRef { CGEvent.tapEnable(tap: t, enable: true) }
    return Unmanaged.passUnretained(event)
  }
  if type.rawValue == 14 {
    if let ns = NSEvent(cgEvent: event), ns.subtype.rawValue == 8 {
      let code = (ns.data1 & 0xFFFF0000) >> 16
      let down = ((ns.data1 & 0xFF00) >> 8) == 0x0A
      log("system key \(code) \(down ? "down" : "up")  (2=brightness up, 3=brightness down)")
      if firstEvent == nil { firstEvent = Date() }
    }
  } else {
    let kc = event.getIntegerValueField(.keyboardEventKeycode)
    if let n = names[kc] {
      log("\(n) \(type == .keyDown ? "down" : "up")")
      if firstEvent == nil { firstEvent = Date() }
    }
  }
  return Unmanaged.passUnretained(event)
}

let mask: CGEventMask = (1 << CGEventType.keyDown.rawValue) | (1 << CGEventType.keyUp.rawValue) | (1 << 14)
guard let tap = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .listenOnly,
                                  eventsOfInterest: mask, callback: callback, userInfo: nil) else {
  log("tap creation failed"); exit(1)
}
tapRef = tap
let src = CFMachPortCreateRunLoopSource(nil, tap, 0)
CFRunLoopAddSource(CFRunLoopGetCurrent(), src, .commonModes)
CGEvent.tapEnable(tap: tap, enable: true)
log("ready")
let start = Date()
Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
  if let f = firstEvent, Date().timeIntervalSince(f) > 25 { log("done (25 s after first key)"); exit(0) }
  if Date().timeIntervalSince(start) > 600 { log("timeout"); exit(0) }
}
CFRunLoopRun()
