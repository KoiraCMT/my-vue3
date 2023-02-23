const tick = /* #__PURE__ */ Promise.resolve()
// 自定义一个任务队列
const queue: any[] = []
// 标志是否正在刷新队列
let queued = false

const flush = () => {
  for (let i = 0; i < queue.length; i++)
    queue[i]()
  // 清空队列任务
  queue.length = 0
  // 表示队列未刷新
  queued = false
}
export const scheduler = (fn: any) => {
  // 如果队列中有相同的任务，则不加入
  if (!queue.includes(fn)) {
    // 任务放入队列
    queue.push(fn)
    // 队列正在刷新，什么都不做
    if (!queued) {
      // 设置队列正在刷新
      queued = true
      // 在微任务中刷新queue队列
      tick.then(flush)
    }
  }
}
