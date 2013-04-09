var INHERIT = require('inherit'),
    Template = require('../template'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import url(' + relPath + ');\n';
    },

    getSelector: function(vars) {
        return '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? '_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal : '') : '');

    },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = this.getSelector(vars);

        return Template.process([
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    },

    

});
