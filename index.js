process.title = 'Rush'

const Config = require('./config.json')
const Websocket = require('ws')
const Discordie = require('discordie')
const bot = new Discordie()
const EventEmitter = require('events')
const Dispatch = new EventEmitter()
const ReqDir = require('require-directory')

let modules = ReqDir(module, './modules')

for (var mod in modules) {
  if (typeof modules[mod].init !== 'function') console.warn('Cannot load a module due to the init function being invalid.')
  else modules[mod].init(Dispatch)
}

let count = 0
let WS = new Websocket(Config.bezerkURI)

bot.connect({
  token: Config.token
})


bot.Dispatcher.on('GATEWAY_READY', () => {
  console.log('Rush is ready!')
  send('IDENTIFY_LISTENER', ['*']) // we want fucking EVERYTHING
})

bot.Dispatcher.on('MESSAGE_CREATE', c => {
  if (c.message.author.id === '107904023901777920') {
    if (c.message.content.indexOf('gc:ask') === 0) {
      let question = c.message.content.split(' ')
      question.shift()
      question.join(' ')
      let response = []
      let counter = 0
      send('EVAL', question.toString())
      console.log(question)
      Dispatch.on('EVAL_REPLY', function doShit(data) {
        counter++
        response.push(`\`${data.shard}\`: \`${data.c}\``)
        if (counter === count){
          c.message.channel.sendMessage(response.join('\n'))
          Dispatch.removeListener('EVAL_REPLY', doShit)
        } 
      })
    }
  }
})

WS.on('message', (c) => {
  var data = JSON.parse(c)
  receive(data)
})

function send(opCode, data, shard) {
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

function receive(data) {
  switch (data.op) {
    case 'HELLO': {
      console.log('Hello from Bezerk!')
      break
    }
    case 'OK': {
      console.log('Bezerk connection established!')
      send('EVAL', 'Bezerk.send(JSON.stringify({op: "SHARD_ID", c: argv.shardid}))') // Ask all shards to return their ShardID
      break
    }
    case 'SHARD_ID' : {
      count++
      console.log(`Got a response from shard ${data.c}, verified connected to ${count} shards so far.`)
      break
    }
    case 'SHARD_JOINED' : {
      count++
      console.log(`Shard ${data.c} just connected to Bezerk`)
      Dispatch.emit(data.op, data)
      break
    }
    case 'SHARD_LEFT' : {
      count--
      console.log(`Shard ${data.c} dropped from Bezerk`)
      Dispatch.emit(data.op, data)
      break
    }
    default: {
      Dispatch.emit(data.op, data)
    }
  }
}