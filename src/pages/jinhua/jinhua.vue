<template>
  <view class="page">
    <view class="topbar">
      <text class="title">打金花</text>
      <button class="deal" size="mini" :disabled="dealing" @tap="deal">
        {{ dealt ? '再来一局' : '发牌' }}
      </button>
    </view>

    <view class="panel">
      <text class="label">庄家牌</text>
      <view class="cards">
        <view
          v-for="(c, i) in bankerCards"
          :key="'b' + i"
          class="card"
          :class="[suitClass(c.s), { show: dealt }]"
        >
          <image class="poker-img" :src="cardImgSrc(c)" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view class="panel">
      <text class="label">你的牌</text>
      <view class="cards">
        <view
          v-for="(c, i) in playerCards"
          :key="'p' + i"
          class="card"
          :class="[suitClass(c.s), { show: dealt }]"
        >
          <image class="poker-img" :src="cardImgSrc(c)" mode="aspectFit" />
        </view>
      </view>
    </view>

    <view v-if="dealt" class="result">
      <text class="result-text">{{ resultText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const suits = ['S', 'H', 'D', 'C']
const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

const playerCards = ref([])
const bankerCards = ref([])
const dealt = ref(false)
const dealing = ref(false)

const playerHand = ref(null)
const bankerHand = ref(null)

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function makeDeck() {
  const deck = []
  for (const s of suits) {
    for (const r of ranks) deck.push({ s, r })
  }
  return deck
}

function dealThree(deck) {
  return [deck.shift(), deck.shift(), deck.shift()]
}

function isStraight(ranksIn) {
  const uniq = Array.from(new Set(ranksIn)).sort((a, b) => a - b)
  if (uniq.length !== 3) return { straight: false, high: 0 }
  const a = uniq[0]
  const b = uniq[1]
  const c = uniq[2]
  if (a + 1 === b && b + 1 === c) return { straight: true, high: c }
  if (a === 2 && b === 3 && c === 14) return { straight: true, high: 3 } // A-2-3
  return { straight: false, high: 0 }
}

function evaluateHand(cards) {
  const isFlush = cards.every((c) => c.s === cards[0].s)
  const ranksIn = cards.map((c) => c.r)
  const ranksDesc = ranksIn.slice().sort((a, b) => b - a)

  const counts = new Map()
  for (const r of ranksIn) counts.set(r, (counts.get(r) || 0) + 1)
  const uniqCount = counts.size

  const straightRes = isStraight(ranksIn)
  const isStraightRes = straightRes.straight
  const straightHigh = straightRes.high

  if (isFlush && isStraightRes) return { cat: 6, tiebreak: [straightHigh] } // 同花顺
  if (uniqCount === 1) return { cat: 5, tiebreak: [ranksDesc[0]] } // 豹子
  if (isFlush) return { cat: 4, tiebreak: ranksDesc } // 同花
  if (isStraightRes) return { cat: 3, tiebreak: [straightHigh] } // 顺子

  if (uniqCount === 2) {
    let pairRank = 0
    let kicker = 0
    for (const [rk, cnt] of counts.entries()) {
      if (cnt === 2) pairRank = rk
      else kicker = rk
    }
    return { cat: 2, tiebreak: [pairRank, kicker] } // 对子
  }

  return { cat: 1, tiebreak: ranksDesc } // 散牌
}

function compareHands(a, b) {
  if (!a || !b) return 0
  if (a.cat !== b.cat) return a.cat > b.cat ? 1 : -1
  const ta = a.tiebreak
  const tb = b.tiebreak
  const len = Math.min(ta.length, tb.length)
  for (let i = 0; i < len; i++) {
    if (ta[i] !== tb[i]) return ta[i] > tb[i] ? 1 : -1
  }
  return 0
}

function handName(h) {
  if (!h) return ''
  if (h.cat === 6) return '同花顺'
  if (h.cat === 5) return '豹子'
  if (h.cat === 4) return '同花'
  if (h.cat === 3) return '顺子'
  if (h.cat === 2) return '对子'
  return '散牌'
}

function rankText(r) {
  if (r <= 10) return String(r)
  if (r === 11) return 'J'
  if (r === 12) return 'Q'
  if (r === 13) return 'K'
  return 'A'
}

function suitText(s) {
  if (s === 'H') return '红心'
  if (s === 'D') return '方片'
  if (s === 'C') return '梅花'
  return '黑桃'
}

function suitClass(s) {
  return s === 'H' || s === 'D' ? 'red' : 'black'
}

function cardImgSrc(c) {
  const suitToName = {
    S: 'spades',
    H: 'hearts',
    D: 'diamonds',
    C: 'clubs',
  }
  const rank = c.r
  let rankName = ''
  if (rank <= 10) rankName = String(rank)
  else if (rank === 11) rankName = 'jack'
  else if (rank === 12) rankName = 'queen'
  else if (rank === 13) rankName = 'king'
  else rankName = 'ace'
  return `/static/img/${rankName}_of_${suitToName[c.s]}.png`
}

const resultText = computed(() => {
  if (!dealt.value || !playerHand.value || !bankerHand.value) return ''
  const cmp = compareHands(playerHand.value, bankerHand.value)
  const pName = handName(playerHand.value)
  const bName = handName(bankerHand.value)
  if (cmp === 1) return `你的牌：${pName}；庄家：${bName}；你赢`
  if (cmp === -1) return `你的牌：${pName}；庄家：${bName}；你输`
  return `你的牌：${pName}；庄家：${bName}；平局`
})

function deal() {
  if (dealing.value) return
  dealing.value = true
  dealt.value = false
  playerCards.value = []
  bankerCards.value = []
  playerHand.value = null
  bankerHand.value = null

  setTimeout(() => {
    const deck = shuffle(makeDeck())
    const p = dealThree(deck)
    const b = dealThree(deck)
    playerCards.value = p
    bankerCards.value = b
    playerHand.value = evaluateHand(p)
    bankerHand.value = evaluateHand(b)
    dealt.value = true
    dealing.value = false
  }, 220)
}
</script>

<style scoped>
.page {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  background: #f8f8f8;
}
.topbar {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #222;
}
.panel {
  width: 100%;
  margin-bottom: 22rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  color: #444;
  margin-bottom: 16rpx;
}
.cards {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.card {
  width: 148rpx;
  height: 198rpx;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
  display: block;
  box-sizing: border-box;
  margin: 0 10rpx;
  opacity: 0;
  transform: translateY(8rpx) scale(0.98);
  transition: opacity 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}
.card.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.poker-img {
  width: 100%;
  height: 100%;
  display: block;
}
.card.red {
  border-color: rgba(239, 68, 68, 0.35);
}
.card.black {
  border-color: rgba(17, 24, 39, 0.25);
}
.card.red,
.card.black {
  border: 2rpx solid transparent;
}
.card.red {
  border-color: rgba(239, 68, 68, 0.32);
}
.card.black {
  border-color: rgba(17, 24, 39, 0.24);
}
.rank {
  font-size: 54rpx;
  font-weight: 800;
  text-align: center;
  line-height: 1;
  color: #111;
}
.suit {
  font-size: 22rpx;
  text-align: center;
  color: #666;
}
.deal {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border-radius: 14rpx;
}
.deal:disabled {
  opacity: 0.65;
}
.result {
  width: 100%;
  text-align: center;
  margin-top: 10rpx;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20rpx;
  padding: 22rpx 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}
.result-text {
  font-size: 30rpx;
  color: #111;
  font-weight: 650;
}
</style>

