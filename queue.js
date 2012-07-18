/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true */

'use strict';

var Name = require('name')
var Method = require('method')


var core = require('./core'),
    accumulate = core.accumulate, accumulator = core.accumulator

var channels = require('./channel'),
    isClosed = channels.isClosed, isOpen = channels.isOpen,
    enqueue = channels.enqueue, dispose = channels.dispose,
    close = channels.close

var queued = Name()
var target = Name()

function drain(queue) {
  var values = queue[queued]
  while (values.length) enqueue(queue[target], values.shift())
  queue[queued] = null
  return queue
}

function isDrained(queue) {
  return isOpen(queue) && !queue[queued]
}

function Queue(channel, items) {
  this[queued] = items
  this[target] = channel
}
enqueue.define(Queue, function(queue, value) {
  if (isDrained(queue))
    enqueue(queue[target], value)
  else queue[queued].push(value)
  return queue
})
accumulate.define(Queue, function(queue, next, initial) {
  var opened = isOpen(queue)
  accumulate(queue[target], next, initial)
  if (!opened) drain(queue)
  return queue
})
isClosed.define(Queue, function(queue) {
  return isClosed(queue[target])
})
isOpen.define(Queue, function(queue) {
  return isOpen(queue[target])
})
close.define(Queue, function(queue, value) {
  if (value !== undefined) enqueue(queue, value)
  return close(queue[target])
})

function queue(target) {
  return new Queue(target, [])
}
exports.queue = queue
