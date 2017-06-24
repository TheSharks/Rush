process.title = 'Rush'

const Config = require('./config.json')
const Websocket = require('ws')
const Discordie = require('discordie')
const bot = new Discordie({
  autoReconnect: true
})
const EventEmitter = require('events')
const Dispatch = new EventEmitter()
const ReqDir = require('require-directory')

let modules = ReqDir(module, './modules')

let WS

function init () {
  WS = new Websocket(Config.bezerkURI)
}

init()

for (var mod in modules) {
  if (typeof modules[mod].init !== 'function') console.warn('Cannot load a module due to the init function being invalid.')
  else modules[mod].init(Dispatch, bot.Dispatcher)
}

bot.connect({
  token: Config.token
})

bot.Dispatcher.on('DISCONNECTED', () => {
  if (WS !== undefined) WS.close()
  WS = undefined
})

bot.Dispatcher.on('GATEWAY_READY', () => {
  console.log('Rush is ready!')
  send('IDENTIFY_LISTENER', ['*']) // we want fucking EVERYTHING
})

Dispatch.on('QUESTION', (k) => {
  k.shard !== undefined ? send(k.op, k.c, k.shard) : send(k.op, k.c)
})

WS.on('message', (c) => {
  var data = JSON.parse(c)
  receive(data)
})

WS.on('close', () => {
  console.log('Lost connection, attempting to reconnect...')
  init()
})

function send (opCode, data, shard) {
  if (!shard) {
    WS.send(JSON.stringify({
      op: opCode,
      c: data
    }))
  } else {
    WS.send(JSON.stringify({
      op: opCode,
      shard: shard,
      c: data
    }))
  }
}

function receive (data) {
  switch (data.op) {
    case 'HELLO': {
      console.log('Hello from Bezerk!')
      break
    }
    case 'OK': {
      console.log('Bezerk connection established!')
      send('COUNT', '')
      break
    }
    case 'COUNT_REPLY' : {
      console.log(`Bezerk is connected to ${data.c.shards} shards, and ${data.c.listeners} listeners.`)
      Dispatch.emit(data.op, data)
      break
    }
    case 'SHARD_JOINED' : {
      console.log(`Shard ${data.c} just connected to Bezerk`)
      Dispatch.emit(data.op, data)
      Dispatch.emit('ANY', data)
      break
    }
    case 'SHARD_LEFT' : {
      console.log(`Shard ${data.c} dropped from Bezerk`)
      Dispatch.emit(data.op, data)
      Dispatch.emit('ANY', data)
      break
    }
    default: {
      Dispatch.emit(data.op, data)
      Dispatch.emit('ANY', data)
    }
  }
}
