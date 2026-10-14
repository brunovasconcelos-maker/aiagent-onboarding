// The onboarding keeps its state in memory only. Earlier versions saved it in the browser
// storage; this removes whatever they left behind (the two keys they used, plus anything
// else under the same prefix), in both sessionStorage and localStorage.
const LEGACY_KEYS = ['aiagent-onboarding:agent', 'aiagent-onboarding:answers']
const PREFIX = 'aiagent-onboarding'

export function clearLegacyStorage() {
  for (const name of ['sessionStorage', 'localStorage']) {
    try {
      const storage = window[name]
      LEGACY_KEYS.forEach((key) => storage.removeItem(key))
      Object.keys(storage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => storage.removeItem(key))
    } catch {
      // storage can be unavailable (private mode, blocked storage)
    }
  }
}
