import { extend } from '@my-vue3/shared'
import type { Dep } from './dep'
import { createDep } from './dep'
type KeyToDepMap = Map<any, Dep>
// 存储副作用的容器
const targetMap = new WeakMap<any, KeyToDepMap>()

export type EffectScheduler = (...args: any[]) => any

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  // 用于存储所有与该副作用函数相关联的依赖集合
  deps: Dep[] = []

  // 将外层的副作用函数存储，如果是第一层，则为undefined
  parent: ReactiveEffect | undefined = undefined

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
  ) {}

  run() {
    // 默认activeEffect，用于判断是否引发了无限递归循环
    let parent: ReactiveEffect | undefined = activeEffect
    while (parent) {
      // 如果当前执行的副作用函数更底层的副作用函数与当前执行的函数相同，则不执行，从而打断无限递归循环
      if (parent === this)
        return
      // 结合effect栈，追溯当前执行的副作用函数更底层的副作用函数
      parent = parent.parent
    }
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

export interface ReactiveEffectOptions {
  scheduler?: EffectScheduler
  lazy?: boolean
}

// 用于注册副作用函数
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  if (options)
    extend(_effect, options)
  if (!options || !options.lazy)
    _effect.run()

  return _effect.run.bind(_effect)
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
  effects.forEach(effect => triggerEffect(effect))
}

export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler)
    effect.scheduler()
  else
    effect.run()
}
