module.exports = Object.assign(function factory(options) {
    factory.__callCount++;
    factory.__options = options;

    return factory.__processor;
}, {
    __processor: Object.assign(function htmlProcessor() {/*ha nincs eredmeny akkor nem is irja ki a rendszer a fajlt*/}, {id: 'html', onTranspileStart: function() {}}),
    reset: function() {
        this.__callCount = 0;
        delete this.__options;
    }
});