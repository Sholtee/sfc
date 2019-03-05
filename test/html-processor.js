module.exports = Object.assign(function factory(options) {
    factory.__callCount++;
    factory.__options = options;

    return Object.assign(function htmlProcessor(content) {return content;}, {
        id: 'html',
        onTranspileStart: function() {}
    });
}, {__callCount: 0});