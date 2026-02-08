import { Dashboard } from "@/components/dashboard"
import { ErrorBoundary } from "@/components/error-boundary"
import { MobileWarning } from "@/components/mobile-warning"
import { KeyboardHints } from "@/components/keyboard-hints"

export default function Page() {
  return (
    <ErrorBoundary>
      <MobileWarning />
      <KeyboardHints />
      <Dashboard />
    </ErrorBoundary>
  )
}
