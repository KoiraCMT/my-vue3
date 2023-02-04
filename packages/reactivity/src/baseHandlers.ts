import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
function createGetter() {
  return function get(target: Record<string, any>, key: string) {
    track(target, key)
    return target[key]
  }
}
function createSetter() {
  return function set(target: Record<string, any>, key: string, newValue: unknown) {
    target[key] = newValue
    trigger(target, key)
    return true
  }
}
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}
