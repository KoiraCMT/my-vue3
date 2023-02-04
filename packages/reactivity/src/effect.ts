// 用一个全局变量存储被注册的副作用函数
import { reactiveMap } from './reactive'

export let activeEffect: undefined | (() => any)

// 用于注册副作用函数
export function effect(fn: () => any) {
  // 当调用effect注册副作用函数时，将fn赋值给activeEffect
  activeEffect = fn
  // 执行副作用函数
  fn()
}

export function track(target: object, key: unknown) {
  if (!activeEffect)
    return
  // 根据target从桶中获取depsMap, 它也是一个Map类型：key -> effects
  let depsMap = reactiveMap.get(target)
  // 如果不存在depsMap，则新建一个Map与target关联
  if (!depsMap)
    reactiveMap.set(target, (depsMap = new Map()))
  // 再根据key从depsMap中取得deps，它是一个Set类型
  // 用于存储当前key关联的副作用函数effects
  let deps = depsMap.get(key as string)
  // 如果不存在就新建一个Set与key关联
  if (!deps)
    depsMap.set(key as string, (deps = new Set()))
  // 将当前激活的副作用函数收集到桶中
  deps.add(activeEffect)
}

export function trigger(target: object, key: unknown) {
  // 根据target从桶中获取depsMap
  const depsMap = reactiveMap.get(target)
  if (!depsMap)
    return
  // 根据key获取所有的副作用函数
  const effects = depsMap.get(key as string)
  // 执行副作用函数
  effects && effects.forEach(fn => fn())
}
