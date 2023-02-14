import { activeEffect, targetSet } from './effect'

const get = createGetter()
const set = createSetter()
function createGetter() {
  return function get(target: Record<string, any>, key: string) {
    // 将activeEffect中存储的副作用函数收集到桶中
    if (activeEffect)
      targetSet.add(activeEffect)
    return target[key]
  }
}
function createSetter() {
  return function set(target: Record<string, any>, key: string, newValue: unknown) {
    target[key] = newValue
    targetSet.forEach(fn => fn())
    return true
  }
}
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}
