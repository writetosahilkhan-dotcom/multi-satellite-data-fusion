import { Dashboard } from "@/components/dashboard"
import { MobileWarning } from "@/components/mobile-warning"
import { KeyboardHints } from "@/components/keyboard-hints"

export default function Page() {
  return (
    <>
      <MobileWarning />
      <KeyboardHints />
      <Dashboard />
    </>
  )
}
