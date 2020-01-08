const Path = require('path')
const Url = require('url')
const Axios = require('axios')
const { get, size, map } = require('lodash')
const { app, BrowserWindow } = require('electron')

const getUserInfo = async uid => {
  const data = await Axios({
    method: 'get',
    url: `https://m.lizhi.fm/api/user/info/${uid}`,
    timeout: 30000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://m.lizhi.fm/'
    }
  }).then(res => res.data)
  const user = get(data, 'user')
  // console.log(`==== 获取 [${get(user, 'name')}] 的电台 ====`)
  return user
}

const getSongs = async (uid, page = 1, list = [], author = '') => {
  const data = await Axios({
    method: 'get',
    url: `https://www.lizhi.fm/api/user/audios/${uid}/${page}`,
    timeout: 30000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://m.lizhi.fm/'
    }
  }).then(res => res.data)
  const audios = get(data, 'audios')
  // console.log(`==== 拉取第 ${page} 页数据 (${list.length}/${get(data, 'total')}) ====`)
  if (size(audios)) {
    map(audios, v => list.push({
      id: v.id,
      name: v.name,
      artist: author,
      create: v.create_time,
      url: v.url,
      cover: `https://cdnimg103.lizhi.fm/audio_cover/${v.cover}`
    }))
    await getSongs(uid, ++page, list, author)
    return list
  }
  return []
}

const getData = async uid => {
  const user = await getUserInfo(uid)
  if (user) {
    const songs = await getSongs(uid, 1, [], user.name)
    // console.log('==== 调用窗口播放 ====')
    return songs
  }
  return []
}

let mainWindow = null

app.once('ready', async () => {
  mainWindow = new BrowserWindow({
    width: 640,
    height: 360,
    resizable: false,
    maximizable: false,
    show: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true
    }
  })

  // const uid = process.argv.slice(2)[0]
  const uid = '2550960192369959468'

  if (!uid) {
    console.error('UID is undefined!')
    app.quit()
    return
  }

  const data = await getData(uid)

  if (!size(data)) {
    console.error('No songs!')
    app.quit()
    return
  }

  process.env.MUSIC_LIST = JSON.stringify(data)

  mainWindow.loadURL(Url.format({
    pathname: Path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.minimize()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
    // console.log('==== 关闭窗口播放 ====')
  })
  mainWindow.on('error', err => {
    console.log(err)
    mainWindow = null
    app.quit()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
