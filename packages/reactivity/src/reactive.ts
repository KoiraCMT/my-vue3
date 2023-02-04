import { mutableHandlers } from './baseHandlers'

// 存储副作用的容器
export const reactiveMap = new WeakMap<object, Map<string, Set<() => any>>>()

export function reactive(target: object) {
  return new Proxy(target, mutableHandlers)
}
