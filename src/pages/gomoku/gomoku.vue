<template>
  <view class="page">
    <view v-if="phase === 'menu'" class="menu">
      <text class="menu-title">选择关卡</text>
      <text class="menu-tip">执黑先行，战胜电脑解锁下一关</text>
      <view class="level-grid">
        <view
          v-for="lv in totalLevels"
          :key="lv"
          class="level-item"
          :class="{ locked: lv > maxUnlocked, hot: lv === maxUnlocked }"
          @tap="startLevel(lv)"
        >
          <text class="lv-num">{{ lv }}</text>
          <text v-if="lv > maxUnlocked" class="lv-lock">锁</text>
        </view>
      </view>
    </view>
    <view v-else class="game">
      <view class="bar">
        <text class="back" @tap="toMenu">← 选关</text>
        <text class="lv-tag">第 {{ currentLevel }} 关</text>
      </view>
      <view class="status">{{ statusText }}</view>
      <view class="wrap">
        <view
          class="board"
          :style="{ width: boardPx + 'px', height: boardPx + 'px' }"
        >
          <view
            class="grid-lines"
            :style="{ backgroundSize: gapPx + 'px ' + gapPx + 'px' }"
          />
          <view
            v-for="i in pointIdx"
            :key="'p' + i"
            class="cross"
            :style="pointStyle(i)"
            @tap.stop="onPointTap(i)"
          >
            <view v-if="cellAt(i) === 1" class="stone b" :style="stoneStyle" />
            <view v-else-if="cellAt(i) === 2" class="stone w" :style="stoneStyle" />
          </view>
        </view>
      </view>
      <button class="again" @tap="restartRound">重来</button>
      <view
        v-if="over && winner === 1"
        class="win-mask"
        @touchmove.stop.prevent="preventMove"
        @tap.stop
      >
        <view class="win-box" @tap.stop>
          <text class="win-title">恭喜获胜</text>
          <text class="win-desc">已通过第 {{ currentLevel }} 关</text>
          <button v-if="currentLevel < totalLevels" class="win-btn" @tap="goNextLevel">
            下一关
          </button>
          <button v-else class="win-btn" @tap="toMenu">返回选关</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'gomoku_unlock_v1'
const totalLevels = 50
const size = 15
const pointIdx = Array.from({ length: size * size }, (_, i) => i)

const phase = ref('menu')
const currentLevel = ref(1)
const maxUnlocked = ref(1)
const cells = ref(Array.from({ length: size }, () => Array(size).fill(0)))
const turn = ref(1)
const over = ref(false)
const winner = ref(0)
const thinking = ref(false)
const boardPx = ref(448)

const gapPx = computed(() => boardPx.value / (size - 1))
const tapPx = computed(() => Math.max(28, Math.min(44, gapPx.value * 0.92)))
const stoneStyle = computed(() => {
  const d = Math.max(10, Math.floor(gapPx.value * 0.78))
  return { width: d + 'px', height: d + 'px' }
})

const statusText = computed(() => {
  if (thinking.value) return '电脑思考中…'
  if (over.value) {
    if (winner.value === 1) return '你胜！'
    if (winner.value === 2) return '电脑胜'
    return '平局'
  }
  return turn.value === 1 ? '你下（黑）' : '电脑下（白）'
})

function cellAt(i) {
  const r = (i / size) | 0
  const c = i % size
  const row = cells.value[r]
  return row ? row[c] : 0
}

function pointStyle(i) {
  const r = (i / size) | 0
  const c = i % size
  const g = gapPx.value
  const w = tapPx.value
  return {
    position: 'absolute',
    left: c * g - w / 2 + 'px',
    top: r * g - w / 2 + 'px',
    width: w + 'px',
    height: w + 'px',
    zIndex: 2,
  }
}

function cloneBoard(b) {
  return b.map((row) => row.slice())
}

function isFull(b) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (b[r][c] === 0) return false
    }
  }
  return true
}

function countDirBoard(b, r, c, dr, dc, who) {
  let n = 0
  let rr = r + dr
  let cc = c + dc
  while (rr >= 0 && rr < size && cc >= 0 && cc < size && b[rr][cc] === who) {
    n++
    rr += dr
    cc += dc
  }
  return n
}

function winBoard(b, r, c, who) {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]
  for (const [dr, dc] of dirs) {
    const t = 1 + countDirBoard(b, r, c, dr, dc, who) + countDirBoard(b, r, c, -dr, -dc, who)
    if (t >= 5) return true
  }
  return false
}

function getCandidates(b) {
  const set = new Map()
  let any = false
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (b[r][c] === 0) continue
      any = true
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && b[nr][nc] === 0) {
            set.set(nr * size + nc, [nr, nc])
          }
        }
      }
    }
  }
  if (!any) return [[7, 7]]
  return Array.from(set.values())
}

function linePower(b, r, c, dr, dc, who) {
  let n = 1
  let rr = r + dr
  let cc = c + dc
  while (rr >= 0 && rr < size && cc >= 0 && cc < size && b[rr][cc] === who) {
    n++
    rr += dr
    cc += dc
  }
  const end1 = rr >= 0 && rr < size && cc >= 0 && cc < size ? b[rr][cc] : -1
  rr = r - dr
  cc = c - dc
  while (rr >= 0 && rr < size && cc >= 0 && cc < size && b[rr][cc] === who) {
    n++
    rr -= dr
    cc -= dc
  }
  const end2 = rr >= 0 && rr < size && cc >= 0 && cc < size ? b[rr][cc] : -1
  const open = (end1 === 0 ? 1 : 0) + (end2 === 0 ? 1 : 0)
  if (n >= 5) return 1e6
  if (n === 4) return open >= 1 ? 5e4 : 8e3
  if (n === 3) return open >= 2 ? 4e3 : open === 1 ? 900 : 120
  if (n === 2) return open >= 2 ? 180 : 35
  return open * 4
}

function moveHeuristic(b, r, c, who) {
  const t = b[r][c]
  b[r][c] = who
  let s = 0
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]
  for (const [dr, dc] of dirs) {
    s += linePower(b, r, c, dr, dc, who)
  }
  b[r][c] = t
  return s
}

function pickRandom(cands) {
  return cands[((Math.random() * cands.length) | 0)]
}

function greedyBest(b, cands, level) {
  const atkM = 1 + (level - 1) * 0.06
  const defM = 0.78 + (level - 1) * 0.045
  const noise = Math.max(0, 4200 - level * 420)
  let best = -Infinity
  const picks = []
  for (const [r, c] of cands) {
    if (b[r][c] !== 0) continue
    const atk = moveHeuristic(b, r, c, 2) * atkM
    const def = moveHeuristic(b, r, c, 1) * defM
    let sc = atk + def
    if (noise > 0) sc += (Math.random() - 0.5) * noise * (0.12 + (11 - level) * 0.04)
    if (sc > best) {
      best = sc
      picks.length = 0
      picks.push([r, c])
    } else if (sc === best) {
      picks.push([r, c])
    }
  }
  return pickRandom(picks.length ? picks : cands)
}

function evaluateState(b) {
  let w = 0
  const cs = getCandidates(b)
  for (const [r, c] of cs) {
    if (b[r][c] !== 0) continue
    w += moveHeuristic(b, r, c, 2) - moveHeuristic(b, r, c, 1)
  }
  return w
}

function minimaxTwoPly(b, level) {
  const cands = getCandidates(b).filter(([r, c]) => b[r][c] === 0)
  if (cands.length === 0) return null
  const cap = 14 + Math.min(level, 10)
  const ordered = cands
    .map(([r, c]) => ({
      r,
      c,
      h: moveHeuristic(b, r, c, 2) + moveHeuristic(b, r, c, 1),
    }))
    .sort((x, y) => y.h - x.h)
    .slice(0, cap)

  let best = [ordered[0].r, ordered[0].c]
  let bestScore = -1e10

  for (const { r, c } of ordered) {
    if (b[r][c] !== 0) continue
    const nb = cloneBoard(b)
    nb[r][c] = 2
    if (winBoard(nb, r, c, 2)) return [r, c]

    const hcands = getCandidates(nb).filter(([r2, c2]) => nb[r2][c2] === 0)
    const orderedH = hcands
      .map(([r2, c2]) => ({
        r2,
        c2,
        h: moveHeuristic(nb, r2, c2, 1) + moveHeuristic(nb, r2, c2, 2),
      }))
      .sort((x, y) => y.h - x.h)
      .slice(0, cap)

    let worst = 1e10
    for (const { r2, c2 } of orderedH) {
      const nb2 = cloneBoard(nb)
      nb2[r2][c2] = 1
      if (winBoard(nb2, r2, c2, 1)) {
        worst = -1e9
        break
      }
      const ev = evaluateState(nb2)
      if (ev < worst) worst = ev
    }
    if (worst > bestScore) {
      bestScore = worst
      best = [r, c]
    }
  }
  return best
}

function aiChoose(level, b) {
  const cands = getCandidates(b).filter(([r, c]) => b[r][c] === 0)
  if (cands.length === 0) return null

  for (const [r, c] of cands) {
    const t = cloneBoard(b)
    t[r][c] = 2
    if (winBoard(t, r, c, 2)) return [r, c]
  }
  for (const [r, c] of cands) {
    const t = cloneBoard(b)
    t[r][c] = 1
    if (winBoard(t, r, c, 1)) return [r, c]
  }

  if (level <= 1) return pickRandom(cands)

  if (level >= 7) {
    const m = minimaxTwoPly(b, level)
    if (m) return m
  }

  return greedyBest(b, cands, level)
}

function onPointTap(i) {
  if (phase.value !== 'game') return
  if (over.value || thinking.value || turn.value !== 1) return
  move((i / size) | 0, i % size)
}

function move(r, c) {
  if (!cells.value[r] || cells.value[r][c] !== 0) return
  const g = cloneBoard(cells.value)
  g[r][c] = 1
  cells.value = g
  if (winBoard(g, r, c, 1)) {
    winner.value = 1
    over.value = true
    if (currentLevel.value === maxUnlocked.value && currentLevel.value < totalLevels) {
      maxUnlocked.value = currentLevel.value + 1
      try {
        uni.setStorageSync(STORAGE_KEY, maxUnlocked.value)
      } catch (e) {}
    }
    return
  }
  if (isFull(g)) {
    winner.value = 0
    over.value = true
    return
  }
  turn.value = 2
  thinking.value = true
  setTimeout(() => {
    const b = cloneBoard(cells.value)
    const pick = aiChoose(currentLevel.value, b)
    thinking.value = false
    if (!pick || over.value) return
    const [ar, ac] = pick
    if (cells.value[ar][ac] !== 0) return
    const g2 = cloneBoard(cells.value)
    g2[ar][ac] = 2
    cells.value = g2
    if (winBoard(g2, ar, ac, 2)) {
      winner.value = 2
      over.value = true
      return
    }
    if (isFull(g2)) {
      winner.value = 0
      over.value = true
      return
    }
    turn.value = 1
  }, 60)
}

function restartRound() {
  cells.value = Array.from({ length: size }, () => Array(size).fill(0))
  turn.value = 1
  over.value = false
  winner.value = 0
  thinking.value = false
}

function startLevel(lv) {
  if (lv > maxUnlocked.value) return
  currentLevel.value = lv
  phase.value = 'game'
  restartRound()
}

function toMenu() {
  phase.value = 'menu'
  thinking.value = false
}

function goNextLevel() {
  if (currentLevel.value < totalLevels) {
    startLevel(currentLevel.value + 1)
  } else {
    toMenu()
  }
}

function preventMove() {}

onMounted(() => {
  try {
    const s = uni.getStorageSync(STORAGE_KEY)
    if (s >= 1 && s <= totalLevels) maxUnlocked.value = s
  } catch (e) {}
  const sys = uni.getSystemInfoSync()
  const w = sys.windowWidth || 375
  const maxW = Math.min(w - 32, 520)
  const g = Math.floor(maxW / (size - 1))
  boardPx.value = g * (size - 1)
})
</script>

<style scoped>
.page {
  padding: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.menu {
  width: 100%;
  padding: 16rpx;
}
.menu-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12rpx;
  color: #222;
}
.menu-tip {
  display: block;
  font-size: 24rpx;
  color: #666;
  text-align: center;
  margin-bottom: 28rpx;
}
.level-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}
.level-item {
  display: flex;
  width: 120rpx;
  height: 120rpx;
  margin: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  position: relative;
}
.level-item.hot {
  border: 2px solid #2563eb;
}
.level-item.locked {
  opacity: 0.45;
}
.lv-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}
.lv-lock {
  position: absolute;
  bottom: 8rpx;
  font-size: 20rpx;
  color: #999;
}
.bar {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
  padding: 0 8rpx;
}
.back {
  font-size: 28rpx;
  color: #2563eb;
}
.lv-tag {
  font-size: 26rpx;
  color: #666;
}
.game {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.status {
  width: 100%;
  text-align: center;
  font-size: 28rpx;
  margin-bottom: 12rpx;
  color: #333;
}
.wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}
.board {
  position: relative;
  flex-shrink: 0;
  background: #e4c896;
  border-radius: 20rpx;
  box-sizing: border-box;
  box-shadow:
    0 0 0 3px #6b4e2e,
    0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}
.grid-lines {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(
      to right,
      rgba(55, 35, 20, 0.45) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(55, 35, 20, 0.45) 1px, transparent 1px);
}
.cross {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.stone {
  border-radius: 50%;
  overflow: hidden;
  box-sizing: border-box;
  border-width: 1px;
  border-style: solid;
  flex-shrink: 0;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.28);
}
.stone.b {
  background: radial-gradient(circle at 32% 32%, #4a4a4a, #1a1a1a 45%, #050505);
  border-color: #111;
}
.stone.w {
  background: radial-gradient(circle at 32% 32%, #fff, #f0f0f0 50%, #d8d8d8);
  border-color: #aaa;
}
.again {
  margin-top: 18rpx;
  display: block;
  width: 100%;
  max-width: 520rpx;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 30rpx;
  font-weight: 650;
  border: none;
  border-radius: 18rpx;
  padding: 0;
  box-sizing: border-box;
  line-height: 76rpx;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  box-shadow: 0 10rpx 28rpx rgba(37, 99, 235, 0.22);
}
.again:active {
  filter: brightness(0.96);
  transform: translateY(1rpx);
}
.win-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.win-box {
  width: 560rpx;
  max-width: 92%;
  padding: 48rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.win-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #111;
  margin-bottom: 16rpx;
}
.win-desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
}
.win-btn {
  width: 100%;
  font-size: 30rpx;
}
</style>
