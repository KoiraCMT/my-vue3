import type { Dep } from './dep'
import { createDep } from './dep'
type KeyToDepMap = Map<any, Dep>
// 存储副作用的容器
const targetMap = new WeakMap<any, KeyToDepMap>()

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  // 用于存储所有与该副作用函数相关联的依赖集合
  deps: Dep[] = []

  // 将外层的副作用函数存储，如果是第一层，则为undefined
  parent: ReactiveEffect | undefined = undefined

  constructor(public fn: () => T) {}

  run() {
    try {
      // 将外层副作用函数存储到parent属性中，相当于压栈操作
      this.parent = activeEffect
      // 将副作用函数赋值给activeEffect, 相当于将当前副作用函数放到栈顶
      activeEffect = this!

      cleanupEffect(this)

      return this.fn()
    }
    finally {
      // 副作用函数执行完毕后，将外层副作用函数赋值给activeEffect，相当于将当前副作用函数弹出栈并修改栈顶
      activeEffect = this.parent
      // 弹出后断绝与外层副作用函数的关联
      this.parent = undefined
    }
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
