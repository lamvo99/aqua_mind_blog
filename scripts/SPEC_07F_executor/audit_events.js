'use strict';

function createLog() {
  const events = [];
  let seq = 0;
  return {
    emit: function emit(type, payload) {
      seq += 1;
      events.push({ seq: seq, type: type, payload: payload });
      return events[events.length - 1];
    },
    all: function all() { return events.slice(); },
    count: function count() { return events.length; },
    byType: function byType() {
      const counts = {};
      for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
      return counts;
    },
  };
}

module.exports = { createLog };
