/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true browser: true devel: true
         forin: true latedef: false globalstrict: true */

'use strict';

var Name = require('name')
var Method = require('method')

var core = require('./core'),
    convert = core.convert, accumulate = core.accumulate

var queued = Name()
var input = Name()
var forward = Name()
var state = Name()

function drain(buffer, next, result) {
  var values = buffer[queued]
  while (values.length) result = next(values.shift(), result)
  buffer[queued] = null
  return result
}

function isDrained(buffer) {
  return buffer[queued] === null
}

function buffer(source) {
  /**
  Buffer a reducible, saving items from reducible in-memory until a consumer
  reduces the buffer.

  Reducibles are not required to expose a data container for the sequence they
  represent, meaning items in the reducible may not be represented in-memory
  at all. This is great for representing potentially infinite data structures
  like "mouse clicks over time", or "data streamed from server". However,
  sometimes it's important to reduce all items in the reducible, even if the
  item was emitted at a point in the past. This is where buffer comes in handy.
  It stores a backlog of previously emitted items in-memory until you're
  ready to consume.
  **/
  var self = convert(source, buffer.accumulate)
  self[state] = null
  self[input] = source
  self[queued] = []
  self[forward] = function(value) {
    self[queued].push(value)
  }
  accumulate(source, function(value) {
    self[state] = self[forward](value, self[state])
  })
  return self
}
buffer.accumulate = function(buffer, next, initial) {
  if (isDrained(buffer)) return accumulate(buffer[input], next, initial)
  buffer[state] = drain(buffer, next, initial)
  buffer[forward] = next
  return buffer
}

module.exports = buffer
