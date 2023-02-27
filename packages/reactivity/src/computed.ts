import { ReactiveEffect, track, trigger } from './effect'

export type ComputedGetter<T> = (...args: any[]) => T

export interface ComputedRef<T = any> {
  readonly value: T
}
export class ComputedRefImpl<T> {
  private readonly effect: ReactiveEffect
  // value缓存上一次计算的值
  private _value!: T

  // dirty标志，用来标识是否需要重新计算值，为true则意味着"脏"，需要计算
  public _dirty = true

  constructor(
    getter: ComputedGetter<T>,
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        // 当计算属性依赖的响应式数据发生变化时， 手动调用trigger函数触发响应
        trigger(this, 'value')
      }
    })
  }

  get value() {
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    // 当读取value时，手动调用track函数进行追踪
    track(this, 'value')
    return this._value
  }
}
export function computed<T>(
  getter: ComputedGetter<T>,
): ComputedRef<T> {
  const cRef = new ComputedRefImpl(getter)

  return cRef as any
}
