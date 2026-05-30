/** Injected at build time via vite `define` (see vite.config.js). */
export const commitCount =
  typeof __BUILD_COMMIT_COUNT__ !== 'undefined' ? __BUILD_COMMIT_COUNT__ : 'dev'

export const deployedAt =
  typeof __BUILD_DEPLOYED_AT__ !== 'undefined' ? __BUILD_DEPLOYED_AT__ : null

/** `production` (default), `staging`, or unset for local dev. */
export const deployEnv = import.meta.env.VITE_DEPLOY_ENV || ''

export function formatBuildLabel() {
  const count = commitCount
  if (!deployedAt) {
    return deployEnv ? `v${count} · local · ${deployEnv}` : `v${count} · local`
  }
  const when = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(deployedAt))
  const envSuffix = deployEnv && deployEnv !== 'production' ? ` · ${deployEnv}` : ''
  return `v${count} · ${when}${envSuffix}`
}
