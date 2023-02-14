import { mutableHandlers } from './baseHandlers'

export function reactive(target: object) {
  return new Proxy(target, mutableHandlers)
}
