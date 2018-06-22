let _ = require('lodash');
let assert = require('chai').assert;

module.exports = {
    assertEvent: (tx, eventType, argfilter) => {
        let events = _.filter(tx.logs, (entry) => {
            return entry.event === eventType;
        });
        assert.isNotEmpty(events, `Event of type ${eventType} was not emitted`);

        if (argfilter === null) {
            return;
        }

        let eventArgs = _.map(events, (entry) => {
            return entry.args;
        });
        eventArgs = _.filter(eventArgs, argfilter);
        assert.isNotEmpty(eventArgs, 'Event filter returned no results');
    },

    assertNotEvent: (tx, eventType, argfilter) => {
        let events = _.filter(tx.logs, (entry) => {
            return entry.event === eventType;
        });

        if (argfilter === null) {
            assert.isEmpty(events, `Event of type ${eventType} was emitted`);
            return;
        }

        let eventArgs = _.map(events, (entry) => {
            return entry.args;
        });
        eventArgs = _.filter(eventArgs, argfilter);
        assert.isEmptyEmpty(eventArgs, 'Event filter returned results');
    }
}
