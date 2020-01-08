const Mousetrap = require('mousetrap')
const dataList = JSON.parse(process.env.MUSIC_LIST)
const json = (data, type) => {
  try {
    return window.JSON[type](data)
  } catch (e) {
    return data
  }
}
const lsGet = key => {
  if (!window.localStorage) return
  return json(window.localStorage.getItem(key), 'parse')
}
const lsSet = (key, data) => {
  if (!window.localStorage) return
  return window.localStorage.setItem(key, json(data, 'stringify'))
}

const player = new window.APlayer({
  container: document.getElementById('player'),
  autoplay: true,
  lrcType: 0,
  mutex: true,
  loop: 'all',
  preload: 'metadata',
  mode: 'circulation',
  listmaxheight: '230px',
  audio: dataList
})
const el = document.querySelector('.aplayer-music')
const span = document.createElement('span')
const link = document.createElement('a')

span.classList = 'aplayer-link'
link.textContent = '下载'

span.appendChild(link)
el.appendChild(span)

const audioIndex = lsGet('__audioIndex') || 0
if (audioIndex) {
  player.list.switch(audioIndex)
}

player.on('canplay', () => {
  const current = player.list.audios[player.list.index]
  link.href = current.url
  link.download = `${current.name}-${current.artist}`
  if (!player.pause) {
    player.play()
  }
})

player.on('listswitch', ({ index }) => {
  lsSet('__audioIndex', index)
})

Mousetrap.bind('space', () => {
  player.toggle()
})
Mousetrap.bind(['up', 'w'], () => {
  player.skipBack()
})
Mousetrap.bind(['down', 's'], () => {
  player.skipForward()
})
Mousetrap.bind(['left', 'a'], () => {
  if (player.audio.currentTime === 0) return
  player.seek(player.audio.currentTime - 5)
})

Mousetrap.bind(['right', 'd'], () => {
  if (player.audio.currentTime === player.audio.duration) return
  player.seek(player.audio.currentTime + 5)
})
