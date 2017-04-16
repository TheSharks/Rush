// This is an example on how RushMods work.

exports.init = function (Dispatch) { // This will be called when the module first initializes, this provides the Dispatcher for events.
  Dispatch.on('MESSAGE_CREATE', (data) => externalFunction(data.c))
}

function externalFunction(c) {
  console.log(c.message.content)
}