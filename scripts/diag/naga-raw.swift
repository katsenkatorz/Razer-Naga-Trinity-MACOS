// Logs raw input reports from the Naga's keyboard interfaces (mouse motion interface skipped).
import Foundation
import IOKit.hid

let fmt = DateFormatter(); fmt.dateFormat = "HH:mm:ss.SSS"
func log(_ s: String) { print("\(fmt.string(from: Date())) \(s)"); fflush(stdout) }
var firstEvent: Date?
let mgr = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
IOHIDManagerSetDeviceMatching(mgr, [kIOHIDVendorIDKey: 0x1532, kIOHIDProductIDKey: 0x0067] as CFDictionary)
IOHIDManagerRegisterDeviceMatchingCallback(mgr, { _, _, _, dev in
  let usage = IOHIDDeviceGetProperty(dev, kIOHIDPrimaryUsageKey as CFString) as? Int ?? -1
  let loc = IOHIDDeviceGetProperty(dev, kIOHIDLocationIDKey as CFString) as? Int ?? -1
  log("device primary usage \(usage) location \(loc)")
}, nil)
IOHIDManagerRegisterInputReportCallback(mgr, { _, _, sender, _, reportID, report, length in
  guard let sender = sender else { return }
  let dev = Unmanaged<IOHIDDevice>.fromOpaque(sender).takeUnretainedValue()
  let usage = IOHIDDeviceGetProperty(dev, kIOHIDPrimaryUsageKey as CFString) as? Int ?? -1
  if usage == 2 { return } // mouse motion interface
  let bytes = (0..<length).map { String(format: "%02x", report[$0]) }.joined(separator: " ")
  log("iface usage \(usage) report \(reportID) len \(length): \(bytes)")
  if firstEvent == nil { firstEvent = Date() }
}, nil)
IOHIDManagerScheduleWithRunLoop(mgr, CFRunLoopGetCurrent(), CFRunLoopMode.defaultMode.rawValue)
let r = IOHIDManagerOpen(mgr, IOOptionBits(kIOHIDOptionsTypeNone))
log("manager open=\(String(format: "0x%08x", r)) ready")
let start = Date()
Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
  if let f = firstEvent, Date().timeIntervalSince(f) > 40 { log("done"); exit(0) }
  if Date().timeIntervalSince(start) > 1800 { log("timeout"); exit(0) }
}
CFRunLoopRun()
