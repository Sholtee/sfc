module.exports = Object.assign(function factory(options) {
    factory.__callCount++;
    factory.__options = options;

    return Object.assign(function htmlProcessor() {}, {  // ha nincs eredmeny akkor nem is irja ki a rendszer a fajlt
        id: 'html',
        onTranspileStart: function() {}
    });
}, {__callCount: 0});