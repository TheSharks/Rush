// This is an example on how RushMods work.
let WS

exports.init = function (Dispatch, BotDispatch, BezerkWS) { // This will be called when the module first initializes, this provides the Dispatcher for events.
  Dispatch.on('ANY', (data) => externalFunction(data))
  BotDispatch.on('MESSAGE_CREATE', (c) => console.log(c.message.content))
  WS = BezerkWS
}

function externalFunction (bezerkEventData) {
  console.log(bezerkEventData.op, bezerkEventData.c)
}

function askBezerk (data) { // eslint-disable-line no-unused-vars
  WS.send(JSON.stringify(data)) // Websockets work with strings, NOT with objects, be sure to stringify your objects before sending
}
