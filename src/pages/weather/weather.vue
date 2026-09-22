<template>
  <view class="page">
    <view class="search">
      <input
        class="inp"
        :value="q"
        placeholder="输入城市，如 北京"
        confirm-type="search"
        @input="onQ"
        @confirm="search"
      />
      <view class="sbtn" @tap="search">查询</view>
      <view class="sbtn loc" @tap="locate">定位</view>
    </view>
    <view v-if="hits.length" class="hits">
      <view v-for="h in hits" :key="h.id" class="hit" @tap="pick(h)">
        {{ h.label }}
      </view>
    </view>

    <view v-if="cur" class="now">
      <text class="city">{{ place }}</text>
      <text class="icon">{{ cur.icon }}</text>
      <text class="temp">{{ cur.temp }}°</text>
      <text class="desc">{{ cur.desc }} · 体感 {{ cur.feel }}°</text>
      <view class="meta">
        <text>湿度 {{ cur.rh }}%</text>
        <text>风速 {{ cur.wind }} km/h</text>
      </view>
    </view>

    <view v-if="days.length" class="list">
      <view v-for="d in days" :key="d.date" class="day">
        <text class="dn">{{ d.label }}</text>
        <text class="di">{{ d.icon }} {{ d.desc }}</text>
        <text class="dt">{{ d.min }}° / {{ d.max }}°</text>
      </view>
    </view>
    <view v-if="err" class="empty">{{ err }}</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { load, save } from '../../utils/store.js'
import { pad2 } from '../../utils/fmt.js'

const KEY = 'tools_weather_last_v1'
const WMO = {
  0: ['晴', '☀️'],
  1: ['大部晴朗', '🌤️'],
  2: ['多云', '⛅'],
  3: ['阴', '☁️'],
  45: ['雾', '🌫️'],
  48: ['雾凇', '🌫️'],
  51: ['小毛毛雨', '🌦️'],
  53: ['毛毛雨', '🌦️'],
  55: ['大毛毛雨', '🌧️'],
  56: ['冻毛毛雨', '🌧️'],
  57: ['强冻毛毛雨', '🌧️'],
  61: ['小雨', '🌧️'],
  63: ['中雨', '🌧️'],
  65: ['大雨', '🌧️'],
  66: ['冻雨', '🌧️'],
  67: ['强冻雨', '🌧️'],
  71: ['小雪', '🌨️'],
  73: ['中雪', '🌨️'],
  75: ['大雪', '❄️'],
  77: ['雪粒', '🌨️'],
  80: ['小阵雨', '🌦️'],
  81: ['阵雨', '🌧️'],
  82: ['强阵雨', '⛈️'],
  85: ['小阵雪', '🌨️'],
  86: ['强阵雪', '❄️'],
  95: ['雷阵雨', '⛈️'],
  96: ['雷暴伴冰雹', '⛈️'],
  99: ['强雷暴冰雹', '⛈️'],
}

const q = ref('')
const hits = ref([])
const place = ref('')
const cur = ref(null)
const days = ref([])
const err = ref('')
let loaded = false
let ticket = 0

function wmo(code) {
  return WMO[code] || ['未知', '🌡️']
}

function onQ(e) {
  q.value = String(e.detail.value || '').slice(0, 20)
}

function request(url, data) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      data,
      timeout: 12000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error('请求失败'))
      },
      fail: () => reject(new Error('网络异常')),
    })
  })
}

function weekLabel(iso) {
  const p = iso.split('-').map(Number)
  const dt = new Date(p[0], p[1] - 1, p[2])
  const today = new Date()
  const a = ymd(today)
  const b = iso
  if (a === b) return '今天'
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return names[dt.getDay()] + ' ' + p[1] + '/' + p[2]
}

function ymd(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

async function fetchWeather(lat, lon, name) {
  const id = ++ticket
  err.value = ''
  hits.value = []
  uni.showLoading({ title: '查询中', mask: true })
  try {
    const data = await request('https://api.open-meteo.com/v1/forecast', {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      wind_speed_unit: 'kmh',
      forecast_days: 7,
    })
    if (id !== ticket) return
    const c = data.current || {}
    const w = wmo(c.weather_code)
    cur.value = {
      temp: Math.round(c.temperature_2m),
      feel: Math.round(c.apparent_temperature),
      rh: Math.round(c.relative_humidity_2m),
      wind: Math.round(c.wind_speed_10m),
      desc: w[0],
      icon: w[1],
    }
    const daily = data.daily || {}
    const arr = []
    const dates = daily.time || []
    for (let i = 0; i < dates.length; i++) {
      const ww = wmo(daily.weather_code[i])
      arr.push({
        date: dates[i],
        label: weekLabel(dates[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        max: Math.round(daily.temperature_2m_max[i]),
        desc: ww[0],
        icon: ww[1],
      })
    }
    days.value = arr
    place.value = name
    save(KEY, { name, lat, lon })
  } catch (e) {
    if (id !== ticket) return
    err.value = (e && e.message) || '查询失败'
    cur.value = null
    days.value = []
  } finally {
    if (id === ticket) {
      uni.hideLoading()
    }
  }
}

async function search() {
  const name = q.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入城市名', icon: 'none' })
    return
  }
  const id = ++ticket
  err.value = ''
  uni.showLoading({ title: '搜索中', mask: true })
  try {
    const data = await request('https://geocoding-api.open-meteo.com/v1/search', {
      name,
      count: 6,
      language: 'zh',
      format: 'json',
    })
    if (id !== ticket) return
    const list = (data && data.results) || []
    if (!list.length) {
      hits.value = []
      err.value = '没有找到该城市'
      cur.value = null
      days.value = []
      return
    }
    hits.value = list.map((x) => ({
      id: x.id,
      lat: x.latitude,
      lon: x.longitude,
      label: [x.name, x.admin1, x.country].filter(Boolean).join(' · '),
      name: x.name,
    }))
    if (hits.value.length === 1) {
      const h = hits.value[0]
      await fetchWeather(h.lat, h.lon, h.name)
    }
  } catch (e) {
    if (id !== ticket) return
    err.value = (e && e.message) || '搜索失败'
  } finally {
    if (id === ticket) {
      uni.hideLoading()
    }
  }
}

function pick(h) {
  fetchWeather(h.lat, h.lon, h.name)
}

function locate() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      fetchWeather(res.latitude, res.longitude, '当前位置')
    },
    fail: () => {
      uni.showToast({ title: '定位失败，请搜索城市', icon: 'none' })
    },
  })
}

onShow(() => {
  if (loaded) return
  loaded = true
  const last = load(KEY, null)
  if (last && last.lat && last.lon) {
    fetchWeather(last.lat, last.lon, last.name || '上次地点')
    return
  }
  fetchWeather(39.9042, 116.4074, '北京')
})

onHide(() => {
  uni.hideLoading()
})
</script>

<style scoped>
.page {
  padding: 24rpx 28rpx 80rpx;
}
.search {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.inp {
  flex: 1;
  height: 80rpx;
  background: #fffcf8;
  border-radius: 18rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}
.sbtn {
  width: 100rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: #4a7c3a;
  color: #f4fff0;
  border-radius: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.loc {
  width: 100rpx;
  background: #efe8dc;
  color: #1f1b16;
}
.hits {
  background: #fffcf8;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.hit {
  padding: 24rpx;
  font-size: 28rpx;
  border-bottom: 1px solid #f0ebe3;
}
.hit:last-child {
  border-bottom: none;
}
.now {
  background: #1f1b16;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  color: #f6efe4;
  margin-bottom: 24rpx;
}
.city {
  display: block;
  font-size: 26rpx;
  opacity: 0.7;
}
.icon {
  display: block;
  font-size: 64rpx;
  margin-top: 12rpx;
}
.temp {
  display: block;
  font-size: 96rpx;
  font-weight: 700;
  line-height: 1.1;
}
.desc {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
}
.meta {
  display: flex;
  justify-content: space-between;
  margin-top: 28rpx;
  font-size: 24rpx;
  opacity: 0.75;
}
.list {
  background: #fffcf8;
  border-radius: 28rpx;
  padding: 8rpx 8rpx;
}
.day {
  display: flex;
  align-items: center;
  padding: 22rpx 20rpx;
}
.dn {
  width: 160rpx;
  font-size: 26rpx;
  color: #5c564e;
}
.di {
  flex: 1;
  font-size: 26rpx;
}
.dt {
  font-size: 26rpx;
  font-weight: 600;
}
.empty {
  text-align: center;
  color: #8a8278;
  padding: 40rpx 0;
  font-size: 26rpx;
}
</style>
