<template>
  <view class="page">
    <view class="toolbar">
      <view class="diff">
        <text class="lab">难度</text>
        <picker mode="selector" :range="diffLabels" :value="diffIndex" @change="onDiffChange">
          <view class="picker">{{ diffLabels[diffIndex] }}</view>
        </picker>
      </view>
      <button class="btn" size="mini" @tap="newGame">新局</button>
      <button class="btn" size="mini" @tap="hint">提示</button>
      <button class="btn" size="mini" @tap="checkAns">检查</button>
    </view>
    <text class="msg">{{ msg }}</text>
    <view class="board" :style="boardStyle">
      <view v-for="(row, r) in display" :key="'r' + r" class="row">
        <view
          v-for="(v, c) in row"
          :key="'c' + c"
          class="cell"
          :class="cellClass(r, c)"
          @tap="onCell(r, c)"
        >
          <text v-if="v > 0" class="num">{{ v }}</text>
        </view>
      </view>
    </view>
    <view class="pad">
      <view class="nums">
        <view v-for="n in 9" :key="n" class="nbtn" @tap="inputNum(n)">{{ n }}</view>
      </view>
      <button class="clear" @tap="inputNum(0)">清除</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const N = 9
const msg = ref('')
const boardPx = ref(300)
const grid = ref(emptyBoard())
const fixed = ref(emptyBoard())
const wrong = ref(emptyBoard())
const conflict = ref(emptyBoard())
const sel = ref(null)
const solution = ref([])
const diffIndex = ref(1)
const diffLabels = ['简单', '中等', '困难']
const diffHoles = [30, 40, 48]

const display = computed(() => grid.value)

const boardStyle = computed(() => ({
  width: boardPx.value + 'px',
  height: boardPx.value + 'px',
}))

function emptyBoard() {
  return Array.from({ length: N }, () => Array(N).fill(0))
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function valid(board, r, c, n) {
  for (let i = 0; i < N; i++) {
    if (board[r][i] === n || board[i][c] === n) return false
  }
  const br = (r / 3) | 0
  const bc = (c / 3) | 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[br * 3 + i][bc * 3 + j] === n) return false
    }
  }
  return true
}

function solve(board) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const n of nums) {
          if (valid(board, r, c, n)) {
            board[r][c] = n
            if (solve(board)) return true
            board[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function copyBoard(b) {
  return b.map((row) => row.slice())
}

function generate() {
  const b = emptyBoard()
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      b[i * 3 + j][i * 3 + j] = nums[i * 3 + j]
    }
  }
  solve(b)
  return b
}

function countSolutions(board, limit) {
  const b = copyBoard(board)
  let cnt = 0
  function dfs() {
    if (cnt >= limit) return
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= N; n++) {
            if (valid(b, r, c, n)) {
              b[r][c] = n
              dfs()
              b[r][c] = 0
              if (cnt >= limit) return
            }
          }
          return
        }
      }
    }
    cnt++
  }
  dfs()
  return cnt
}

function makePuzzleUnique(full, targetEmpty) {
  const p = copyBoard(full)
  const pos = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) pos.push([r, c])
  }
  shuffle(pos)
  let empty = 0
  for (const [r, c] of pos) {
    if (empty >= targetEmpty) break
    const t = p[r][c]
    p[r][c] = 0
    if (countSolutions(p, 2) === 1) empty++
    else p[r][c] = t
  }
  return p
}

function cellConflict(g, r, c) {
  const v = g[r][c]
  if (v === 0) return false
  for (let i = 0; i < N; i++) {
    if (i !== c && g[r][i] === v) return true
    if (i !== r && g[i][c] === v) return true
  }
  const br = ((r / 3) | 0) * 3
  const bc = ((c / 3) | 0) * 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = br + i
      const cc = bc + j
      if ((rr !== r || cc !== c) && g[rr][cc] === v) return true
    }
  }
  return false
}

function refreshConflict() {
  const g = grid.value
  const cf = emptyBoard()
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (g[r][c] > 0 && cellConflict(g, r, c)) cf[r][c] = 1
    }
  }
  conflict.value = cf
}

function cellClass(r, c) {
  const alt = ((r / 3) | 0) + ((c / 3) | 0)
  return {
    thickT: r % 3 === 0,
    thickL: c % 3 === 0,
    thickB: r === 8,
    thickR: c === 8,
    fixed: fixed.value[r][c],
    sel: sel.value && sel.value[0] === r && sel.value[1] === c,
    bad: wrong.value[r][c],
    clash: conflict.value[r][c],
    altBg: alt % 2 === 1,
  }
}

function newGame() {
  msg.value = ''
  sel.value = null
  wrong.value = emptyBoard()
  conflict.value = emptyBoard()
  const holes = diffHoles[diffIndex.value] ?? 42
  const full = generate()
  const puzzle = makePuzzleUnique(full, holes)
  solution.value = copyBoard(full)
  grid.value = puzzle
  fixed.value = puzzle.map((row) => row.map((v) => v > 0))
  refreshConflict()
}

function onDiffChange(e) {
  diffIndex.value = Number(e.detail.value)
  newGame()
}

function onCell(r, c) {
  if (fixed.value[r][c]) return
  sel.value = [r, c]
  wrong.value[r][c] = false
}

function isComplete() {
  const g = grid.value
  const sol = solution.value
  if (!sol.length) return false
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (g[r][c] !== sol[r][c]) return false
    }
  }
  return true
}

function inputNum(n) {
  if (!sel.value) {
    msg.value = '先点空格'
    return
  }
  const [r, c] = sel.value
  if (fixed.value[r][c]) return
  const g = copyBoard(grid.value)
  g[r][c] = n
  grid.value = g
  wrong.value[r][c] = false
  msg.value = ''
  refreshConflict()
  if (isComplete()) {
    msg.value = '完成'
  }
}

function hint() {
  const empties = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!fixed.value[r][c] && grid.value[r][c] === 0) empties.push([r, c])
    }
  }
  if (empties.length === 0) {
    msg.value = '没有可提示格'
    return
  }
  const pick = empties[(Math.random() * empties.length) | 0]
  const [r, c] = pick
  const g = copyBoard(grid.value)
  g[r][c] = solution.value[r][c]
  grid.value = g
  sel.value = [r, c]
  wrong.value[r][c] = false
  refreshConflict()
  msg.value = '已填一格'
  if (isComplete()) msg.value = '完成'
}

function checkAns() {
  let ok = true
  const w = emptyBoard()
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = grid.value[r][c]
      if (v === 0) {
        ok = false
        continue
      }
      if (v !== solution.value[r][c]) {
        w[r][c] = true
        ok = false
      }
    }
  }
  wrong.value = w
  msg.value = ok ? '完成' : '有错误或未填完'
}

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  const w = sys.windowWidth || 375
  boardPx.value = Math.min(w - 32, 340)
  newGame()
})
</script>

<style scoped>
.page {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.toolbar {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12rpx;
}
.diff {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 16rpx;
  margin-bottom: 8rpx;
}
.lab {
  font-size: 26rpx;
  color: #444;
  margin-right: 8rpx;
}
.picker {
  font-size: 26rpx;
  color: #2563eb;
  padding: 4rpx 12rpx;
  border: 1px solid #ddd;
  border-radius: 8rpx;
}
.btn {
  margin-right: 12rpx;
  margin-bottom: 8rpx;
}
.msg {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  align-self: flex-start;
}
.board {
  align-self: center;
  display: flex;
  flex-direction: column;
  border: 3px solid #222;
  background: #fff;
  box-sizing: border-box;
}
.row {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
}
.cell {
  flex: 1;
  min-width: 0;
  border-left-width: 1px;
  border-top-width: 1px;
  border-color: #bbb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.altBg {
  background: #f3f4f6;
}
.thickT {
  border-top-width: 3px;
  border-top-color: #222;
}
.thickL {
  border-left-width: 3px;
  border-left-color: #222;
}
.thickB {
  border-bottom-width: 3px;
  border-bottom-color: #222;
}
.thickR {
  border-right-width: 3px;
  border-right-color: #222;
}
.fixed .num {
  color: #111;
  font-weight: 700;
}
.num {
  font-size: 26rpx;
  color: #1d4ed8;
}
.sel {
  background: #bfdbfe;
}
.bad {
  background: #fecaca;
}
.clash {
  background: #fde68a;
}
.pad {
  margin-top: 24rpx;
  width: 100%;
}
.nums {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}
.nbtn {
  width: 64rpx;
  height: 64rpx;
  margin: 8rpx;
  background: #f3f4f6;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.clear {
  margin-top: 16rpx;
  font-size: 28rpx;
}
</style>
