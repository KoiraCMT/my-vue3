import type { Dep } from './dep'
import { createDep } from './dep'
type KeyToDepMap = Map<any, Dep>
// 存储副作用的容器
const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  // 用于存储所有与该副作用函数相关联的依赖集合
  deps: Dep[] = []

  constructor(public fn: () => T) {
  }

  run() {
    // 调用cleanupEffect函数完成清除工作
    cleanupEffect(this)
    activeEffect = this!
    return this.fn()
  }
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++)
      deps[i].delete(effect)

    deps.length = 0
  }
}

// 用于注册副作用函数
export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

export function track(target: object, key: unknown) {
  if (!activeEffect)
    return
  let depsMap = targetMap.get(target)
  if (!depsMap)
    targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key as string)
  if (!dep)
    depsMap.set(key as string, (dep = createDep())) // 修改
  trackEffects(dep)
}

export function trackEffects(dep: Dep) {
  // 将当前激活的副作用函数收集到桶中
  dep.add(activeEffect!)
  // dep就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到activeEffect.deps数组中
  activeEffect!.deps.push(dep)
}

export function trigger(target: object, key: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap)
    return
  // 修改
  const deps = depsMap.get(key as string)
  // 新增
  const effects: ReactiveEffect[] = []
  deps?.forEach((dep) => {
    if (dep)
      effects.push(dep)
  })
  effects.forEach(effect => effect.run())
}
