module.exports = Object.assign(function factory(options) {
    factory.__callCount++;
    factory.__options = options;

    return Object.assign(function htmlProcessor() {}, {id: 'html'});
}, {__callCount: 0});