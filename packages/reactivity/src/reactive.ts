import { mutableHandlers } from './baseHandlers'

// 存储副作用的容器
export const reactiveSet = new Set<() => any>()

export function reactive(target: object) {
  return new Proxy(target, mutableHandlers)
}
