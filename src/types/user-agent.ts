export type UserAgent = {
  type?: string
  vendor?: string
  model?: string
  info?: {
    osName?: string
    osVersion?: string
    appName?: string
    appVersion?: string
  } | string
}