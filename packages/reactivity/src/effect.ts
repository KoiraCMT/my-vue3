// 用一个全局变量存储被注册的副作用函数
export let activeEffect: undefined | (() => any)

// 用于注册副作用函数
export function effect(fn: () => any) {
  // 当调用effect注册副作用函数时，将fn赋值给activeEffect
  activeEffect = fn
  // 执行副作用函数
  fn()
}
