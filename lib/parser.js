/********************************************************************************
*  parser.js                                                                    *
*  Author: Denes Solti                                                          *
********************************************************************************/
'use strict';
(function(module, require) {
const
    {strip, countLinesTo, isDefined} = require('./utils');

module.exports = class Parser {
    static parseAttributes(input) {
        const
            rex = /([\w-]+)(?:=("|')((?:(?!\2|\r\n|\n|\r).)*)\2)?/g,
            res = {};

        for (var ar; (ar = rex.exec(input)) != null;) {
            const [, key, , value] = ar;
            res[key] = isDefined(value) ? value : true;
        }

        return res;
    }

    static parseNodes(input) {
        const
            rex = /<([\w-]+)\b((?:[ \t]*[\w-]+(?:=("|')((?:(?!\3|\r\n|\n|\r).)*)\3)?)*)[ \t]*>([\s\S]*)<\/\1>$/gm,
            res = [];

        for (var ar; (ar = rex.exec(input)) != null;) {
            const
                [, name, rawAttrs, , , rawContent] = ar,

                startIndex   = ar.index,
                endIndex     = rex.lastIndex,
                content      = strip(rawContent),

                nodeStart    = countLinesTo(startIndex, input),
                nodeEnd      = countLinesTo(endIndex + 1, input),
                contentLines = countLinesTo(content.length, content);

            res.push({
                name,
                content,
                startIndex,
                endIndex,
                nodeStart,
                nodeEnd,

                attrs: Parser.parseAttributes(rawAttrs),

                // ugly =(
                contentStart: nodeStart + (rawContent.slice(1) !== content.slice(1) ? 1 : 0),
                contentEnd:   nodeStart + contentLines - (rawContent.slice(-1) !== content.slice(-1) ? 0 : 1)
            });
        }

        return res;
    }
};
})(module, require);