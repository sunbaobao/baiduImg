define('js', [], {
    load: function (e, a, n) {
        function t() {
            var e = d.readyState;
            ('undefined' == typeof e || /^(loaded|complete)$/.test(e)) && (d.onload = d.onreadystatechange = null, d = null, n(!0));
        }

        var d = document.createElement('script');
        d.src = a.toUrl(e), d.async = !0, d.readyState ? d.onreadystatechange = t : d.onload = t;
        var o = document.getElementsByTagName('head')[0] || document.body;
        o.appendChild(d), o = null;
    }
});

define('babel-runtime/helpers/class-call-check', ['require'], function (require) {
    var exports = {};
    exports['default'] = function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError('Cannot call a class as a function');
        }
    };
    return exports;
});

define('babel-runtime/helpers/interop-require-default', ['require'], function (require) {
    var exports = {};
    exports['default'] = function (obj) {
        return {'default': obj};
    };
    return exports;
});

(function (root) {
    function extend(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    }

    function Stack() {
        this.raw = [];
        this.length = 0;
    }

    Stack.prototype = {
        push: function (elem) {
            this.raw[this.length++] = elem;
        },
        pop: function () {
            if (this.length > 0) {
                var elem = this.raw[--this.length];
                this.raw.length = this.length;
                return elem;
            }
        },
        top: function () {
            return this.raw[this.length - 1];
        },
        bottom: function () {
            return this.raw[0];
        },
        find: function (condition) {
            var index = this.length;
            while (index--) {
                var item = this.raw[index];
                if (condition(item)) {
                    return item;
                }
            }
        }
    };
    var guidIndex = 178245;

    function generateGUID() {
        return '___' + guidIndex++;
    }

    function inherits(subClass, superClass) {
        var F = new Function();
        F.prototype = superClass.prototype;
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;
    }

    var HTML_ENTITY = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
    };

    function htmlFilterReplacer(c) {
        return HTML_ENTITY[c];
    }

    var DEFAULT_FILTERS = {
        html: function (source) {
            return source.replace(/[&<>"']/g, htmlFilterReplacer);
        },
        url: encodeURIComponent,
        raw: function (source) {
            return source;
        }
    };

    function stringLiteralize(source) {
        return '"' + source.replace(/\x5C/g, '\\\\').replace(/"/g, '\\"').replace(/\x0A/g, '\\n').replace(/\x09/g, '\\t').replace(/\x0D/g, '\\r') + '"';
    }

    function regexpLiteral(source) {
        return source.replace(/[\^\[\]\$\(\)\{\}\?\*\.\+]/g, function (c) {
            return '\\' + c;
        });
    }

    function stringFormat(source) {
        var args = arguments;
        return source.replace(/\{([0-9]+)\}/g, function (match, index) {
            return args[index - 0 + 1];
        });
    }

    var RENDER_STRING_DECLATION = 'var r="";';
    var RENDER_STRING_ADD_START = 'r+=';
    var RENDER_STRING_ADD_END = ';';
    var RENDER_STRING_RETURN = 'return r;';
    if (typeof navigator !== 'undefined' && /msie\s*([0-9]+)/i.test(navigator.userAgent) && RegExp.$1 - 0 < 8) {
        RENDER_STRING_DECLATION = 'var r=[],ri=0;';
        RENDER_STRING_ADD_START = 'r[ri++]=';
        RENDER_STRING_RETURN = 'return r.join("");';
    }

    function toGetVariableLiteral(name) {
        name = name.replace(/^\s*\*/, '');
        return stringFormat('gv({0},["{1}"])', stringLiteralize(name), name.replace(/\[['"]?([^'"]+)['"]?\]/g, function (match, name) {
            return '.' + name;
        }).split('.').join('","'));
    }

    function parseTextBlock(source, open, close, greedy, onInBlock, onOutBlock) {
        var closeLen = close.length;
        var texts = source.split(open);
        var level = 0;
        var buf = [];
        for (var i = 0, len = texts.length; i < len; i++) {
            var text = texts[i];
            if (i) {
                var openBegin = 1;
                level++;
                while (1) {
                    var closeIndex = text.indexOf(close);
                    if (closeIndex < 0) {
                        buf.push(level > 1 && openBegin ? open : '', text);
                        break;
                    }
                    level = greedy ? level - 1 : 0;
                    buf.push(level > 0 && openBegin ? open : '', text.slice(0, closeIndex), level > 0 ? close : '');
                    text = text.slice(closeIndex + closeLen);
                    openBegin = 0;
                    if (level === 0) {
                        break;
                    }
                }
                if (level === 0) {
                    onInBlock(buf.join(''));
                    onOutBlock(text);
                    buf = [];
                }
            } else {
                text && onOutBlock(text);
            }
        }
        if (level > 0 && buf.length > 0) {
            onOutBlock(open);
            onOutBlock(buf.join(''));
        }
    }

    function compileVariable(source, engine, forText) {
        var code = [];
        var options = engine.options;
        var toStringHead = '';
        var toStringFoot = '';
        var wrapHead = '';
        var wrapFoot = '';
        var defaultFilter;
        if (forText) {
            toStringHead = 'ts(';
            toStringFoot = ')';
            wrapHead = RENDER_STRING_ADD_START;
            wrapFoot = RENDER_STRING_ADD_END;
            defaultFilter = options.defaultFilter;
        }
        parseTextBlock(source, options.variableOpen, options.variableClose, 1, function (text) {
            if (forText && text.indexOf('|') < 0 && defaultFilter) {
                text += '|' + defaultFilter;
            }
            var filterCharIndex = text.indexOf('|');
            var variableName = (filterCharIndex > 0 ? text.slice(0, filterCharIndex) : text).replace(/^\s+/, '').replace(/\s+$/, '');
            var filterSource = filterCharIndex > 0 ? text.slice(filterCharIndex + 1) : '';
            var variableRawValue = variableName.indexOf('*') === 0;
            var variableCode = [
                variableRawValue ? '' : toStringHead,
                toGetVariableLiteral(variableName),
                variableRawValue ? '' : toStringFoot
            ];
            if (filterSource) {
                filterSource = compileVariable(filterSource, engine);
                var filterSegs = filterSource.split('|');
                for (var i = 0, len = filterSegs.length; i < len; i++) {
                    var seg = filterSegs[i];
                    if (/^\s*([a-z0-9_-]+)(\((.*)\))?\s*$/i.test(seg)) {
                        variableCode.unshift('fs["' + RegExp.$1 + '"](');
                        if (RegExp.$3) {
                            variableCode.push(',', RegExp.$3);
                        }
                        variableCode.push(')');
                    }
                }
            }
            code.push(wrapHead, variableCode.join(''), wrapFoot);
        }, function (text) {
            code.push(wrapHead, forText ? stringLiteralize(text) : text, wrapFoot);
        });
        return code.join('');
    }

    function TextNode(value, engine) {
        this.value = value;
        this.engine = engine;
    }

    TextNode.prototype = {
        getRendererBody: function () {
            var value = this.value;
            var options = this.engine.options;
            if (!value || options.strip && /^\s*$/.test(value)) {
                return '';
            }
            return compileVariable(value, this.engine, 1);
        },
        clone: function () {
            return this;
        }
    };

    function Command(value, engine) {
        this.value = value;
        this.engine = engine;
        this.children = [];
        this.cloneProps = [];
    }

    Command.prototype = {
        addChild: function (node) {
            this.children.push(node);
        },
        open: function (context) {
            var parent = context.stack.top();
            parent && parent.addChild(this);
            context.stack.push(this);
        },
        close: function (context) {
            if (context.stack.top() === this) {
                context.stack.pop();
            }
        },
        getRendererBody: function () {
            var buf = [];
            var children = this.children;
            for (var i = 0; i < children.length; i++) {
                buf.push(children[i].getRendererBody());
            }
            return buf.join('');
        },
        clone: function () {
            var node = new this.constructor(this.value, this.engine);
            for (var i = 0, l = this.children.length; i < l; i++) {
                node.addChild(this.children[i].clone());
            }
            for (var i = 0, l = this.cloneProps.length; i < l; i++) {
                var prop = this.cloneProps[i];
                node[prop] = this[prop];
            }
            return node;
        }
    };

    function autoCloseCommand(context, CommandType) {
        var stack = context.stack;
        var closeEnd = CommandType ? stack.find(function (item) {
            return item instanceof CommandType;
        }) : stack.bottom();
        if (closeEnd) {
            var node;
            while ((node = stack.top()) !== closeEnd) {
                if (!node.autoClose) {
                    throw new Error(node.type + ' must be closed manually: ' + node.value);
                }
                node.autoClose(context);
            }
            closeEnd.close(context);
        }
        return closeEnd;
    }

    var RENDERER_BODY_START = '' + 'data=data||{};' + 'var v={},fs=engine.filters,hg=typeof data.get=="function",' + 'gv=function(n,ps){' + 'var p=ps[0],d=v[p];' + 'if(d==null){' + 'if(hg){return data.get(n);}' + 'd=data[p];' + '}' + 'for(var i=1,l=ps.length;i<l;i++)if(d!=null)d = d[ps[i]];' + 'return d;' + '},' + 'ts=function(s){' + 'if(typeof s==="string"){return s;}' + 'if(s==null){s="";}' + 'return ""+s;' + '};';

    function TargetCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*(\(\s*master\s*=\s*([a-z0-9\/_-]+)\s*\))?\s*/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.master = RegExp.$3;
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.blocks = {};
    }

    inherits(TargetCommand, Command);

    function BlockCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.cloneProps = ['name'];
    }

    inherits(BlockCommand, Command);

    function ImportCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'state',
            'blocks'
        ];
        this.blocks = {};
    }

    inherits(ImportCommand, Command);

    function VarCommand(value, engine) {
        if (!/^\s*([a-z0-9_]+)\s*=([\s\S]*)$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.expr = RegExp.$2;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'expr'
        ];
    }

    inherits(VarCommand, Command);

    function FilterCommand(value, engine) {
        if (!/^\s*([a-z0-9_-]+)\s*(\(([\s\S]*)\))?\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.args = RegExp.$3;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'args'
        ];
    }

    inherits(FilterCommand, Command);

    function UseCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*(\(([\s\S]*)\))?\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.args = RegExp.$3;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'args'
        ];
    }

    inherits(UseCommand, Command);

    function ForCommand(value, engine) {
        var rule = new RegExp(stringFormat('^\\s*({0}[\\s\\S]+{1})\\s+as\\s+{0}([0-9a-z_]+){1}\\s*(,\\s*{0}([0-9a-z_]+){1})?\\s*$', regexpLiteral(engine.options.variableOpen), regexpLiteral(engine.options.variableClose)), 'i');
        if (!rule.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.list = RegExp.$1;
        this.item = RegExp.$2;
        this.index = RegExp.$4;
        Command.call(this, value, engine);
        this.cloneProps = [
            'list',
            'item',
            'index'
        ];
    }

    inherits(ForCommand, Command);

    function IfCommand(value, engine) {
        Command.call(this, value, engine);
    }

    inherits(IfCommand, Command);

    function ElifCommand(value, engine) {
        IfCommand.call(this, value, engine);
    }

    inherits(ElifCommand, IfCommand);

    function ElseCommand(value, engine) {
        Command.call(this, value, engine);
    }

    inherits(ElseCommand, IfCommand);
    var TargetState = {
        READING: 1,
        READED: 2,
        APPLIED: 3,
        READY: 4
    };
    ImportCommand.prototype.applyMaster = TargetCommand.prototype.applyMaster = function (masterName) {
        if (this.state >= TargetState.APPLIED) {
            return 1;
        }
        var blocks = this.blocks;

        function replaceBlock(node) {
            var children = node.children;
            if (children instanceof Array) {
                for (var i = 0, len = children.length; i < len; i++) {
                    var child = children[i];
                    if (child instanceof BlockCommand && blocks[child.name]) {
                        child = children[i] = blocks[child.name];
                    }
                    replaceBlock(child);
                }
            }
        }

        var master = this.engine.targets[masterName];
        if (master && master.applyMaster(master.master)) {
            this.children = master.clone().children;
            replaceBlock(this);
            this.state = TargetState.APPLIED;
            return 1;
        }
    };
    TargetCommand.prototype.isReady = function () {
        if (this.state >= TargetState.READY) {
            return 1;
        }
        var engine = this.engine;
        var readyState = 1;

        function checkReadyState(node) {
            for (var i = 0, len = node.children.length; i < len; i++) {
                var child = node.children[i];
                if (child instanceof ImportCommand) {
                    var target = engine.targets[child.name];
                    readyState = readyState && target && target.isReady(engine);
                } else if (child instanceof Command) {
                    checkReadyState(child);
                }
            }
        }

        if (this.applyMaster(this.master)) {
            checkReadyState(this);
            readyState && (this.state = TargetState.READY);
            return readyState;
        }
    };
    TargetCommand.prototype.getRenderer = function () {
        if (this.renderer) {
            return this.renderer;
        }
        if (this.isReady()) {
            var realRenderer = new Function('data', 'engine', [
                RENDERER_BODY_START,
                RENDER_STRING_DECLATION,
                this.getRendererBody(),
                RENDER_STRING_RETURN
            ].join('\n'));
            var engine = this.engine;
            this.renderer = function (data) {
                return realRenderer(data, engine);
            };
            return this.renderer;
        }
        return null;
    };

    function addTargetToContext(target, context) {
        context.target = target;
        var engine = context.engine;
        var name = target.name;
        if (engine.targets[name]) {
            switch (engine.options.namingConflict) {
                case 'override':
                    engine.targets[name] = target;
                    context.targets.push(name);
                case 'ignore':
                    break;
                default:
                    throw new Error('Target exists: ' + name);
            }
        } else {
            engine.targets[name] = target;
            context.targets.push(name);
        }
    }

    TargetCommand.prototype.open = function (context) {
        autoCloseCommand(context);
        Command.prototype.open.call(this, context);
        this.state = TargetState.READING;
        addTargetToContext(this, context);
    };
    VarCommand.prototype.open = UseCommand.prototype.open = function (context) {
        context.stack.top().addChild(this);
    };
    BlockCommand.prototype.open = function (context) {
        Command.prototype.open.call(this, context);
        (context.imp || context.target).blocks[this.name] = this;
    };
    ElifCommand.prototype.open = function (context) {
        var elseCommand = new ElseCommand();
        elseCommand.open(context);
        var ifCommand = autoCloseCommand(context, IfCommand);
        ifCommand.addChild(this);
        context.stack.push(this);
    };
    ElseCommand.prototype.open = function (context) {
        var ifCommand = autoCloseCommand(context, IfCommand);
        ifCommand.addChild(this);
        context.stack.push(this);
    };
    ImportCommand.prototype.open = function (context) {
        this.parent = context.stack.top();
        this.target = context.target;
        Command.prototype.open.call(this, context);
        this.state = TargetState.READING;
        context.imp = this;
    };
    UseCommand.prototype.close = VarCommand.prototype.close = function () {
    };
    ImportCommand.prototype.close = function (context) {
        Command.prototype.close.call(this, context);
        this.state = TargetState.READED;
        context.imp = null;
    };
    TargetCommand.prototype.close = function (context) {
        Command.prototype.close.call(this, context);
        this.state = this.master ? TargetState.READED : TargetState.APPLIED;
        context.target = null;
    };
    ImportCommand.prototype.autoClose = function (context) {
        var parentChildren = this.parent.children;
        parentChildren.push.apply(parentChildren, this.children);
        this.children.length = 0;
        for (var key in this.blocks) {
            this.target.blocks[key] = this.blocks[key];
        }
        this.blocks = {};
        this.close(context);
    };
    UseCommand.prototype.beforeOpen = ImportCommand.prototype.beforeOpen = VarCommand.prototype.beforeOpen = ForCommand.prototype.beforeOpen = FilterCommand.prototype.beforeOpen = BlockCommand.prototype.beforeOpen = IfCommand.prototype.beforeOpen = TextNode.prototype.beforeAdd = function (context) {
        if (context.stack.bottom()) {
            return;
        }
        var target = new TargetCommand(generateGUID(), context.engine);
        target.open(context);
    };
    ImportCommand.prototype.getRendererBody = function () {
        this.applyMaster(this.name);
        return Command.prototype.getRendererBody.call(this);
    };
    UseCommand.prototype.getRendererBody = function () {
        return stringFormat('{0}engine.render({2},{{3}}){1}', RENDER_STRING_ADD_START, RENDER_STRING_ADD_END, stringLiteralize(this.name), compileVariable(this.args, this.engine).replace(/(^|,)\s*([a-z0-9_]+)\s*=/gi, function (match, start, argName) {
            return (start || '') + stringLiteralize(argName) + ':';
        }));
    };
    VarCommand.prototype.getRendererBody = function () {
        if (this.expr) {
            return stringFormat('v[{0}]={1};', stringLiteralize(this.name), compileVariable(this.expr, this.engine));
        }
        return '';
    };
    IfCommand.prototype.getRendererBody = function () {
        return stringFormat('if({0}){{1}}', compileVariable(this.value, this.engine), Command.prototype.getRendererBody.call(this));
    };
    ElseCommand.prototype.getRendererBody = function () {
        return stringFormat('}else{{0}', Command.prototype.getRendererBody.call(this));
    };
    ForCommand.prototype.getRendererBody = function () {
        return stringFormat('' + 'var {0}={1};' + 'if({0} instanceof Array)' + 'for (var {4}=0,{5}={0}.length;{4}<{5};{4}++){v[{2}]={4};v[{3}]={0}[{4}];{6}}' + 'else if(typeof {0}==="object")' + 'for(var {4} in {0}){v[{2}]={4};v[{3}]={0}[{4}];{6}}', generateGUID(), compileVariable(this.list, this.engine), stringLiteralize(this.index || generateGUID()), stringLiteralize(this.item), generateGUID(), generateGUID(), Command.prototype.getRendererBody.call(this));
    };
    FilterCommand.prototype.getRendererBody = function () {
        var args = this.args;
        return stringFormat('{2}fs[{5}]((function(){{0}{4}{1}})(){6}){3}', RENDER_STRING_DECLATION, RENDER_STRING_RETURN, RENDER_STRING_ADD_START, RENDER_STRING_ADD_END, Command.prototype.getRendererBody.call(this), stringLiteralize(this.name), args ? ',' + compileVariable(args, this.engine) : '');
    };
    var commandTypes = {};

    function addCommandType(name, Type) {
        commandTypes[name] = Type;
        Type.prototype.type = name;
    }

    addCommandType('target', TargetCommand);
    addCommandType('block', BlockCommand);
    addCommandType('import', ImportCommand);
    addCommandType('use', UseCommand);
    addCommandType('var', VarCommand);
    addCommandType('for', ForCommand);
    addCommandType('if', IfCommand);
    addCommandType('elif', ElifCommand);
    addCommandType('else', ElseCommand);
    addCommandType('filter', FilterCommand);

    function Engine(options) {
        this.options = {
            commandOpen: '<!--',
            commandClose: '-->',
            commandSyntax: /^\s*(\/)?([a-z]+)\s*(?::([\s\S]*))?$/,
            variableOpen: '${',
            variableClose: '}',
            defaultFilter: 'html'
        };
        this.config(options);
        this.targets = {};
        this.filters = extend({}, DEFAULT_FILTERS);
    }

    Engine.prototype.config = function (options) {
        extend(this.options, options);
    };
    Engine.prototype.compile = Engine.prototype.parse = function (source) {
        if (source) {
            var targetNames = parseSource(source, this);
            if (targetNames.length) {
                return this.targets[targetNames[0]].getRenderer();
            }
        }
        return new Function('return ""');
    };
    Engine.prototype.getRenderer = function (name) {
        var target = this.targets[name];
        if (target) {
            return target.getRenderer();
        }
    };
    Engine.prototype.render = function (name, data) {
        var renderer = this.getRenderer(name);
        if (renderer) {
            return renderer(data);
        }
        return '';
    };
    Engine.prototype.addFilter = function (name, filter) {
        if (typeof filter === 'function') {
            this.filters[name] = filter;
        }
    };

    function parseSource(source, engine) {
        var commandOpen = engine.options.commandOpen;
        var commandClose = engine.options.commandClose;
        var commandSyntax = engine.options.commandSyntax;
        var stack = new Stack();
        var analyseContext = {
            engine: engine,
            targets: [],
            stack: stack,
            target: null
        };
        var textBuf = [];

        function flushTextBuf() {
            var text;
            if (textBuf.length > 0 && (text = textBuf.join(''))) {
                var textNode = new TextNode(text, engine);
                textNode.beforeAdd(analyseContext);
                stack.top().addChild(textNode);
                textBuf = [];
                if (engine.options.strip && analyseContext.current instanceof Command) {
                    textNode.value = text.replace(/^[\x20\t\r]*\n/, '');
                }
                analyseContext.current = textNode;
            }
        }

        var NodeType;
        parseTextBlock(source, commandOpen, commandClose, 0, function (text) {
            var match = commandSyntax.exec(text);
            if (match && (NodeType = commandTypes[match[2].toLowerCase()]) && typeof NodeType === 'function') {
                flushTextBuf();
                var currentNode = analyseContext.current;
                if (engine.options.strip && currentNode instanceof TextNode) {
                    currentNode.value = currentNode.value.replace(/\r?\n[\x20\t]*$/, '\n');
                }
                if (match[1]) {
                    currentNode = autoCloseCommand(analyseContext, NodeType);
                } else {
                    currentNode = new NodeType(match[3], engine);
                    if (typeof currentNode.beforeOpen === 'function') {
                        currentNode.beforeOpen(analyseContext);
                    }
                    currentNode.open(analyseContext);
                }
                analyseContext.current = currentNode;
            } else if (!/^\s*\/\//.test(text)) {
                textBuf.push(commandOpen, text, commandClose);
            }
            NodeType = null;
        }, function (text) {
            textBuf.push(text);
        });
        flushTextBuf();
        autoCloseCommand(analyseContext);
        return analyseContext.targets;
    }

    var etpl = new Engine();
    etpl.Engine = Engine;
    if (typeof exports === 'object' && typeof module === 'object') {
        exports = module.exports = etpl;
    } else if (typeof define === 'function' && define.amd) {
        define('etpl/main', [], etpl);
    } else {
        root.etpl = etpl;
    }
}(this));


define('isMobile/isMobile', [], function () {
    var apple_phone = /iPhone/i, apple_ipod = /iPod/i, apple_tablet = /iPad/i,
        android_phone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, android_tablet = /Android/i, windows_phone = /IEMobile/i,
        windows_tablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, other_blackberry = /BlackBerry/i,
        other_blackberry_10 = /BB10/i, other_opera = /Opera Mini/i,
        other_firefox = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i,
        seven_inch = new RegExp('(?:' + 'Nexus 7' + '|' + 'BNTV250' + '|' + 'Kindle Fire' + '|' + 'Silk' + '|' + 'GT-P1000' + ')', 'i');
    var match = function (regex, userAgent) {
        return regex.test(userAgent);
    };
    var IsMobileClass = function (userAgent) {
        var ua = userAgent || navigator.userAgent;
        this.apple = {
            phone: match(apple_phone, ua),
            ipod: match(apple_ipod, ua),
            tablet: match(apple_tablet, ua),
            device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
        };
        this.android = {
            phone: match(android_phone, ua),
            tablet: !match(android_phone, ua) && match(android_tablet, ua),
            device: match(android_phone, ua) || match(android_tablet, ua)
        };
        this.windows = {
            phone: match(windows_phone, ua),
            tablet: match(windows_tablet, ua),
            device: match(windows_phone, ua) || match(windows_tablet, ua)
        };
        this.other = {
            blackberry: match(other_blackberry, ua),
            blackberry10: match(other_blackberry_10, ua),
            opera: match(other_opera, ua),
            firefox: match(other_firefox, ua),
            device: match(other_blackberry, ua) || match(other_blackberry_10, ua) || match(other_opera, ua) || match(other_firefox, ua)
        };
        this.seven_inch = match(seven_inch, ua);
        this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;
        this.phone = this.apple.phone || this.android.phone || this.windows.phone;
        this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;
        if (typeof window === 'undefined') {
            return this;
        }
    };
    var instantiate = function () {
        var IM = new IsMobileClass();
        IM.Class = IsMobileClass;
        return IM;
    };
    return instantiate();
});

define('isMobile', ['isMobile/isMobile'], function (main) {
    return main;
});

define('underscore/underscore', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    (function () {
        var root = this;
        var previousUnderscore = root._;
        var breaker = {};
        var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
        var push = ArrayProto.push, slice = ArrayProto.slice, concat = ArrayProto.concat, toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty;
        var nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;
        var _ = function (obj) {
            if (obj instanceof _)
                return obj;
            if (!(this instanceof _))
                return new _(obj);
            this._wrapped = obj;
        };
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = _;
            }
            exports._ = _;
        } else {
            root._ = _;
        }
        _.VERSION = '1.6.0';
        var createCallback = function (func, context, argCount) {
            if (context === void 0)
                return func;
            switch (argCount == null ? 3 : argCount) {
                case 1:
                    return function (value) {
                        return func.call(context, value);
                    };
                case 2:
                    return function (value, other) {
                        return func.call(context, value, other);
                    };
                case 3:
                    return function (value, index, collection) {
                        return func.call(context, value, index, collection);
                    };
                case 4:
                    return function (accumulator, value, index, collection) {
                        return func.call(context, accumulator, value, index, collection);
                    };
            }
            return function () {
                return func.apply(context, arguments);
            };
        };
        var lookupIterator = function (value, context, argCount) {
            if (value == null)
                return _.identity;
            if (_.isFunction(value))
                return createCallback(value, context, argCount);
            if (_.isObject(value))
                return _.matches(value);
            return _.property(value);
        };
        _.each = _.forEach = function (obj, iterator, context) {
            var i, length;
            if (obj == null)
                return obj;
            iterator = createCallback(iterator, context);
            if (obj.length === +obj.length) {
                for (i = 0, length = obj.length; i < length; i++) {
                    if (iterator(obj[i], i, obj) === breaker)
                        break;
                }
            } else {
                var keys = _.keys(obj);
                for (i = 0, length = keys.length; i < length; i++) {
                    if (iterator(obj[keys[i]], keys[i], obj) === breaker)
                        break;
                }
            }
            return obj;
        };
        _.map = _.collect = function (obj, iterator, context) {
            var results = [];
            if (obj == null)
                return results;
            iterator = lookupIterator(iterator, context);
            _.each(obj, function (value, index, list) {
                results.push(iterator(value, index, list));
            });
            return results;
        };
        var reduceError = 'Reduce of empty array with no initial value';
        _.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null)
                obj = [];
            iterator = createCallback(iterator, context, 4);
            _.each(obj, function (value, index, list) {
                if (!initial) {
                    memo = value;
                    initial = true;
                } else {
                    memo = iterator(memo, value, index, list);
                }
            });
            if (!initial)
                throw TypeError(reduceError);
            return memo;
        };
        _.reduceRight = _.foldr = function (obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null)
                obj = [];
            var length = obj.length;
            iterator = createCallback(iterator, context, 4);
            if (length !== +length) {
                var keys = _.keys(obj);
                length = keys.length;
            }
            _.each(obj, function (value, index, list) {
                index = keys ? keys[--length] : --length;
                if (!initial) {
                    memo = obj[index];
                    initial = true;
                } else {
                    memo = iterator(memo, obj[index], index, list);
                }
            });
            if (!initial)
                throw TypeError(reduceError);
            return memo;
        };
        _.find = _.detect = function (obj, predicate, context) {
            var result;
            predicate = lookupIterator(predicate, context);
            _.some(obj, function (value, index, list) {
                if (predicate(value, index, list)) {
                    result = value;
                    return true;
                }
            });
            return result;
        };
        _.filter = _.select = function (obj, predicate, context) {
            var results = [];
            if (obj == null)
                return results;
            predicate = lookupIterator(predicate, context);
            _.each(obj, function (value, index, list) {
                if (predicate(value, index, list))
                    results.push(value);
            });
            return results;
        };
        _.reject = function (obj, predicate, context) {
            return _.filter(obj, _.negate(lookupIterator(predicate)), context);
        };
        _.every = _.all = function (obj, predicate, context) {
            var result = true;
            if (obj == null)
                return result;
            predicate = lookupIterator(predicate, context);
            _.each(obj, function (value, index, list) {
                result = predicate(value, index, list);
                if (!result)
                    return breaker;
            });
            return !!result;
        };
        _.some = _.any = function (obj, predicate, context) {
            var result = false;
            if (obj == null)
                return result;
            predicate = lookupIterator(predicate, context);
            _.each(obj, function (value, index, list) {
                result = predicate(value, index, list);
                if (result)
                    return breaker;
            });
            return !!result;
        };
        _.contains = _.include = function (obj, target) {
            if (obj == null)
                return false;
            if (obj.length === +obj.length)
                return _.indexOf(obj, target) >= 0;
            return _.some(obj, function (value) {
                return value === target;
            });
        };
        _.invoke = function (obj, method) {
            var args = slice.call(arguments, 2);
            var isFunc = _.isFunction(method);
            return _.map(obj, function (value) {
                return (isFunc ? method : value[method]).apply(value, args);
            });
        };
        _.pluck = function (obj, key) {
            return _.map(obj, _.property(key));
        };
        _.where = function (obj, attrs) {
            return _.filter(obj, _.matches(attrs));
        };
        _.findWhere = function (obj, attrs) {
            return _.find(obj, _.matches(attrs));
        };
        _.max = function (obj, iterator, context) {
            var result = -Infinity, lastComputed = -Infinity, value, computed;
            if (!iterator && _.isArray(obj)) {
                for (var i = 0, length = obj.length; i < length; i++) {
                    value = obj[i];
                    if (value > result) {
                        result = value;
                    }
                }
            } else {
                iterator = lookupIterator(iterator, context);
                _.each(obj, function (value, index, list) {
                    computed = iterator(value, index, list);
                    if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                        result = value;
                        lastComputed = computed;
                    }
                });
            }
            return result;
        };
        _.min = function (obj, iterator, context) {
            var result = Infinity, lastComputed = Infinity, value, computed;
            if (!iterator && _.isArray(obj)) {
                for (var i = 0, length = obj.length; i < length; i++) {
                    value = obj[i];
                    if (value < result) {
                        result = value;
                    }
                }
            } else {
                iterator = lookupIterator(iterator, context);
                _.each(obj, function (value, index, list) {
                    computed = iterator(value, index, list);
                    if (computed < lastComputed || computed === Infinity && result === Infinity) {
                        result = value;
                        lastComputed = computed;
                    }
                });
            }
            return result;
        };
        _.shuffle = function (obj) {
            var rand;
            var index = 0;
            var shuffled = [];
            _.each(obj, function (value) {
                rand = _.random(index++);
                shuffled[index - 1] = shuffled[rand];
                shuffled[rand] = value;
            });
            return shuffled;
        };
        _.sample = function (obj, n, guard) {
            if (n == null || guard) {
                if (obj.length !== +obj.length)
                    obj = _.values(obj);
                return obj[_.random(obj.length - 1)];
            }
            return _.shuffle(obj).slice(0, Math.max(0, n));
        };
        _.sortBy = function (obj, iterator, context) {
            iterator = lookupIterator(iterator, context);
            return _.pluck(_.map(obj, function (value, index, list) {
                return {
                    value: value,
                    index: index,
                    criteria: iterator(value, index, list)
                };
            }).sort(function (left, right) {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0)
                        return 1;
                    if (a < b || b === void 0)
                        return -1;
                }
                return left.index - right.index;
            }), 'value');
        };
        var group = function (behavior) {
            return function (obj, iterator, context) {
                var result = {};
                iterator = lookupIterator(iterator, context);
                _.each(obj, function (value, index) {
                    var key = iterator(value, index, obj);
                    behavior(result, value, key);
                });
                return result;
            };
        };
        _.groupBy = group(function (result, value, key) {
            if (_.has(result, key))
                result[key].push(value);
            else
                result[key] = [value];
        });
        _.indexBy = group(function (result, value, key) {
            result[key] = value;
        });
        _.countBy = group(function (result, value, key) {
            if (_.has(result, key))
                result[key]++;
            else
                result[key] = 1;
        });
        _.sortedIndex = function (array, obj, iterator, context) {
            iterator = lookupIterator(iterator, context, 1);
            var value = iterator(obj);
            var low = 0, high = array.length;
            while (low < high) {
                var mid = low + high >>> 1;
                if (iterator(array[mid]) < value)
                    low = mid + 1;
                else
                    high = mid;
            }
            return low;
        };
        _.toArray = function (obj) {
            if (!obj)
                return [];
            if (_.isArray(obj))
                return slice.call(obj);
            if (obj.length === +obj.length)
                return _.map(obj, _.identity);
            return _.values(obj);
        };
        _.size = function (obj) {
            if (obj == null)
                return 0;
            return obj.length === +obj.length ? obj.length : _.keys(obj).length;
        };
        _.partition = function (obj, predicate, context) {
            predicate = lookupIterator(predicate, context);
            var pass = [], fail = [];
            _.each(obj, function (value, key, obj) {
                (predicate(value, key, obj) ? pass : fail).push(value);
            });
            return [
                pass,
                fail
            ];
        };
        _.first = _.head = _.take = function (array, n, guard) {
            if (array == null)
                return void 0;
            if (n == null || guard)
                return array[0];
            if (n < 0)
                return [];
            return slice.call(array, 0, n);
        };
        _.initial = function (array, n, guard) {
            return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
        };
        _.last = function (array, n, guard) {
            if (array == null)
                return void 0;
            if (n == null || guard)
                return array[array.length - 1];
            return slice.call(array, Math.max(array.length - n, 0));
        };
        _.rest = _.tail = _.drop = function (array, n, guard) {
            return slice.call(array, n == null || guard ? 1 : n);
        };
        _.compact = function (array) {
            return _.filter(array, _.identity);
        };
        var flatten = function (input, shallow, strict, output) {
            if (shallow && _.every(input, _.isArray)) {
                return concat.apply(output, input);
            }
            for (var i = 0, length = input.length; i < length; i++) {
                var value = input[i];
                if (!_.isArray(value) && !_.isArguments(value)) {
                    if (!strict)
                        output.push(value);
                } else if (shallow) {
                    push.apply(output, value);
                } else {
                    flatten(value, shallow, strict, output);
                }
            }
            return output;
        };
        _.flatten = function (array, shallow) {
            return flatten(array, shallow, false, []);
        };
        _.without = function (array) {
            return _.difference(array, slice.call(arguments, 1));
        };
        _.uniq = _.unique = function (array, isSorted, iterator, context) {
            if (array == null)
                return [];
            if (_.isFunction(isSorted)) {
                context = iterator;
                iterator = isSorted;
                isSorted = false;
            }
            if (iterator)
                iterator = lookupIterator(iterator, context);
            var result = [];
            var seen = [];
            for (var i = 0, length = array.length; i < length; i++) {
                var value = array[i];
                if (iterator)
                    value = iterator(value, i, array);
                if (isSorted ? !i || seen !== value : !_.contains(seen, value)) {
                    if (isSorted)
                        seen = value;
                    else
                        seen.push(value);
                    result.push(array[i]);
                }
            }
            return result;
        };
        _.union = function () {
            return _.uniq(flatten(arguments, true, true, []));
        };
        _.intersection = function (array) {
            if (array == null)
                return [];
            var result = [];
            var argsLength = arguments.length;
            for (var i = 0, length = array.length; i < length; i++) {
                var item = array[i];
                if (_.contains(result, item))
                    continue;
                for (var j = 1; j < argsLength; j++) {
                    if (!_.contains(arguments[j], item))
                        break;
                }
                if (j === argsLength)
                    result.push(item);
            }
            return result;
        };
        _.difference = function (array) {
            var rest = flatten(slice.call(arguments, 1), true, true, []);
            return _.filter(array, function (value) {
                return !_.contains(rest, value);
            });
        };
        _.zip = function (array) {
            if (array == null)
                return [];
            var length = _.max(arguments, 'length').length;
            var results = Array(length);
            for (var i = 0; i < length; i++) {
                results[i] = _.pluck(arguments, i);
            }
            return results;
        };
        _.object = function (list, values) {
            if (list == null)
                return {};
            var result = {};
            for (var i = 0, length = list.length; i < length; i++) {
                if (values) {
                    result[list[i]] = values[i];
                } else {
                    result[list[i][0]] = list[i][1];
                }
            }
            return result;
        };
        _.indexOf = function (array, item, isSorted) {
            if (array == null)
                return -1;
            var i = 0, length = array.length;
            if (isSorted) {
                if (typeof isSorted == 'number') {
                    i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
                } else {
                    i = _.sortedIndex(array, item);
                    return array[i] === item ? i : -1;
                }
            }
            for (; i < length; i++)
                if (array[i] === item)
                    return i;
            return -1;
        };
        _.lastIndexOf = function (array, item, from) {
            if (array == null)
                return -1;
            var i = from == null ? array.length : from;
            while (i--)
                if (array[i] === item)
                    return i;
            return -1;
        };
        _.range = function (start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;
            var length = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = Array(length);
            while (idx < length) {
                range[idx++] = start;
                start += step;
            }
            return range;
        };
        var Ctor = function () {
        };
        _.bind = function (func, context) {
            var args, bound;
            if (nativeBind && func.bind === nativeBind)
                return nativeBind.apply(func, slice.call(arguments, 1));
            if (!_.isFunction(func))
                throw TypeError('Bind must be called on a function');
            args = slice.call(arguments, 2);
            bound = function () {
                if (!(this instanceof bound))
                    return func.apply(context, args.concat(slice.call(arguments)));
                Ctor.prototype = func.prototype;
                var self = new Ctor();
                Ctor.prototype = null;
                var result = func.apply(self, args.concat(slice.call(arguments)));
                if (Object(result) === result)
                    return result;
                return self;
            };
            return bound;
        };
        _.partial = function (func) {
            var boundArgs = slice.call(arguments, 1);
            return function () {
                var position = 0;
                var args = boundArgs.slice();
                for (var i = 0, length = args.length; i < length; i++) {
                    if (args[i] === _)
                        args[i] = arguments[position++];
                }
                while (position < arguments.length)
                    args.push(arguments[position++]);
                return func.apply(this, args);
            };
        };
        _.bindAll = function (obj) {
            var i = 1, length = arguments.length, key;
            if (length <= 1)
                throw Error('bindAll must be passed function names');
            for (; i < length; i++) {
                key = arguments[i];
                obj[key] = createCallback(obj[key], obj, Infinity);
            }
            return obj;
        };
        _.memoize = function (func, hasher) {
            var memoize = function (key) {
                var cache = memoize.cache;
                var address = hasher ? hasher.apply(this, arguments) : key;
                if (!_.has(cache, address))
                    cache[address] = func.apply(this, arguments);
                return cache[key];
            };
            memoize.cache = {};
            return memoize;
        };
        _.delay = function (func, wait) {
            var args = slice.call(arguments, 2);
            return setTimeout(function () {
                return func.apply(null, args);
            }, wait);
        };
        _.defer = function (func) {
            return _.delay.apply(_, [
                func,
                1
            ].concat(slice.call(arguments, 1)));
        };
        _.throttle = function (func, wait, options) {
            var context, args, result;
            var timeout = null;
            var previous = 0;
            if (!options)
                options = {};
            var later = function () {
                previous = options.leading === false ? 0 : _.now();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout)
                    context = args = null;
            };
            return function () {
                var now = _.now();
                if (!previous && options.leading === false)
                    previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout)
                        context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        };
        _.debounce = function (func, wait, immediate) {
            var timeout, args, context, timestamp, result;
            var later = function () {
                var last = _.now() - timestamp;
                if (last < wait && last > 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                        if (!timeout)
                            context = args = null;
                    }
                }
            };
            return function () {
                context = this;
                args = arguments;
                timestamp = _.now();
                var callNow = immediate && !timeout;
                if (!timeout)
                    timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                    context = args = null;
                }
                return result;
            };
        };
        _.once = function (func) {
            var ran = false, memo;
            return function () {
                if (ran)
                    return memo;
                ran = true;
                memo = func.apply(this, arguments);
                func = null;
                return memo;
            };
        };
        _.wrap = function (func, wrapper) {
            return _.partial(wrapper, func);
        };
        _.negate = function (predicate) {
            return function () {
                return !predicate.apply(this, arguments);
            };
        };
        _.compose = function () {
            var funcs = arguments;
            return function () {
                var args = arguments;
                for (var i = funcs.length - 1; i >= 0; i--) {
                    args = [funcs[i].apply(this, args)];
                }
                return args[0];
            };
        };
        _.after = function (times, func) {
            return function () {
                if (--times < 1) {
                    return func.apply(this, arguments);
                }
            };
        };
        _.keys = function (obj) {
            if (!_.isObject(obj))
                return [];
            if (nativeKeys)
                return nativeKeys(obj);
            var keys = [];
            for (var key in obj)
                if (_.has(obj, key))
                    keys.push(key);
            return keys;
        };
        _.values = function (obj) {
            var keys = _.keys(obj);
            var length = keys.length;
            var values = Array(length);
            for (var i = 0; i < length; i++) {
                values[i] = obj[keys[i]];
            }
            return values;
        };
        _.pairs = function (obj) {
            var keys = _.keys(obj);
            var length = keys.length;
            var pairs = Array(length);
            for (var i = 0; i < length; i++) {
                pairs[i] = [
                    keys[i],
                    obj[keys[i]]
                ];
            }
            return pairs;
        };
        _.invert = function (obj) {
            var result = {};
            var keys = _.keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                result[obj[keys[i]]] = keys[i];
            }
            return result;
        };
        _.functions = _.methods = function (obj) {
            var names = [];
            for (var key in obj) {
                if (_.isFunction(obj[key]))
                    names.push(key);
            }
            return names.sort();
        };
        _.extend = function (obj) {
            if (!_.isObject(obj))
                return obj;
            var source, prop;
            for (var i = 1, length = arguments.length; i < length; i++) {
                source = arguments[i];
                for (prop in source) {
                    obj[prop] = source[prop];
                }
            }
            return obj;
        };
        _.pick = function (obj, iterator, context) {
            var result = {}, key;
            if (_.isFunction(iterator)) {
                for (key in obj) {
                    var value = obj[key];
                    if (iterator.call(context, value, key, obj))
                        result[key] = value;
                }
            } else {
                var keys = concat.apply([], slice.call(arguments, 1));
                for (var i = 0, length = keys.length; i < length; i++) {
                    key = keys[i];
                    if (key in obj)
                        result[key] = obj[key];
                }
            }
            return result;
        };
        _.omit = function (obj, iterator, context) {
            if (_.isFunction(iterator)) {
                iterator = _.negate(iterator);
            } else {
                var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
                iterator = function (value, key) {
                    return !_.contains(keys, key);
                };
            }
            return _.pick(obj, iterator, context);
        };
        _.defaults = function (obj) {
            if (!_.isObject(obj))
                return obj;
            for (var i = 1, length = arguments.length; i < length; i++) {
                var source = arguments[i];
                for (var prop in source) {
                    if (obj[prop] === void 0)
                        obj[prop] = source[prop];
                }
            }
            return obj;
        };
        _.clone = function (obj) {
            if (!_.isObject(obj))
                return obj;
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };
        _.tap = function (obj, interceptor) {
            interceptor(obj);
            return obj;
        };
        var eq = function (a, b, aStack, bStack) {
            if (a === b)
                return a !== 0 || 1 / a === 1 / b;
            if (a == null || b == null)
                return a === b;
            if (a instanceof _)
                a = a._wrapped;
            if (b instanceof _)
                b = b._wrapped;
            var className = toString.call(a);
            if (className !== toString.call(b))
                return false;
            switch (className) {
                case '[object RegExp]':
                case '[object String]':
                    return '' + a === '' + b;
                case '[object Number]':
                    if (a != +a)
                        return b != +b;
                    return a == 0 ? 1 / a == 1 / b : a == +b;
                case '[object Date]':
                case '[object Boolean]':
                    return +a === +b;
            }
            if (typeof a != 'object' || typeof b != 'object')
                return false;
            var length = aStack.length;
            while (length--) {
                if (aStack[length] === a)
                    return bStack[length] === b;
            }
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && 'constructor' in a && 'constructor' in b && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)) {
                return false;
            }
            aStack.push(a);
            bStack.push(b);
            var size, result;
            if (className === '[object Array]') {
                size = a.length;
                result = size === b.length;
                if (result) {
                    while (size--) {
                        if (!(result = eq(a[size], b[size], aStack, bStack)))
                            break;
                    }
                }
            } else {
                var keys = _.keys(a), key;
                size = keys.length;
                result = _.keys(b).length == size;
                if (result) {
                    while (size--) {
                        key = keys[size];
                        if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack)))
                            break;
                    }
                }
            }
            aStack.pop();
            bStack.pop();
            return result;
        };
        _.isEqual = function (a, b) {
            return eq(a, b, [], []);
        };
        _.isEmpty = function (obj) {
            if (obj == null)
                return true;
            if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))
                return obj.length === 0;
            for (var key in obj)
                if (_.has(obj, key))
                    return false;
            return true;
        };
        _.isElement = function (obj) {
            return !!(obj && obj.nodeType === 1);
        };
        _.isArray = nativeIsArray || function (obj) {
            return toString.call(obj) === '[object Array]';
        };
        _.isObject = function (obj) {
            return obj === Object(obj);
        };
        _.each([
            'Arguments',
            'Function',
            'String',
            'Number',
            'Date',
            'RegExp'
        ], function (name) {
            _['is' + name] = function (obj) {
                return toString.call(obj) === '[object ' + name + ']';
            };
        });
        if (!_.isArguments(arguments)) {
            _.isArguments = function (obj) {
                return _.has(obj, 'callee');
            };
        }
        if (typeof /./ !== 'function') {
            _.isFunction = function (obj) {
                return typeof obj === 'function';
            };
        }
        _.isFinite = function (obj) {
            return isFinite(obj) && !isNaN(parseFloat(obj));
        };
        _.isNaN = function (obj) {
            return _.isNumber(obj) && obj !== +obj;
        };
        _.isBoolean = function (obj) {
            return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
        };
        _.isNull = function (obj) {
            return obj === null;
        };
        _.isUndefined = function (obj) {
            return obj === void 0;
        };
        _.has = function (obj, key) {
            return obj != null && hasOwnProperty.call(obj, key);
        };
        _.noConflict = function () {
            root._ = previousUnderscore;
            return this;
        };
        _.identity = function (value) {
            return value;
        };
        _.constant = function (value) {
            return function () {
                return value;
            };
        };
        _.noop = function () {
        };
        _.property = function (key) {
            return function (obj) {
                return obj[key];
            };
        };
        _.matches = function (attrs) {
            return function (obj) {
                if (obj == null)
                    return _.isEmpty(attrs);
                if (obj === attrs)
                    return true;
                for (var key in attrs)
                    if (attrs[key] !== obj[key])
                        return false;
                return true;
            };
        };
        _.times = function (n, iterator, context) {
            var accum = Array(Math.max(0, n));
            iterator = createCallback(iterator, context, 1);
            for (var i = 0; i < n; i++)
                accum[i] = iterator(i);
            return accum;
        };
        _.random = function (min, max) {
            if (max == null) {
                max = min;
                min = 0;
            }
            return min + Math.floor(Math.random() * (max - min + 1));
        };
        _.now = Date.now || function () {
            return new Date().getTime();
        };
        var entityMap = {
            escape: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#x27;'
            }
        };
        entityMap.unescape = _.invert(entityMap.escape);
        var entityRegexes = {
            escape: RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
            unescape: RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
        };
        _.each([
            'escape',
            'unescape'
        ], function (method) {
            _[method] = function (string) {
                if (string == null)
                    return '';
                return ('' + string).replace(entityRegexes[method], function (match) {
                    return entityMap[method][match];
                });
            };
        });
        _.result = function (object, property) {
            if (object == null)
                return void 0;
            var value = object[property];
            return _.isFunction(value) ? object[property]() : value;
        };
        var idCounter = 0;
        _.uniqueId = function (prefix) {
            var id = ++idCounter + '';
            return prefix ? prefix + id : id;
        };
        _.templateSettings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g,
            escape: /<%-([\s\S]+?)%>/g
        };
        var noMatch = /(.)^/;
        var escapes = {
            '\'': '\'',
            '\\': '\\',
            '\r': 'r',
            '\n': 'n',
            '\u2028': 'u2028',
            '\u2029': 'u2029'
        };
        var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
        var escapeChar = function (match) {
            return '\\' + escapes[match];
        };
        _.template = function (text, data, settings) {
            settings = _.defaults({}, settings, _.templateSettings);
            var matcher = RegExp([
                (settings.escape || noMatch).source,
                (settings.interpolate || noMatch).source,
                (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');
            var index = 0;
            var source = '__p+=\'';
            text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
                source += text.slice(index, offset).replace(escaper, escapeChar);
                index = offset + match.length;
                if (escape) {
                    source += '\'+\n((__t=(' + escape + '))==null?\'\':_.escape(__t))+\n\'';
                } else if (interpolate) {
                    source += '\'+\n((__t=(' + interpolate + '))==null?\'\':__t)+\n\'';
                } else if (evaluate) {
                    source += '\';\n' + evaluate + '\n__p+=\'';
                }
                return match;
            });
            source += '\';\n';
            if (!settings.variable)
                source = 'with(obj||{}){\n' + source + '}\n';
            source = 'var __t,__p=\'\',__j=Array.prototype.join,' + 'print=function(){__p+=__j.call(arguments,\'\');};\n' + source + 'return __p;\n';
            try {
                var render = Function(settings.variable || 'obj', '_', source);
            } catch (e) {
                e.source = source;
                throw e;
            }
            if (data)
                return render(data, _);
            var template = function (data) {
                return render.call(this, data, _);
            };
            var argument = settings.variable || 'obj';
            template.source = 'function(' + argument + '){\n' + source + '}';
            return template;
        };
        _.chain = function (obj) {
            var instance = _(obj);
            instance._chain = true;
            return instance;
        };
        var result = function (obj) {
            return this._chain ? _(obj).chain() : obj;
        };
        _.mixin = function (obj) {
            _.each(_.functions(obj), function (name) {
                var func = _[name] = obj[name];
                _.prototype[name] = function () {
                    var args = [this._wrapped];
                    push.apply(args, arguments);
                    return result.call(this, func.apply(_, args));
                };
            });
        };
        _.mixin(_);
        _.each([
            'pop',
            'push',
            'reverse',
            'shift',
            'sort',
            'splice',
            'unshift'
        ], function (name) {
            var method = ArrayProto[name];
            _.prototype[name] = function () {
                var obj = this._wrapped;
                method.apply(obj, arguments);
                if ((name === 'shift' || name === 'splice') && obj.length === 0)
                    delete obj[0];
                return result.call(this, obj);
            };
        });
        _.each([
            'concat',
            'join',
            'slice'
        ], function (name) {
            var method = ArrayProto[name];
            _.prototype[name] = function () {
                return result.call(this, method.apply(this._wrapped, arguments));
            };
        });
        _.prototype.value = function () {
            return this._wrapped;
        };
    }.call(this));
});

define('underscore', ['underscore/underscore'], function (main) {
    return main;
});

define('urijs/punycode', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72,
        initialN = 128, delimiter = '-', regexPunycode = /^xn--/, regexNonASCII = /[^ -~]/,
        regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, errors = {
            'overflow': 'Overflow: input needs wider integers to process',
            'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
            'invalid-input': 'Invalid input'
        }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;

    function error(type) {
        throw RangeError(errors[type]);
    }

    function map(array, fn) {
        var length = array.length;
        while (length--) {
            array[length] = fn(array[length]);
        }
        return array;
    }

    function mapDomain(string, fn) {
        return map(string.split(regexSeparators), fn).join('.');
    }

    function ucs2decode(string) {
        var output = [], counter = 0, length = string.length, value, extra;
        while (counter < length) {
            value = string.charCodeAt(counter++);
            if (value >= 55296 && value <= 56319 && counter < length) {
                extra = string.charCodeAt(counter++);
                if ((extra & 64512) == 56320) {
                    output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
                } else {
                    output.push(value);
                    counter--;
                }
            } else {
                output.push(value);
            }
        }
        return output;
    }

    function ucs2encode(array) {
        return map(array, function (value) {
            var output = '';
            if (value > 65535) {
                value -= 65536;
                output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                value = 56320 | value & 1023;
            }
            output += stringFromCharCode(value);
            return output;
        }).join('');
    }

    function basicToDigit(codePoint) {
        if (codePoint - 48 < 10) {
            return codePoint - 22;
        }
        if (codePoint - 65 < 26) {
            return codePoint - 65;
        }
        if (codePoint - 97 < 26) {
            return codePoint - 97;
        }
        return base;
    }

    function digitToBasic(digit, flag) {
        return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    }

    function adapt(delta, numPoints, firstTime) {
        var k = 0;
        delta = firstTime ? floor(delta / damp) : delta >> 1;
        delta += floor(delta / numPoints);
        for (; delta > baseMinusTMin * tMax >> 1; k += base) {
            delta = floor(delta / baseMinusTMin);
        }
        return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    }

    function decode(input) {
        var output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index,
            oldi, w, k, digit, t, length, baseMinusT;
        basic = input.lastIndexOf(delimiter);
        if (basic < 0) {
            basic = 0;
        }
        for (j = 0; j < basic; ++j) {
            if (input.charCodeAt(j) >= 128) {
                error('not-basic');
            }
            output.push(input.charCodeAt(j));
        }
        for (index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
            for (oldi = i, w = 1, k = base; ; k += base) {
                if (index >= inputLength) {
                    error('invalid-input');
                }
                digit = basicToDigit(input.charCodeAt(index++));
                if (digit >= base || digit > floor((maxInt - i) / w)) {
                    error('overflow');
                }
                i += digit * w;
                t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                if (digit < t) {
                    break;
                }
                baseMinusT = base - t;
                if (w > floor(maxInt / baseMinusT)) {
                    error('overflow');
                }
                w *= baseMinusT;
            }
            out = output.length + 1;
            bias = adapt(i - oldi, out, oldi == 0);
            if (floor(i / out) > maxInt - n) {
                error('overflow');
            }
            n += floor(i / out);
            i %= out;
            output.splice(i++, 0, n);
        }
        return ucs2encode(output);
    }

    function encode(input) {
        var n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength,
            handledCPCountPlusOne, baseMinusT, qMinusT;
        input = ucs2decode(input);
        inputLength = input.length;
        n = initialN;
        delta = 0;
        bias = initialBias;
        for (j = 0; j < inputLength; ++j) {
            currentValue = input[j];
            if (currentValue < 128) {
                output.push(stringFromCharCode(currentValue));
            }
        }
        handledCPCount = basicLength = output.length;
        if (basicLength) {
            output.push(delimiter);
        }
        while (handledCPCount < inputLength) {
            for (m = maxInt, j = 0; j < inputLength; ++j) {
                currentValue = input[j];
                if (currentValue >= n && currentValue < m) {
                    m = currentValue;
                }
            }
            handledCPCountPlusOne = handledCPCount + 1;
            if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                error('overflow');
            }
            delta += (m - n) * handledCPCountPlusOne;
            n = m;
            for (j = 0; j < inputLength; ++j) {
                currentValue = input[j];
                if (currentValue < n && ++delta > maxInt) {
                    error('overflow');
                }
                if (currentValue == n) {
                    for (q = delta, k = base; ; k += base) {
                        t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                        if (q < t) {
                            break;
                        }
                        qMinusT = q - t;
                        baseMinusT = base - t;
                        output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                        q = floor(qMinusT / baseMinusT);
                    }
                    output.push(stringFromCharCode(digitToBasic(q, 0)));
                    bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                    delta = 0;
                    ++handledCPCount;
                }
            }
            ++delta;
            ++n;
        }
        return output.join('');
    }

    function toUnicode(domain) {
        return mapDomain(domain, function (string) {
            return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
        });
    }

    function toASCII(domain) {
        return mapDomain(domain, function (string) {
            return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
        });
    }

    punycode = {
        'version': '1.2.3',
        'ucs2': {
            'decode': ucs2decode,
            'encode': ucs2encode
        },
        'decode': decode,
        'encode': encode,
        'toASCII': toASCII,
        'toUnicode': toUnicode
    };
    return punycode;
});

define('urijs/IPv6', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    function best(address) {
        var _address = address.toLowerCase();
        var segments = _address.split(':');
        var length = segments.length;
        var total = 8;
        if (segments[0] === '' && segments[1] === '' && segments[2] === '') {
            segments.shift();
            segments.shift();
        } else if (segments[0] === '' && segments[1] === '') {
            segments.shift();
        } else if (segments[length - 1] === '' && segments[length - 2] === '') {
            segments.pop();
        }
        length = segments.length;
        if (segments[length - 1].indexOf('.') !== -1) {
            total = 7;
        }
        var pos;
        for (pos = 0; pos < length; pos++) {
            if (segments[pos] === '') {
                break;
            }
        }
        if (pos < total) {
            segments.splice(pos, 1, '0000');
            while (segments.length < total) {
                segments.splice(pos, 0, '0000');
            }
            length = segments.length;
        }
        var _segments;
        for (var i = 0; i < total; i++) {
            _segments = segments[i].split('');
            for (var j = 0; j < 3; j++) {
                if (_segments[0] === '0' && _segments.length > 1) {
                    _segments.splice(0, 1);
                } else {
                    break;
                }
            }
            segments[i] = _segments.join('');
        }
        var best = -1;
        var _best = 0;
        var _current = 0;
        var current = -1;
        var inzeroes = false;
        for (i = 0; i < total; i++) {
            if (inzeroes) {
                if (segments[i] === '0') {
                    _current += 1;
                } else {
                    inzeroes = false;
                    if (_current > _best) {
                        best = current;
                        _best = _current;
                    }
                }
            } else {
                if (segments[i] == '0') {
                    inzeroes = true;
                    current = i;
                    _current = 1;
                }
            }
        }
        if (_current > _best) {
            best = current;
            _best = _current;
        }
        if (_best > 1) {
            segments.splice(best, _best, '');
        }
        length = segments.length;
        var result = '';
        if (segments[0] === '') {
            beststr = ':';
        }
        for (i = 0; i < length; i++) {
            result += segments[i];
            if (i === length - 1) {
                break;
            }
            result += ':';
        }
        if (segments[length - 1] === '') {
            result += ':';
        }
        return result;
    }
    ;
    return {best: best};
});

define('urijs/SecondLevelDomains', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var hasOwn = Object.prototype.hasOwnProperty;
    var SLD = {
        list: {
            'ac': 'com|gov|mil|net|org',
            'ae': 'ac|co|gov|mil|name|net|org|pro|sch',
            'af': 'com|edu|gov|net|org',
            'al': 'com|edu|gov|mil|net|org',
            'ao': 'co|ed|gv|it|og|pb',
            'ar': 'com|edu|gob|gov|int|mil|net|org|tur',
            'at': 'ac|co|gv|or',
            'au': 'asn|com|csiro|edu|gov|id|net|org',
            'ba': 'co|com|edu|gov|mil|net|org|rs|unbi|unmo|unsa|untz|unze',
            'bb': 'biz|co|com|edu|gov|info|net|org|store|tv',
            'bh': 'biz|cc|com|edu|gov|info|net|org',
            'bn': 'com|edu|gov|net|org',
            'bo': 'com|edu|gob|gov|int|mil|net|org|tv',
            'br': 'adm|adv|agr|am|arq|art|ato|b|bio|blog|bmd|cim|cng|cnt|com|coop|ecn|edu|eng|esp|etc|eti|far|flog|fm|fnd|fot|fst|g12|ggf|gov|imb|ind|inf|jor|jus|lel|mat|med|mil|mus|net|nom|not|ntr|odo|org|ppg|pro|psc|psi|qsl|rec|slg|srv|tmp|trd|tur|tv|vet|vlog|wiki|zlg',
            'bs': 'com|edu|gov|net|org',
            'bz': 'du|et|om|ov|rg',
            'ca': 'ab|bc|mb|nb|nf|nl|ns|nt|nu|on|pe|qc|sk|yk',
            'ck': 'biz|co|edu|gen|gov|info|net|org',
            'cn': 'ac|ah|bj|com|cq|edu|fj|gd|gov|gs|gx|gz|ha|hb|he|hi|hl|hn|jl|js|jx|ln|mil|net|nm|nx|org|qh|sc|sd|sh|sn|sx|tj|tw|xj|xz|yn|zj',
            'co': 'com|edu|gov|mil|net|nom|org',
            'cr': 'ac|c|co|ed|fi|go|or|sa',
            'cy': 'ac|biz|com|ekloges|gov|ltd|name|net|org|parliament|press|pro|tm',
            'do': 'art|com|edu|gob|gov|mil|net|org|sld|web',
            'dz': 'art|asso|com|edu|gov|net|org|pol',
            'ec': 'com|edu|fin|gov|info|med|mil|net|org|pro',
            'eg': 'com|edu|eun|gov|mil|name|net|org|sci',
            'er': 'com|edu|gov|ind|mil|net|org|rochest|w',
            'es': 'com|edu|gob|nom|org',
            'et': 'biz|com|edu|gov|info|name|net|org',
            'fj': 'ac|biz|com|info|mil|name|net|org|pro',
            'fk': 'ac|co|gov|net|nom|org',
            'fr': 'asso|com|f|gouv|nom|prd|presse|tm',
            'gg': 'co|net|org',
            'gh': 'com|edu|gov|mil|org',
            'gn': 'ac|com|gov|net|org',
            'gr': 'com|edu|gov|mil|net|org',
            'gt': 'com|edu|gob|ind|mil|net|org',
            'gu': 'com|edu|gov|net|org',
            'hk': 'com|edu|gov|idv|net|org',
            'id': 'ac|co|go|mil|net|or|sch|web',
            'il': 'ac|co|gov|idf|k12|muni|net|org',
            'in': 'ac|co|edu|ernet|firm|gen|gov|i|ind|mil|net|nic|org|res',
            'iq': 'com|edu|gov|i|mil|net|org',
            'ir': 'ac|co|dnssec|gov|i|id|net|org|sch',
            'it': 'edu|gov',
            'je': 'co|net|org',
            'jo': 'com|edu|gov|mil|name|net|org|sch',
            'jp': 'ac|ad|co|ed|go|gr|lg|ne|or',
            'ke': 'ac|co|go|info|me|mobi|ne|or|sc',
            'kh': 'com|edu|gov|mil|net|org|per',
            'ki': 'biz|com|de|edu|gov|info|mob|net|org|tel',
            'km': 'asso|com|coop|edu|gouv|k|medecin|mil|nom|notaires|pharmaciens|presse|tm|veterinaire',
            'kn': 'edu|gov|net|org',
            'kr': 'ac|busan|chungbuk|chungnam|co|daegu|daejeon|es|gangwon|go|gwangju|gyeongbuk|gyeonggi|gyeongnam|hs|incheon|jeju|jeonbuk|jeonnam|k|kg|mil|ms|ne|or|pe|re|sc|seoul|ulsan',
            'kw': 'com|edu|gov|net|org',
            'ky': 'com|edu|gov|net|org',
            'kz': 'com|edu|gov|mil|net|org',
            'lb': 'com|edu|gov|net|org',
            'lk': 'assn|com|edu|gov|grp|hotel|int|ltd|net|ngo|org|sch|soc|web',
            'lr': 'com|edu|gov|net|org',
            'lv': 'asn|com|conf|edu|gov|id|mil|net|org',
            'ly': 'com|edu|gov|id|med|net|org|plc|sch',
            'ma': 'ac|co|gov|m|net|org|press',
            'mc': 'asso|tm',
            'me': 'ac|co|edu|gov|its|net|org|priv',
            'mg': 'com|edu|gov|mil|nom|org|prd|tm',
            'mk': 'com|edu|gov|inf|name|net|org|pro',
            'ml': 'com|edu|gov|net|org|presse',
            'mn': 'edu|gov|org',
            'mo': 'com|edu|gov|net|org',
            'mt': 'com|edu|gov|net|org',
            'mv': 'aero|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro',
            'mw': 'ac|co|com|coop|edu|gov|int|museum|net|org',
            'mx': 'com|edu|gob|net|org',
            'my': 'com|edu|gov|mil|name|net|org|sch',
            'nf': 'arts|com|firm|info|net|other|per|rec|store|web',
            'ng': 'biz|com|edu|gov|mil|mobi|name|net|org|sch',
            'ni': 'ac|co|com|edu|gob|mil|net|nom|org',
            'np': 'com|edu|gov|mil|net|org',
            'nr': 'biz|com|edu|gov|info|net|org',
            'om': 'ac|biz|co|com|edu|gov|med|mil|museum|net|org|pro|sch',
            'pe': 'com|edu|gob|mil|net|nom|org|sld',
            'ph': 'com|edu|gov|i|mil|net|ngo|org',
            'pk': 'biz|com|edu|fam|gob|gok|gon|gop|gos|gov|net|org|web',
            'pl': 'art|bialystok|biz|com|edu|gda|gdansk|gorzow|gov|info|katowice|krakow|lodz|lublin|mil|net|ngo|olsztyn|org|poznan|pwr|radom|slupsk|szczecin|torun|warszawa|waw|wroc|wroclaw|zgora',
            'pr': 'ac|biz|com|edu|est|gov|info|isla|name|net|org|pro|prof',
            'ps': 'com|edu|gov|net|org|plo|sec',
            'pw': 'belau|co|ed|go|ne|or',
            'ro': 'arts|com|firm|info|nom|nt|org|rec|store|tm|www',
            'rs': 'ac|co|edu|gov|in|org',
            'sb': 'com|edu|gov|net|org',
            'sc': 'com|edu|gov|net|org',
            'sh': 'co|com|edu|gov|net|nom|org',
            'sl': 'com|edu|gov|net|org',
            'st': 'co|com|consulado|edu|embaixada|gov|mil|net|org|principe|saotome|store',
            'sv': 'com|edu|gob|org|red',
            'sz': 'ac|co|org',
            'tr': 'av|bbs|bel|biz|com|dr|edu|gen|gov|info|k12|name|net|org|pol|tel|tsk|tv|web',
            'tt': 'aero|biz|cat|co|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel',
            'tw': 'club|com|ebiz|edu|game|gov|idv|mil|net|org',
            'mu': 'ac|co|com|gov|net|or|org',
            'mz': 'ac|co|edu|gov|org',
            'na': 'co|com',
            'nz': 'ac|co|cri|geek|gen|govt|health|iwi|maori|mil|net|org|parliament|school',
            'pa': 'abo|ac|com|edu|gob|ing|med|net|nom|org|sld',
            'pt': 'com|edu|gov|int|net|nome|org|publ',
            'py': 'com|edu|gov|mil|net|org',
            'qa': 'com|edu|gov|mil|net|org',
            're': 'asso|com|nom',
            'ru': 'ac|adygeya|altai|amur|arkhangelsk|astrakhan|bashkiria|belgorod|bir|bryansk|buryatia|cbg|chel|chelyabinsk|chita|chukotka|chuvashia|com|dagestan|e-burg|edu|gov|grozny|int|irkutsk|ivanovo|izhevsk|jar|joshkar-ola|kalmykia|kaluga|kamchatka|karelia|kazan|kchr|kemerovo|khabarovsk|khakassia|khv|kirov|koenig|komi|kostroma|kranoyarsk|kuban|kurgan|kursk|lipetsk|magadan|mari|mari-el|marine|mil|mordovia|mosreg|msk|murmansk|nalchik|net|nnov|nov|novosibirsk|nsk|omsk|orenburg|org|oryol|penza|perm|pp|pskov|ptz|rnd|ryazan|sakhalin|samara|saratov|simbirsk|smolensk|spb|stavropol|stv|surgut|tambov|tatarstan|tom|tomsk|tsaritsyn|tsk|tula|tuva|tver|tyumen|udm|udmurtia|ulan-ude|vladikavkaz|vladimir|vladivostok|volgograd|vologda|voronezh|vrn|vyatka|yakutia|yamal|yekaterinburg|yuzhno-sakhalinsk',
            'rw': 'ac|co|com|edu|gouv|gov|int|mil|net',
            'sa': 'com|edu|gov|med|net|org|pub|sch',
            'sd': 'com|edu|gov|info|med|net|org|tv',
            'se': 'a|ac|b|bd|c|d|e|f|g|h|i|k|l|m|n|o|org|p|parti|pp|press|r|s|t|tm|u|w|x|y|z',
            'sg': 'com|edu|gov|idn|net|org|per',
            'sn': 'art|com|edu|gouv|org|perso|univ',
            'sy': 'com|edu|gov|mil|net|news|org',
            'th': 'ac|co|go|in|mi|net|or',
            'tj': 'ac|biz|co|com|edu|go|gov|info|int|mil|name|net|nic|org|test|web',
            'tn': 'agrinet|com|defense|edunet|ens|fin|gov|ind|info|intl|mincom|nat|net|org|perso|rnrt|rns|rnu|tourism',
            'tz': 'ac|co|go|ne|or',
            'ua': 'biz|cherkassy|chernigov|chernovtsy|ck|cn|co|com|crimea|cv|dn|dnepropetrovsk|donetsk|dp|edu|gov|if|in|ivano-frankivsk|kh|kharkov|kherson|khmelnitskiy|kiev|kirovograd|km|kr|ks|kv|lg|lugansk|lutsk|lviv|me|mk|net|nikolaev|od|odessa|org|pl|poltava|pp|rovno|rv|sebastopol|sumy|te|ternopil|uzhgorod|vinnica|vn|zaporizhzhe|zhitomir|zp|zt',
            'ug': 'ac|co|go|ne|or|org|sc',
            'uk': 'ac|bl|british-library|co|cym|gov|govt|icnet|jet|lea|ltd|me|mil|mod|national-library-scotland|nel|net|nhs|nic|nls|org|orgn|parliament|plc|police|sch|scot|soc',
            'us': 'dni|fed|isa|kids|nsn',
            'uy': 'com|edu|gub|mil|net|org',
            've': 'co|com|edu|gob|info|mil|net|org|web',
            'vi': 'co|com|k12|net|org',
            'vn': 'ac|biz|com|edu|gov|health|info|int|name|net|org|pro',
            'ye': 'co|com|gov|ltd|me|net|org|plc',
            'yu': 'ac|co|edu|gov|org',
            'za': 'ac|agric|alt|bourse|city|co|cybernet|db|edu|gov|grondar|iaccess|imt|inca|landesign|law|mil|net|ngo|nis|nom|olivetti|org|pix|school|tm|web',
            'zm': 'ac|co|com|edu|gov|net|org|sch'
        },
        has_expression: null,
        is_expression: null,
        has: function (domain) {
            return !!domain.match(SLD.has_expression);
        },
        is: function (domain) {
            return !!domain.match(SLD.is_expression);
        },
        get: function (domain) {
            var t = domain.match(SLD.has_expression);
            return t && t[1] || null;
        },
        init: function () {
            var t = '';
            for (var tld in SLD.list) {
                if (!hasOwn.call(SLD.list, tld)) {
                    continue;
                }
                var expression = '(' + SLD.list[tld] + ').' + tld;
                t += '|(' + expression + ')';
            }
            SLD.has_expression = new RegExp('\\.(' + t.substr(1) + ')$', 'i');
            SLD.is_expression = new RegExp('^(' + t.substr(1) + ')$', 'i');
        }
    };
    SLD.init();
    return SLD;
});

define('urijs/URI', [
    'require',
    'exports',
    'module',
    './punycode',
    './IPv6',
    './SecondLevelDomains'
], function (require, exports, module) {
    var punycode = require('./punycode');
    var IPv6 = require('./IPv6');
    var SLD = require('./SecondLevelDomains');

    function URI(url, base) {
        if (!(this instanceof URI)) {
            return new URI(url, base);
        }
        if (url === undefined) {
            if (typeof location !== 'undefined') {
                url = location.href + '';
            } else {
                url = '';
            }
        }
        this.href(url);
        if (base !== undefined) {
            return this.absoluteTo(base);
        }
        return this;
    }
    ;
    URI.version = '1.12.0';
    var p = URI.prototype;
    var hasOwn = Object.prototype.hasOwnProperty;

    function escapeRegEx(string) {
        return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }

    function getType(value) {
        if (value === undefined) {
            return 'Undefined';
        }
        return String(Object.prototype.toString.call(value)).slice(8, -1);
    }

    function isArray(obj) {
        return getType(obj) === 'Array';
    }

    function filterArrayValues(data, value) {
        var lookup = {};
        var i, length;
        if (isArray(value)) {
            for (i = 0, length = value.length; i < length; i++) {
                lookup[value[i]] = true;
            }
        } else {
            lookup[value] = true;
        }
        for (i = 0, length = data.length; i < length; i++) {
            if (lookup[data[i]] !== undefined) {
                data.splice(i, 1);
                length--;
                i--;
            }
        }
        return data;
    }

    function arrayContains(list, value) {
        var i, length;
        if (isArray(value)) {
            for (i = 0, length = value.length; i < length; i++) {
                if (!arrayContains(list, value[i])) {
                    return false;
                }
            }
            return true;
        }
        var _type = getType(value);
        for (i = 0, length = list.length; i < length; i++) {
            if (_type === 'RegExp') {
                if (typeof list[i] === 'string' && list[i].match(value)) {
                    return true;
                }
            } else if (list[i] === value) {
                return true;
            }
        }
        return false;
    }

    function arraysEqual(one, two) {
        if (!isArray(one) || !isArray(two)) {
            return false;
        }
        if (one.length !== two.length) {
            return false;
        }
        one.sort();
        two.sort();
        for (var i = 0, l = one.length; i < l; i++) {
            if (one[i] !== two[i]) {
                return false;
            }
        }
        return true;
    }

    URI._parts = function () {
        return {
            protocol: null,
            username: null,
            password: null,
            hostname: null,
            urn: null,
            port: null,
            path: null,
            query: null,
            fragment: null,
            duplicateQueryParameters: URI.duplicateQueryParameters,
            escapeQuerySpace: URI.escapeQuerySpace
        };
    };
    URI.duplicateQueryParameters = false;
    URI.escapeQuerySpace = true;
    URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
    URI.idn_expression = /[^a-z0-9\.-]/i;
    URI.punycode_expression = /(xn--)/i;
    URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
    URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
    URI.findUri = {
        start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
        end: /[\s\r\n]|$/,
        trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/
    };
    URI.defaultPorts = {
        http: '80',
        https: '443',
        ftp: '21',
        gopher: '70',
        ws: '80',
        wss: '443'
    };
    URI.invalid_hostname_characters = /[^a-zA-Z0-9\.-]/;
    URI.domAttributes = {
        'a': 'href',
        'blockquote': 'cite',
        'link': 'href',
        'base': 'href',
        'script': 'src',
        'form': 'action',
        'img': 'src',
        'area': 'href',
        'iframe': 'src',
        'embed': 'src',
        'source': 'src',
        'track': 'src',
        'input': 'src'
    };
    URI.getDomAttribute = function (node) {
        if (!node || !node.nodeName) {
            return undefined;
        }
        var nodeName = node.nodeName.toLowerCase();
        if (nodeName === 'input' && node.type !== 'image') {
            return undefined;
        }
        return URI.domAttributes[nodeName];
    };

    function escapeForDumbFirefox36(value) {
        return escape(value);
    }

    function strictEncodeURIComponent(string) {
        return encodeURIComponent(string).replace(/[!'()*]/g, escapeForDumbFirefox36).replace(/\*/g, '%2A');
    }

    URI.encode = strictEncodeURIComponent;
    URI.decode = decodeURIComponent;
    URI.iso8859 = function () {
        URI.encode = escape;
        URI.decode = unescape;
    };
    URI.unicode = function () {
        URI.encode = strictEncodeURIComponent;
        URI.decode = decodeURIComponent;
    };
    URI.characters = {
        pathname: {
            encode: {
                expression: /%(24|26|2B|2C|3B|3D|3A|40)/gi,
                map: {
                    '%24': '$',
                    '%26': '&',
                    '%2B': '+',
                    '%2C': ',',
                    '%3B': ';',
                    '%3D': '=',
                    '%3A': ':',
                    '%40': '@'
                }
            },
            decode: {
                expression: /[\/\?#]/g,
                map: {
                    '/': '%2F',
                    '?': '%3F',
                    '#': '%23'
                }
            }
        },
        reserved: {
            encode: {
                expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/gi,
                map: {
                    '%3A': ':',
                    '%2F': '/',
                    '%3F': '?',
                    '%23': '#',
                    '%5B': '[',
                    '%5D': ']',
                    '%40': '@',
                    '%21': '!',
                    '%24': '$',
                    '%26': '&',
                    '%27': '\'',
                    '%28': '(',
                    '%29': ')',
                    '%2A': '*',
                    '%2B': '+',
                    '%2C': ',',
                    '%3B': ';',
                    '%3D': '='
                }
            }
        }
    };
    URI.encodeQuery = function (string, escapeQuerySpace) {
        var escaped = URI.encode(string + '');
        return escapeQuerySpace ? escaped.replace(/%20/g, '+') : escaped;
    };
    URI.decodeQuery = function (string, escapeQuerySpace) {
        string += '';
        try {
            return URI.decode(escapeQuerySpace ? string.replace(/\+/g, '%20') : string);
        } catch (e) {
            return string;
        }
    };
    URI.recodePath = function (string) {
        var segments = (string + '').split('/');
        for (var i = 0, length = segments.length; i < length; i++) {
            segments[i] = URI.encodePathSegment(URI.decode(segments[i]));
        }
        return segments.join('/');
    };
    URI.decodePath = function (string) {
        var segments = (string + '').split('/');
        for (var i = 0, length = segments.length; i < length; i++) {
            segments[i] = URI.decodePathSegment(segments[i]);
        }
        return segments.join('/');
    };
    var _parts = {
        'encode': 'encode',
        'decode': 'decode'
    };
    var _part;
    var generateAccessor = function (_group, _part) {
        return function (string) {
            return URI[_part](string + '').replace(URI.characters[_group][_part].expression, function (c) {
                return URI.characters[_group][_part].map[c];
            });
        };
    };
    for (_part in _parts) {
        URI[_part + 'PathSegment'] = generateAccessor('pathname', _parts[_part]);
    }
    URI.encodeReserved = generateAccessor('reserved', 'encode');
    URI.parse = function (string, parts) {
        var pos;
        if (!parts) {
            parts = {};
        }
        pos = string.indexOf('#');
        if (pos > -1) {
            parts.fragment = string.substring(pos + 1) || null;
            string = string.substring(0, pos);
        }
        pos = string.indexOf('?');
        if (pos > -1) {
            parts.query = string.substring(pos + 1) || null;
            string = string.substring(0, pos);
        }
        if (string.substring(0, 2) === '//') {
            parts.protocol = null;
            string = string.substring(2);
            string = URI.parseAuthority(string, parts);
        } else {
            pos = string.indexOf(':');
            if (pos > -1) {
                parts.protocol = string.substring(0, pos) || null;
                if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
                    parts.protocol = undefined;
                } else if (parts.protocol === 'file') {
                    string = string.substring(pos + 3);
                } else if (string.substring(pos + 1, pos + 3) === '//') {
                    string = string.substring(pos + 3);
                    string = URI.parseAuthority(string, parts);
                } else {
                    string = string.substring(pos + 1);
                    parts.urn = true;
                }
            }
        }
        parts.path = string;
        return parts;
    };
    URI.parseHost = function (string, parts) {
        var pos = string.indexOf('/');
        var bracketPos;
        var t;
        if (pos === -1) {
            pos = string.length;
        }
        if (string.charAt(0) === '[') {
            bracketPos = string.indexOf(']');
            parts.hostname = string.substring(1, bracketPos) || null;
            parts.port = string.substring(bracketPos + 2, pos) || null;
        } else if (string.indexOf(':') !== string.lastIndexOf(':')) {
            parts.hostname = string.substring(0, pos) || null;
            parts.port = null;
        } else {
            t = string.substring(0, pos).split(':');
            parts.hostname = t[0] || null;
            parts.port = t[1] || null;
        }
        if (parts.hostname && string.substring(pos).charAt(0) !== '/') {
            pos++;
            string = '/' + string;
        }
        return string.substring(pos) || '/';
    };
    URI.parseAuthority = function (string, parts) {
        string = URI.parseUserinfo(string, parts);
        return URI.parseHost(string, parts);
    };
    URI.parseUserinfo = function (string, parts) {
        var firstSlash = string.indexOf('/');
        var pos = firstSlash > -1 ? string.lastIndexOf('@', firstSlash) : string.indexOf('@');
        var t;
        if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
            t = string.substring(0, pos).split(':');
            parts.username = t[0] ? URI.decode(t[0]) : null;
            t.shift();
            parts.password = t[0] ? URI.decode(t.join(':')) : null;
            string = string.substring(pos + 1);
        } else {
            parts.username = null;
            parts.password = null;
        }
        return string;
    };
    URI.parseQuery = function (string, escapeQuerySpace) {
        if (!string) {
            return {};
        }
        string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');
        if (!string) {
            return {};
        }
        var items = {};
        var splits = string.split('&');
        var length = splits.length;
        var v, name, value;
        for (var i = 0; i < length; i++) {
            v = splits[i].split('=');
            name = URI.decodeQuery(v.shift(), escapeQuerySpace);
            value = v.length ? URI.decodeQuery(v.join('='), escapeQuerySpace) : null;
            if (items[name]) {
                if (typeof items[name] === 'string') {
                    items[name] = [items[name]];
                }
                items[name].push(value);
            } else {
                items[name] = value;
            }
        }
        return items;
    };
    URI.build = function (parts) {
        var t = '';
        if (parts.protocol) {
            t += parts.protocol + ':';
        }
        if (!parts.urn && (t || parts.hostname)) {
            t += '//';
        }
        t += URI.buildAuthority(parts) || '';
        if (typeof parts.path === 'string') {
            if (parts.path.charAt(0) !== '/' && typeof parts.hostname === 'string') {
                t += '/';
            }
            t += parts.path;
        }
        if (typeof parts.query === 'string' && parts.query) {
            t += '?' + parts.query;
        }
        if (typeof parts.fragment === 'string' && parts.fragment) {
            t += '#' + parts.fragment;
        }
        return t;
    };
    URI.buildHost = function (parts) {
        var t = '';
        if (!parts.hostname) {
            return '';
        } else if (URI.ip6_expression.test(parts.hostname)) {
            if (parts.port) {
                t += '[' + parts.hostname + ']:' + parts.port;
            } else {
                t += parts.hostname;
            }
        } else {
            t += parts.hostname;
            if (parts.port) {
                t += ':' + parts.port;
            }
        }
        return t;
    };
    URI.buildAuthority = function (parts) {
        return URI.buildUserinfo(parts) + URI.buildHost(parts);
    };
    URI.buildUserinfo = function (parts) {
        var t = '';
        if (parts.username) {
            t += URI.encode(parts.username);
            if (parts.password) {
                t += ':' + URI.encode(parts.password);
            }
            t += '@';
        }
        return t;
    };
    URI.buildQuery = function (data, duplicateQueryParameters, escapeQuerySpace) {
        var t = '';
        var unique, key, i, length;
        for (key in data) {
            if (hasOwn.call(data, key) && key) {
                if (isArray(data[key])) {
                    unique = {};
                    for (i = 0, length = data[key].length; i < length; i++) {
                        if (data[key][i] !== undefined && unique[data[key][i] + ''] === undefined) {
                            t += '&' + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
                            if (duplicateQueryParameters !== true) {
                                unique[data[key][i] + ''] = true;
                            }
                        }
                    }
                } else if (data[key] !== undefined) {
                    t += '&' + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
                }
            }
        }
        return t.substring(1);
    };
    URI.buildQueryParameter = function (name, value, escapeQuerySpace) {
        return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? '=' + URI.encodeQuery(value, escapeQuerySpace) : '');
    };
    URI.addQuery = function (data, name, value) {
        if (typeof name === 'object') {
            for (var key in name) {
                if (hasOwn.call(name, key)) {
                    URI.addQuery(data, key, name[key]);
                }
            }
        } else if (typeof name === 'string') {
            if (data[name] === undefined) {
                data[name] = value;
                return;
            } else if (typeof data[name] === 'string') {
                data[name] = [data[name]];
            }
            if (!isArray(value)) {
                value = [value];
            }
            data[name] = data[name].concat(value);
        } else {
            throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
        }
    };
    URI.removeQuery = function (data, name, value) {
        var i, length, key;
        if (isArray(name)) {
            for (i = 0, length = name.length; i < length; i++) {
                data[name[i]] = undefined;
            }
        } else if (typeof name === 'object') {
            for (key in name) {
                if (hasOwn.call(name, key)) {
                    URI.removeQuery(data, key, name[key]);
                }
            }
        } else if (typeof name === 'string') {
            if (value !== undefined) {
                if (data[name] === value) {
                    data[name] = undefined;
                } else if (isArray(data[name])) {
                    data[name] = filterArrayValues(data[name], value);
                }
            } else {
                data[name] = undefined;
            }
        } else {
            throw new TypeError('URI.addQuery() accepts an object, string as the first parameter');
        }
    };
    URI.hasQuery = function (data, name, value, withinArray) {
        if (typeof name === 'object') {
            for (var key in name) {
                if (hasOwn.call(name, key)) {
                    if (!URI.hasQuery(data, key, name[key])) {
                        return false;
                    }
                }
            }
            return true;
        } else if (typeof name !== 'string') {
            throw new TypeError('URI.hasQuery() accepts an object, string as the name parameter');
        }
        switch (getType(value)) {
            case 'Undefined':
                return name in data;
            case 'Boolean':
                var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
                return value === _booly;
            case 'Function':
                return !!value(data[name], name, data);
            case 'Array':
                if (!isArray(data[name])) {
                    return false;
                }
                var op = withinArray ? arrayContains : arraysEqual;
                return op(data[name], value);
            case 'RegExp':
                if (!isArray(data[name])) {
                    return Boolean(data[name] && data[name].match(value));
                }
                if (!withinArray) {
                    return false;
                }
                return arrayContains(data[name], value);
            case 'Number':
                value = String(value);
            case 'String':
                if (!isArray(data[name])) {
                    return data[name] === value;
                }
                if (!withinArray) {
                    return false;
                }
                return arrayContains(data[name], value);
            default:
                throw new TypeError('URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter');
        }
    };
    URI.commonPath = function (one, two) {
        var length = Math.min(one.length, two.length);
        var pos;
        for (pos = 0; pos < length; pos++) {
            if (one.charAt(pos) !== two.charAt(pos)) {
                pos--;
                break;
            }
        }
        if (pos < 1) {
            return one.charAt(0) === two.charAt(0) && one.charAt(0) === '/' ? '/' : '';
        }
        if (one.charAt(pos) !== '/' || two.charAt(pos) !== '/') {
            pos = one.substring(0, pos).lastIndexOf('/');
        }
        return one.substring(0, pos + 1);
    };
    URI.withinString = function (string, callback, options) {
        options || (options = {});
        var _start = options.start || URI.findUri.start;
        var _end = options.end || URI.findUri.end;
        var _trim = options.trim || URI.findUri.trim;
        var _attributeOpen = /[a-z0-9-]=["']?$/i;
        _start.lastIndex = 0;
        while (true) {
            var match = _start.exec(string);
            if (!match) {
                break;
            }
            var start = match.index;
            if (options.ignoreHtml) {
                var attributeOpen = string.slice(Math.max(start - 3, 0), start);
                if (attributeOpen && _attributeOpen.test(attributeOpen)) {
                    continue;
                }
            }
            var end = start + string.slice(start).search(_end);
            var slice = string.slice(start, end).replace(_trim, '');
            if (options.ignore && options.ignore.test(slice)) {
                continue;
            }
            end = start + slice.length;
            var result = callback(slice, start, end, string);
            string = string.slice(0, start) + result + string.slice(end);
            _start.lastIndex = start + result.length;
        }
        _start.lastIndex = 0;
        return string;
    };
    URI.ensureValidHostname = function (v) {
        if (v.match(URI.invalid_hostname_characters)) {
            if (!punycode) {
                throw new TypeError('Hostname \'' + v + '\' contains characters other than [A-Z0-9.-] and Punycode.js is not available');
            }
            if (punycode.toASCII(v).match(URI.invalid_hostname_characters)) {
                throw new TypeError('Hostname \'' + v + '\' contains characters other than [A-Z0-9.-]');
            }
        }
    };
    p.build = function (deferBuild) {
        if (deferBuild === true) {
            this._deferred_build = true;
        } else if (deferBuild === undefined || this._deferred_build) {
            this._string = URI.build(this._parts);
            this._deferred_build = false;
        }
        return this;
    };
    p.clone = function () {
        return new URI(this);
    };
    p.valueOf = p.toString = function () {
        return this.build(false)._string;
    };
    _parts = {
        protocol: 'protocol',
        username: 'username',
        password: 'password',
        hostname: 'hostname',
        port: 'port'
    };
    generateAccessor = function (_part) {
        return function (v, build) {
            if (v === undefined) {
                return this._parts[_part] || '';
            } else {
                this._parts[_part] = v || null;
                this.build(!build);
                return this;
            }
        };
    };
    for (_part in _parts) {
        p[_part] = generateAccessor(_parts[_part]);
    }
    _parts = {
        query: '?',
        fragment: '#'
    };
    generateAccessor = function (_part, _key) {
        return function (v, build) {
            if (v === undefined) {
                return this._parts[_part] || '';
            } else {
                if (v !== null) {
                    v = v + '';
                    if (v.charAt(0) === _key) {
                        v = v.substring(1);
                    }
                }
                this._parts[_part] = v;
                this.build(!build);
                return this;
            }
        };
    };
    for (_part in _parts) {
        p[_part] = generateAccessor(_part, _parts[_part]);
    }
    _parts = {
        search: [
            '?',
            'query'
        ],
        hash: [
            '#',
            'fragment'
        ]
    };
    generateAccessor = function (_part, _key) {
        return function (v, build) {
            var t = this[_part](v, build);
            return typeof t === 'string' && t.length ? _key + t : t;
        };
    };
    for (_part in _parts) {
        p[_part] = generateAccessor(_parts[_part][1], _parts[_part][0]);
    }
    p.pathname = function (v, build) {
        if (v === undefined || v === true) {
            var res = this._parts.path || (this._parts.hostname ? '/' : '');
            return v ? URI.decodePath(res) : res;
        } else {
            this._parts.path = v ? URI.recodePath(v) : '/';
            this.build(!build);
            return this;
        }
    };
    p.path = p.pathname;
    p.href = function (href, build) {
        var key;
        if (href === undefined) {
            return this.toString();
        }
        this._string = '';
        this._parts = URI._parts();
        var _URI = href instanceof URI;
        var _object = typeof href === 'object' && (href.hostname || href.path || href.pathname);
        if (href.nodeName) {
            var attribute = URI.getDomAttribute(href);
            href = href[attribute] || '';
            _object = false;
        }
        if (!_URI && _object && href.pathname !== undefined) {
            href = href.toString();
        }
        if (typeof href === 'string') {
            this._parts = URI.parse(href, this._parts);
        } else if (_URI || _object) {
            var src = _URI ? href._parts : href;
            for (key in src) {
                if (hasOwn.call(this._parts, key)) {
                    this._parts[key] = src[key];
                }
            }
        } else {
            throw new TypeError('invalid input');
        }
        this.build(!build);
        return this;
    };
    p.is = function (what) {
        var ip = false;
        var ip4 = false;
        var ip6 = false;
        var name = false;
        var sld = false;
        var idn = false;
        var punycode = false;
        var relative = !this._parts.urn;
        if (this._parts.hostname) {
            relative = false;
            ip4 = URI.ip4_expression.test(this._parts.hostname);
            ip6 = URI.ip6_expression.test(this._parts.hostname);
            ip = ip4 || ip6;
            name = !ip;
            sld = name && SLD && SLD.has(this._parts.hostname);
            idn = name && URI.idn_expression.test(this._parts.hostname);
            punycode = name && URI.punycode_expression.test(this._parts.hostname);
        }
        switch (what.toLowerCase()) {
            case 'relative':
                return relative;
            case 'absolute':
                return !relative;
            case 'domain':
            case 'name':
                return name;
            case 'sld':
                return sld;
            case 'ip':
                return ip;
            case 'ip4':
            case 'ipv4':
            case 'inet4':
                return ip4;
            case 'ip6':
            case 'ipv6':
            case 'inet6':
                return ip6;
            case 'idn':
                return idn;
            case 'url':
                return !this._parts.urn;
            case 'urn':
                return !!this._parts.urn;
            case 'punycode':
                return punycode;
        }
        return null;
    };
    var _protocol = p.protocol;
    var _port = p.port;
    var _hostname = p.hostname;
    p.protocol = function (v, build) {
        if (v !== undefined) {
            if (v) {
                v = v.replace(/:(\/\/)?$/, '');
                if (!v.match(URI.protocol_expression)) {
                    throw new TypeError('Protocol \'' + v + '\' contains characters other than [A-Z0-9.+-] or doesn\'t start with [A-Z]');
                }
            }
        }
        return _protocol.call(this, v, build);
    };
    p.scheme = p.protocol;
    p.port = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v !== undefined) {
            if (v === 0) {
                v = null;
            }
            if (v) {
                v += '';
                if (v.charAt(0) === ':') {
                    v = v.substring(1);
                }
                if (v.match(/[^0-9]/)) {
                    throw new TypeError('Port \'' + v + '\' contains characters other than [0-9]');
                }
            }
        }
        return _port.call(this, v, build);
    };
    p.hostname = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v !== undefined) {
            var x = {};
            URI.parseHost(v, x);
            v = x.hostname;
        }
        return _hostname.call(this, v, build);
    };
    p.host = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined) {
            return this._parts.hostname ? URI.buildHost(this._parts) : '';
        } else {
            URI.parseHost(v, this._parts);
            this.build(!build);
            return this;
        }
    };
    p.authority = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined) {
            return this._parts.hostname ? URI.buildAuthority(this._parts) : '';
        } else {
            URI.parseAuthority(v, this._parts);
            this.build(!build);
            return this;
        }
    };
    p.userinfo = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined) {
            if (!this._parts.username) {
                return '';
            }
            var t = URI.buildUserinfo(this._parts);
            return t.substring(0, t.length - 1);
        } else {
            if (v[v.length - 1] !== '@') {
                v += '@';
            }
            URI.parseUserinfo(v, this._parts);
            this.build(!build);
            return this;
        }
    };
    p.resource = function (v, build) {
        var parts;
        if (v === undefined) {
            return this.path() + this.search() + this.hash();
        }
        parts = URI.parse(v);
        this._parts.path = parts.path;
        this._parts.query = parts.query;
        this._parts.fragment = parts.fragment;
        this.build(!build);
        return this;
    };
    p.subdomain = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined) {
            if (!this._parts.hostname || this.is('IP')) {
                return '';
            }
            var end = this._parts.hostname.length - this.domain().length - 1;
            return this._parts.hostname.substring(0, end) || '';
        } else {
            var e = this._parts.hostname.length - this.domain().length;
            var sub = this._parts.hostname.substring(0, e);
            var replace = new RegExp('^' + escapeRegEx(sub));
            if (v && v.charAt(v.length - 1) !== '.') {
                v += '.';
            }
            if (v) {
                URI.ensureValidHostname(v);
            }
            this._parts.hostname = this._parts.hostname.replace(replace, v);
            this.build(!build);
            return this;
        }
    };
    p.domain = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (typeof v === 'boolean') {
            build = v;
            v = undefined;
        }
        if (v === undefined) {
            if (!this._parts.hostname || this.is('IP')) {
                return '';
            }
            var t = this._parts.hostname.match(/\./g);
            if (t && t.length < 2) {
                return this._parts.hostname;
            }
            var end = this._parts.hostname.length - this.tld(build).length - 1;
            end = this._parts.hostname.lastIndexOf('.', end - 1) + 1;
            return this._parts.hostname.substring(end) || '';
        } else {
            if (!v) {
                throw new TypeError('cannot set domain empty');
            }
            URI.ensureValidHostname(v);
            if (!this._parts.hostname || this.is('IP')) {
                this._parts.hostname = v;
            } else {
                var replace = new RegExp(escapeRegEx(this.domain()) + '$');
                this._parts.hostname = this._parts.hostname.replace(replace, v);
            }
            this.build(!build);
            return this;
        }
    };
    p.tld = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (typeof v === 'boolean') {
            build = v;
            v = undefined;
        }
        if (v === undefined) {
            if (!this._parts.hostname || this.is('IP')) {
                return '';
            }
            var pos = this._parts.hostname.lastIndexOf('.');
            var tld = this._parts.hostname.substring(pos + 1);
            if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
                return SLD.get(this._parts.hostname) || tld;
            }
            return tld;
        } else {
            var replace;
            if (!v) {
                throw new TypeError('cannot set TLD empty');
            } else if (v.match(/[^a-zA-Z0-9-]/)) {
                if (SLD && SLD.is(v)) {
                    replace = new RegExp(escapeRegEx(this.tld()) + '$');
                    this._parts.hostname = this._parts.hostname.replace(replace, v);
                } else {
                    throw new TypeError('TLD \'' + v + '\' contains characters other than [A-Z0-9]');
                }
            } else if (!this._parts.hostname || this.is('IP')) {
                throw new ReferenceError('cannot set TLD on non-domain host');
            } else {
                replace = new RegExp(escapeRegEx(this.tld()) + '$');
                this._parts.hostname = this._parts.hostname.replace(replace, v);
            }
            this.build(!build);
            return this;
        }
    };
    p.directory = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined || v === true) {
            if (!this._parts.path && !this._parts.hostname) {
                return '';
            }
            if (this._parts.path === '/') {
                return '/';
            }
            var end = this._parts.path.length - this.filename().length - 1;
            var res = this._parts.path.substring(0, end) || (this._parts.hostname ? '/' : '');
            return v ? URI.decodePath(res) : res;
        } else {
            var e = this._parts.path.length - this.filename().length;
            var directory = this._parts.path.substring(0, e);
            var replace = new RegExp('^' + escapeRegEx(directory));
            if (!this.is('relative')) {
                if (!v) {
                    v = '/';
                }
                if (v.charAt(0) !== '/') {
                    v = '/' + v;
                }
            }
            if (v && v.charAt(v.length - 1) !== '/') {
                v += '/';
            }
            v = URI.recodePath(v);
            this._parts.path = this._parts.path.replace(replace, v);
            this.build(!build);
            return this;
        }
    };
    p.filename = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined || v === true) {
            if (!this._parts.path || this._parts.path === '/') {
                return '';
            }
            var pos = this._parts.path.lastIndexOf('/');
            var res = this._parts.path.substring(pos + 1);
            return v ? URI.decodePathSegment(res) : res;
        } else {
            var mutatedDirectory = false;
            if (v.charAt(0) === '/') {
                v = v.substring(1);
            }
            if (v.match(/\.?\//)) {
                mutatedDirectory = true;
            }
            var replace = new RegExp(escapeRegEx(this.filename()) + '$');
            v = URI.recodePath(v);
            this._parts.path = this._parts.path.replace(replace, v);
            if (mutatedDirectory) {
                this.normalizePath(build);
            } else {
                this.build(!build);
            }
            return this;
        }
    };
    p.suffix = function (v, build) {
        if (this._parts.urn) {
            return v === undefined ? '' : this;
        }
        if (v === undefined || v === true) {
            if (!this._parts.path || this._parts.path === '/') {
                return '';
            }
            var filename = this.filename();
            var pos = filename.lastIndexOf('.');
            var s, res;
            if (pos === -1) {
                return '';
            }
            s = filename.substring(pos + 1);
            res = /^[a-z0-9%]+$/i.test(s) ? s : '';
            return v ? URI.decodePathSegment(res) : res;
        } else {
            if (v.charAt(0) === '.') {
                v = v.substring(1);
            }
            var suffix = this.suffix();
            var replace;
            if (!suffix) {
                if (!v) {
                    return this;
                }
                this._parts.path += '.' + URI.recodePath(v);
            } else if (!v) {
                replace = new RegExp(escapeRegEx('.' + suffix) + '$');
            } else {
                replace = new RegExp(escapeRegEx(suffix) + '$');
            }
            if (replace) {
                v = URI.recodePath(v);
                this._parts.path = this._parts.path.replace(replace, v);
            }
            this.build(!build);
            return this;
        }
    };
    p.segment = function (segment, v, build) {
        var separator = this._parts.urn ? ':' : '/';
        var path = this.path();
        var absolute = path.substring(0, 1) === '/';
        var segments = path.split(separator);
        if (segment !== undefined && typeof segment !== 'number') {
            build = v;
            v = segment;
            segment = undefined;
        }
        if (segment !== undefined && typeof segment !== 'number') {
            throw new Error('Bad segment \'' + segment + '\', must be 0-based integer');
        }
        if (absolute) {
            segments.shift();
        }
        if (segment < 0) {
            segment = Math.max(segments.length + segment, 0);
        }
        if (v === undefined) {
            return segment === undefined ? segments : segments[segment];
        } else if (segment === null || segments[segment] === undefined) {
            if (isArray(v)) {
                segments = [];
                for (var i = 0, l = v.length; i < l; i++) {
                    if (!v[i].length && (!segments.length || !segments[segments.length - 1].length)) {
                        continue;
                    }
                    if (segments.length && !segments[segments.length - 1].length) {
                        segments.pop();
                    }
                    segments.push(v[i]);
                }
            } else if (v || typeof v === 'string') {
                if (segments[segments.length - 1] === '') {
                    segments[segments.length - 1] = v;
                } else {
                    segments.push(v);
                }
            }
        } else {
            if (v || typeof v === 'string' && v.length) {
                segments[segment] = v;
            } else {
                segments.splice(segment, 1);
            }
        }
        if (absolute) {
            segments.unshift('');
        }
        return this.path(segments.join(separator), build);
    };
    p.segmentCoded = function (segment, v, build) {
        var segments, i, l;
        if (typeof segment !== 'number') {
            build = v;
            v = segment;
            segment = undefined;
        }
        if (v === undefined) {
            segments = this.segment(segment, v, build);
            if (!isArray(segments)) {
                segments = segments !== undefined ? URI.decode(segments) : undefined;
            } else {
                for (i = 0, l = segments.length; i < l; i++) {
                    segments[i] = URI.decode(segments[i]);
                }
            }
            return segments;
        }
        if (!isArray(v)) {
            v = typeof v === 'string' ? URI.encode(v) : v;
        } else {
            for (i = 0, l = v.length; i < l; i++) {
                v[i] = URI.decode(v[i]);
            }
        }
        return this.segment(segment, v, build);
    };
    var q = p.query;
    p.query = function (v, build) {
        if (v === true) {
            return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        } else if (typeof v === 'function') {
            var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
            var result = v.call(this, data);
            this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
            this.build(!build);
            return this;
        } else if (v !== undefined && typeof v !== 'string') {
            this._parts.query = URI.buildQuery(v, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
            this.build(!build);
            return this;
        } else {
            return q.call(this, v, build);
        }
    };
    p.setQuery = function (name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        if (typeof name === 'object') {
            for (var key in name) {
                if (hasOwn.call(name, key)) {
                    data[key] = name[key];
                }
            }
        } else if (typeof name === 'string') {
            data[name] = value !== undefined ? value : null;
        } else {
            throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
        }
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== 'string') {
            build = value;
        }
        this.build(!build);
        return this;
    };
    p.addQuery = function (name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        URI.addQuery(data, name, value === undefined ? null : value);
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== 'string') {
            build = value;
        }
        this.build(!build);
        return this;
    };
    p.removeQuery = function (name, value, build) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        URI.removeQuery(data, name, value);
        this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
        if (typeof name !== 'string') {
            build = value;
        }
        this.build(!build);
        return this;
    };
    p.hasQuery = function (name, value, withinArray) {
        var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
        return URI.hasQuery(data, name, value, withinArray);
    };
    p.setSearch = p.setQuery;
    p.addSearch = p.addQuery;
    p.removeSearch = p.removeQuery;
    p.hasSearch = p.hasQuery;
    p.normalize = function () {
        if (this._parts.urn) {
            return this.normalizeProtocol(false).normalizeQuery(false).normalizeFragment(false).build();
        }
        return this.normalizeProtocol(false).normalizeHostname(false).normalizePort(false).normalizePath(false).normalizeQuery(false).normalizeFragment(false).build();
    };
    p.normalizeProtocol = function (build) {
        if (typeof this._parts.protocol === 'string') {
            this._parts.protocol = this._parts.protocol.toLowerCase();
            this.build(!build);
        }
        return this;
    };
    p.normalizeHostname = function (build) {
        if (this._parts.hostname) {
            if (this.is('IDN') && punycode) {
                this._parts.hostname = punycode.toASCII(this._parts.hostname);
            } else if (this.is('IPv6') && IPv6) {
                this._parts.hostname = IPv6.best(this._parts.hostname);
            }
            this._parts.hostname = this._parts.hostname.toLowerCase();
            this.build(!build);
        }
        return this;
    };
    p.normalizePort = function (build) {
        if (typeof this._parts.protocol === 'string' && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
            this._parts.port = null;
            this.build(!build);
        }
        return this;
    };
    p.normalizePath = function (build) {
        if (this._parts.urn) {
            return this;
        }
        if (!this._parts.path || this._parts.path === '/') {
            return this;
        }
        var _was_relative;
        var _path = this._parts.path;
        var _leadingParents = '';
        var _parent, _pos;
        if (_path.charAt(0) !== '/') {
            _was_relative = true;
            _path = '/' + _path;
        }
        _path = _path.replace(/(\/(\.\/)+)|(\/\.$)/g, '/').replace(/\/{2,}/g, '/');
        if (_was_relative) {
            _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || '';
            if (_leadingParents) {
                _leadingParents = _leadingParents[0];
            }
        }
        while (true) {
            _parent = _path.indexOf('/..');
            if (_parent === -1) {
                break;
            } else if (_parent === 0) {
                _path = _path.substring(3);
                continue;
            }
            _pos = _path.substring(0, _parent).lastIndexOf('/');
            if (_pos === -1) {
                _pos = _parent;
            }
            _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
        }
        if (_was_relative && this.is('relative')) {
            _path = _leadingParents + _path.substring(1);
        }
        _path = URI.recodePath(_path);
        this._parts.path = _path;
        this.build(!build);
        return this;
    };
    p.normalizePathname = p.normalizePath;
    p.normalizeQuery = function (build) {
        if (typeof this._parts.query === 'string') {
            if (!this._parts.query.length) {
                this._parts.query = null;
            } else {
                this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
            }
            this.build(!build);
        }
        return this;
    };
    p.normalizeFragment = function (build) {
        if (!this._parts.fragment) {
            this._parts.fragment = null;
            this.build(!build);
        }
        return this;
    };
    p.normalizeSearch = p.normalizeQuery;
    p.normalizeHash = p.normalizeFragment;
    p.iso8859 = function () {
        var e = URI.encode;
        var d = URI.decode;
        URI.encode = escape;
        URI.decode = decodeURIComponent;
        this.normalize();
        URI.encode = e;
        URI.decode = d;
        return this;
    };
    p.unicode = function () {
        var e = URI.encode;
        var d = URI.decode;
        URI.encode = strictEncodeURIComponent;
        URI.decode = unescape;
        this.normalize();
        URI.encode = e;
        URI.decode = d;
        return this;
    };
    p.readable = function () {
        var uri = this.clone();
        uri.username('').password('').normalize();
        var t = '';
        if (uri._parts.protocol) {
            t += uri._parts.protocol + '://';
        }
        if (uri._parts.hostname) {
            if (uri.is('punycode') && punycode) {
                t += punycode.toUnicode(uri._parts.hostname);
                if (uri._parts.port) {
                    t += ':' + uri._parts.port;
                }
            } else {
                t += uri.host();
            }
        }
        if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== '/') {
            t += '/';
        }
        t += uri.path(true);
        if (uri._parts.query) {
            var q = '';
            for (var i = 0, qp = uri._parts.query.split('&'), l = qp.length; i < l; i++) {
                var kv = (qp[i] || '').split('=');
                q += '&' + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace).replace(/&/g, '%26');
                if (kv[1] !== undefined) {
                    q += '=' + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace).replace(/&/g, '%26');
                }
            }
            t += '?' + q.substring(1);
        }
        t += URI.decodeQuery(uri.hash(), true);
        return t;
    };
    p.absoluteTo = function (base) {
        var resolved = this.clone();
        var properties = [
            'protocol',
            'username',
            'password',
            'hostname',
            'port'
        ];
        var basedir, i, p;
        if (this._parts.urn) {
            throw new Error('URNs do not have any generally defined hierarchical components');
        }
        if (!(base instanceof URI)) {
            base = new URI(base);
        }
        if (!resolved._parts.protocol) {
            resolved._parts.protocol = base._parts.protocol;
        }
        if (this._parts.hostname) {
            return resolved;
        }
        for (i = 0; p = properties[i]; i++) {
            resolved._parts[p] = base._parts[p];
        }
        if (!resolved._parts.path) {
            resolved._parts.path = base._parts.path;
            if (!resolved._parts.query) {
                resolved._parts.query = base._parts.query;
            }
        } else if (resolved._parts.path.substring(-2) === '..') {
            resolved._parts.path += '/';
        }
        if (resolved.path().charAt(0) !== '/') {
            basedir = base.directory();
            resolved._parts.path = (basedir ? basedir + '/' : '') + resolved._parts.path;
            resolved.normalizePath();
        }
        resolved.build();
        return resolved;
    };
    p.relativeTo = function (base) {
        var relative = this.clone().normalize();
        var relativeParts, baseParts, common, relativePath, basePath;
        if (relative._parts.urn) {
            throw new Error('URNs do not have any generally defined hierarchical components');
        }
        base = new URI(base).normalize();
        relativeParts = relative._parts;
        baseParts = base._parts;
        relativePath = relative.path();
        basePath = base.path();
        if (relativePath.charAt(0) !== '/') {
            throw new Error('URI is already relative');
        }
        if (basePath.charAt(0) !== '/') {
            throw new Error('Cannot calculate a URI relative to another relative URI');
        }
        if (relativeParts.protocol === baseParts.protocol) {
            relativeParts.protocol = null;
        }
        if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
            return relative.build();
        }
        if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
            return relative.build();
        }
        if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
            relativeParts.hostname = null;
            relativeParts.port = null;
        } else {
            return relative.build();
        }
        if (relativePath === basePath) {
            relativeParts.path = '';
            return relative.build();
        }
        common = URI.commonPath(relative.path(), base.path());
        if (!common) {
            return relative.build();
        }
        var parents = baseParts.path.substring(common.length).replace(/[^\/]*$/, '').replace(/.*?\//g, '../');
        relativeParts.path = parents + relativeParts.path.substring(common.length);
        return relative.build();
    };
    p.equals = function (uri) {
        var one = this.clone();
        var two = new URI(uri);
        var one_map = {};
        var two_map = {};
        var checked = {};
        var one_query, two_query, key;
        one.normalize();
        two.normalize();
        if (one.toString() === two.toString()) {
            return true;
        }
        one_query = one.query();
        two_query = two.query();
        one.query('');
        two.query('');
        if (one.toString() !== two.toString()) {
            return false;
        }
        if (one_query.length !== two_query.length) {
            return false;
        }
        one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
        two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);
        for (key in one_map) {
            if (hasOwn.call(one_map, key)) {
                if (!isArray(one_map[key])) {
                    if (one_map[key] !== two_map[key]) {
                        return false;
                    }
                } else if (!arraysEqual(one_map[key], two_map[key])) {
                    return false;
                }
                checked[key] = true;
            }
        }
        for (key in two_map) {
            if (hasOwn.call(two_map, key)) {
                if (!checked[key]) {
                    return false;
                }
            }
        }
        return true;
    };
    p.duplicateQueryParameters = function (v) {
        this._parts.duplicateQueryParameters = !!v;
        return this;
    };
    p.escapeQuerySpace = function (v) {
        this._parts.escapeQuerySpace = !!v;
        return this;
    };
    return URI;
});

define('urijs', ['urijs/URI'], function (main) {
    return main;
});

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('jquery.cookie/jquery.cookie', ['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {
    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            s = decodeURIComponent(s.replace(pluses, ' '));
        } catch (e) {
            return;
        }
        try {
            return config.json ? JSON.parse(s) : s;
        } catch (e) {
        }
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {
        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);
            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }
            return document.cookie = [
                encode(key),
                '=',
                stringifyCookieValue(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '',
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join('');
        }
        var result = key ? undefined : {};
        var cookies = document.cookie ? document.cookie.split('; ') : [];
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');
            if (key && key === name) {
                result = read(cookie, value);
                break;
            }
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }
        return result;
    };
    config.defaults = {};
    $.removeCookie = function (key, options) {
        if ($.cookie(key) !== undefined) {
            $.cookie(key, '', $.extend({}, options, {expires: -1}));
            return true;
        }
        return false;
    };
}));

define('jquery.cookie', ['jquery.cookie/jquery.cookie'], function (main) {
    return main;
});

define('crypto/base', ['exports'], function (exports) {
    exports.__esModule = true;
    var byteArrayToHex = function byteArrayToHex(array) {
        var hex = [];
        for (var i = 0; i < array.length; i++) {
            var hexByte = array[i].toString(16);
            if (hexByte.length <= 1) {
                hexByte = '0' + hexByte;
            }
            hex.push(hexByte);
        }
        return hex.join('');
    };
    exports.byteArrayToHex = byteArrayToHex;
});

define('crypto/md5', [
    'exports',
    'module',
    './base',
    'babel-runtime/helpers/interop-require-default'
], function (exports, module, _base, _babelRuntimeHelpersInteropRequireDefault) {
    module.exports = Md5;
    var _base2 = _babelRuntimeHelpersInteropRequireDefault['default'](_base);

    function Md5() {
        this.blockSize = 512 / 8;
        this.chain_ = new Array(4);
        this.block_ = new Array(this.blockSize);
        this.blockLength_ = 0;
        this.totalLength_ = 0;
        this.reset();
    }

    Md5.prototype.reset = function () {
        this.chain_[0] = 1732584193;
        this.chain_[1] = 4023233417;
        this.chain_[2] = 2562383102;
        this.chain_[3] = 271733878;
        this.blockLength_ = 0;
        this.totalLength_ = 0;
    };
    Md5.prototype.compress_ = function (buf, opt_offset) {
        if (!opt_offset) {
            opt_offset = 0;
        }
        var X = new Array(16);
        if (typeof buf === 'string') {
            for (var i = 0; i < 16; ++i) {
                X[i] = buf.charCodeAt(opt_offset++) | buf.charCodeAt(opt_offset++) << 8 | buf.charCodeAt(opt_offset++) << 16 | buf.charCodeAt(opt_offset++) << 24;
            }
        } else {
            for (i = 0; i < 16; ++i) {
                X[i] = buf[opt_offset++] | buf[opt_offset++] << 8 | buf[opt_offset++] << 16 | buf[opt_offset++] << 24;
            }
        }
        var A = this.chain_[0];
        var B = this.chain_[1];
        var C = this.chain_[2];
        var D = this.chain_[3];
        var sum = 0;
        sum = A + (D ^ B & (C ^ D)) + X[0] + 3614090360 & 4294967295;
        A = B + (sum << 7 & 4294967295 | sum >>> 25);
        sum = D + (C ^ A & (B ^ C)) + X[1] + 3905402710 & 4294967295;
        D = A + (sum << 12 & 4294967295 | sum >>> 20);
        sum = C + (B ^ D & (A ^ B)) + X[2] + 606105819 & 4294967295;
        C = D + (sum << 17 & 4294967295 | sum >>> 15);
        sum = B + (A ^ C & (D ^ A)) + X[3] + 3250441966 & 4294967295;
        B = C + (sum << 22 & 4294967295 | sum >>> 10);
        sum = A + (D ^ B & (C ^ D)) + X[4] + 4118548399 & 4294967295;
        A = B + (sum << 7 & 4294967295 | sum >>> 25);
        sum = D + (C ^ A & (B ^ C)) + X[5] + 1200080426 & 4294967295;
        D = A + (sum << 12 & 4294967295 | sum >>> 20);
        sum = C + (B ^ D & (A ^ B)) + X[6] + 2821735955 & 4294967295;
        C = D + (sum << 17 & 4294967295 | sum >>> 15);
        sum = B + (A ^ C & (D ^ A)) + X[7] + 4249261313 & 4294967295;
        B = C + (sum << 22 & 4294967295 | sum >>> 10);
        sum = A + (D ^ B & (C ^ D)) + X[8] + 1770035416 & 4294967295;
        A = B + (sum << 7 & 4294967295 | sum >>> 25);
        sum = D + (C ^ A & (B ^ C)) + X[9] + 2336552879 & 4294967295;
        D = A + (sum << 12 & 4294967295 | sum >>> 20);
        sum = C + (B ^ D & (A ^ B)) + X[10] + 4294925233 & 4294967295;
        C = D + (sum << 17 & 4294967295 | sum >>> 15);
        sum = B + (A ^ C & (D ^ A)) + X[11] + 2304563134 & 4294967295;
        B = C + (sum << 22 & 4294967295 | sum >>> 10);
        sum = A + (D ^ B & (C ^ D)) + X[12] + 1804603682 & 4294967295;
        A = B + (sum << 7 & 4294967295 | sum >>> 25);
        sum = D + (C ^ A & (B ^ C)) + X[13] + 4254626195 & 4294967295;
        D = A + (sum << 12 & 4294967295 | sum >>> 20);
        sum = C + (B ^ D & (A ^ B)) + X[14] + 2792965006 & 4294967295;
        C = D + (sum << 17 & 4294967295 | sum >>> 15);
        sum = B + (A ^ C & (D ^ A)) + X[15] + 1236535329 & 4294967295;
        B = C + (sum << 22 & 4294967295 | sum >>> 10);
        sum = A + (C ^ D & (B ^ C)) + X[1] + 4129170786 & 4294967295;
        A = B + (sum << 5 & 4294967295 | sum >>> 27);
        sum = D + (B ^ C & (A ^ B)) + X[6] + 3225465664 & 4294967295;
        D = A + (sum << 9 & 4294967295 | sum >>> 23);
        sum = C + (A ^ B & (D ^ A)) + X[11] + 643717713 & 4294967295;
        C = D + (sum << 14 & 4294967295 | sum >>> 18);
        sum = B + (D ^ A & (C ^ D)) + X[0] + 3921069994 & 4294967295;
        B = C + (sum << 20 & 4294967295 | sum >>> 12);
        sum = A + (C ^ D & (B ^ C)) + X[5] + 3593408605 & 4294967295;
        A = B + (sum << 5 & 4294967295 | sum >>> 27);
        sum = D + (B ^ C & (A ^ B)) + X[10] + 38016083 & 4294967295;
        D = A + (sum << 9 & 4294967295 | sum >>> 23);
        sum = C + (A ^ B & (D ^ A)) + X[15] + 3634488961 & 4294967295;
        C = D + (sum << 14 & 4294967295 | sum >>> 18);
        sum = B + (D ^ A & (C ^ D)) + X[4] + 3889429448 & 4294967295;
        B = C + (sum << 20 & 4294967295 | sum >>> 12);
        sum = A + (C ^ D & (B ^ C)) + X[9] + 568446438 & 4294967295;
        A = B + (sum << 5 & 4294967295 | sum >>> 27);
        sum = D + (B ^ C & (A ^ B)) + X[14] + 3275163606 & 4294967295;
        D = A + (sum << 9 & 4294967295 | sum >>> 23);
        sum = C + (A ^ B & (D ^ A)) + X[3] + 4107603335 & 4294967295;
        C = D + (sum << 14 & 4294967295 | sum >>> 18);
        sum = B + (D ^ A & (C ^ D)) + X[8] + 1163531501 & 4294967295;
        B = C + (sum << 20 & 4294967295 | sum >>> 12);
        sum = A + (C ^ D & (B ^ C)) + X[13] + 2850285829 & 4294967295;
        A = B + (sum << 5 & 4294967295 | sum >>> 27);
        sum = D + (B ^ C & (A ^ B)) + X[2] + 4243563512 & 4294967295;
        D = A + (sum << 9 & 4294967295 | sum >>> 23);
        sum = C + (A ^ B & (D ^ A)) + X[7] + 1735328473 & 4294967295;
        C = D + (sum << 14 & 4294967295 | sum >>> 18);
        sum = B + (D ^ A & (C ^ D)) + X[12] + 2368359562 & 4294967295;
        B = C + (sum << 20 & 4294967295 | sum >>> 12);
        sum = A + (B ^ C ^ D) + X[5] + 4294588738 & 4294967295;
        A = B + (sum << 4 & 4294967295 | sum >>> 28);
        sum = D + (A ^ B ^ C) + X[8] + 2272392833 & 4294967295;
        D = A + (sum << 11 & 4294967295 | sum >>> 21);
        sum = C + (D ^ A ^ B) + X[11] + 1839030562 & 4294967295;
        C = D + (sum << 16 & 4294967295 | sum >>> 16);
        sum = B + (C ^ D ^ A) + X[14] + 4259657740 & 4294967295;
        B = C + (sum << 23 & 4294967295 | sum >>> 9);
        sum = A + (B ^ C ^ D) + X[1] + 2763975236 & 4294967295;
        A = B + (sum << 4 & 4294967295 | sum >>> 28);
        sum = D + (A ^ B ^ C) + X[4] + 1272893353 & 4294967295;
        D = A + (sum << 11 & 4294967295 | sum >>> 21);
        sum = C + (D ^ A ^ B) + X[7] + 4139469664 & 4294967295;
        C = D + (sum << 16 & 4294967295 | sum >>> 16);
        sum = B + (C ^ D ^ A) + X[10] + 3200236656 & 4294967295;
        B = C + (sum << 23 & 4294967295 | sum >>> 9);
        sum = A + (B ^ C ^ D) + X[13] + 681279174 & 4294967295;
        A = B + (sum << 4 & 4294967295 | sum >>> 28);
        sum = D + (A ^ B ^ C) + X[0] + 3936430074 & 4294967295;
        D = A + (sum << 11 & 4294967295 | sum >>> 21);
        sum = C + (D ^ A ^ B) + X[3] + 3572445317 & 4294967295;
        C = D + (sum << 16 & 4294967295 | sum >>> 16);
        sum = B + (C ^ D ^ A) + X[6] + 76029189 & 4294967295;
        B = C + (sum << 23 & 4294967295 | sum >>> 9);
        sum = A + (B ^ C ^ D) + X[9] + 3654602809 & 4294967295;
        A = B + (sum << 4 & 4294967295 | sum >>> 28);
        sum = D + (A ^ B ^ C) + X[12] + 3873151461 & 4294967295;
        D = A + (sum << 11 & 4294967295 | sum >>> 21);
        sum = C + (D ^ A ^ B) + X[15] + 530742520 & 4294967295;
        C = D + (sum << 16 & 4294967295 | sum >>> 16);
        sum = B + (C ^ D ^ A) + X[2] + 3299628645 & 4294967295;
        B = C + (sum << 23 & 4294967295 | sum >>> 9);
        sum = A + (C ^ (B | ~D)) + X[0] + 4096336452 & 4294967295;
        A = B + (sum << 6 & 4294967295 | sum >>> 26);
        sum = D + (B ^ (A | ~C)) + X[7] + 1126891415 & 4294967295;
        D = A + (sum << 10 & 4294967295 | sum >>> 22);
        sum = C + (A ^ (D | ~B)) + X[14] + 2878612391 & 4294967295;
        C = D + (sum << 15 & 4294967295 | sum >>> 17);
        sum = B + (D ^ (C | ~A)) + X[5] + 4237533241 & 4294967295;
        B = C + (sum << 21 & 4294967295 | sum >>> 11);
        sum = A + (C ^ (B | ~D)) + X[12] + 1700485571 & 4294967295;
        A = B + (sum << 6 & 4294967295 | sum >>> 26);
        sum = D + (B ^ (A | ~C)) + X[3] + 2399980690 & 4294967295;
        D = A + (sum << 10 & 4294967295 | sum >>> 22);
        sum = C + (A ^ (D | ~B)) + X[10] + 4293915773 & 4294967295;
        C = D + (sum << 15 & 4294967295 | sum >>> 17);
        sum = B + (D ^ (C | ~A)) + X[1] + 2240044497 & 4294967295;
        B = C + (sum << 21 & 4294967295 | sum >>> 11);
        sum = A + (C ^ (B | ~D)) + X[8] + 1873313359 & 4294967295;
        A = B + (sum << 6 & 4294967295 | sum >>> 26);
        sum = D + (B ^ (A | ~C)) + X[15] + 4264355552 & 4294967295;
        D = A + (sum << 10 & 4294967295 | sum >>> 22);
        sum = C + (A ^ (D | ~B)) + X[6] + 2734768916 & 4294967295;
        C = D + (sum << 15 & 4294967295 | sum >>> 17);
        sum = B + (D ^ (C | ~A)) + X[13] + 1309151649 & 4294967295;
        B = C + (sum << 21 & 4294967295 | sum >>> 11);
        sum = A + (C ^ (B | ~D)) + X[4] + 4149444226 & 4294967295;
        A = B + (sum << 6 & 4294967295 | sum >>> 26);
        sum = D + (B ^ (A | ~C)) + X[11] + 3174756917 & 4294967295;
        D = A + (sum << 10 & 4294967295 | sum >>> 22);
        sum = C + (A ^ (D | ~B)) + X[2] + 718787259 & 4294967295;
        C = D + (sum << 15 & 4294967295 | sum >>> 17);
        sum = B + (D ^ (C | ~A)) + X[9] + 3951481745 & 4294967295;
        B = C + (sum << 21 & 4294967295 | sum >>> 11);
        this.chain_[0] = this.chain_[0] + A & 4294967295;
        this.chain_[1] = this.chain_[1] + B & 4294967295;
        this.chain_[2] = this.chain_[2] + C & 4294967295;
        this.chain_[3] = this.chain_[3] + D & 4294967295;
    };
    Md5.prototype.update = function (bytes, opt_length) {
        if (opt_length == null) {
            opt_length = bytes.length;
        }
        var lengthMinusBlock = opt_length - this.blockSize;
        var block = this.block_;
        var blockLength = this.blockLength_;
        var i = 0;
        while (i < opt_length) {
            if (blockLength === 0) {
                while (i <= lengthMinusBlock) {
                    this.compress_(bytes, i);
                    i += this.blockSize;
                }
            }
            if (typeof bytes === 'string') {
                while (i < opt_length) {
                    block[blockLength++] = bytes.charCodeAt(i++);
                    if (blockLength === this.blockSize) {
                        this.compress_(block);
                        blockLength = 0;
                        break;
                    }
                }
            } else {
                while (i < opt_length) {
                    block[blockLength++] = bytes[i++];
                    if (blockLength === this.blockSize) {
                        this.compress_(block);
                        blockLength = 0;
                        break;
                    }
                }
            }
        }
        this.blockLength_ = blockLength;
        this.totalLength_ += opt_length;
    };
    Md5.prototype.digest = function (hex) {
        var pad = new Array((this.blockLength_ < 56 ? this.blockSize : this.blockSize * 2) - this.blockLength_);
        pad[0] = 128;
        for (var i = 1; i < pad.length - 8; ++i) {
            pad[i] = 0;
        }
        var totalBits = this.totalLength_ * 8;
        for (i = pad.length - 8; i < pad.length; ++i) {
            pad[i] = totalBits & 255;
            totalBits /= 256;
        }
        this.update(pad);
        var digest = new Array(16);
        var n = 0;
        for (i = 0; i < 4; ++i) {
            for (var j = 0; j < 32; j += 8) {
                digest[n++] = this.chain_[i] >>> j & 255;
            }
        }
        if (hex === 'hex') {
            return _base2['default'].byteArrayToHex(digest);
        }
        return digest;
    };
});

define('crypto/main', [
    'exports',
    './md5',
    'babel-runtime/helpers/interop-require-default'
], function (exports, _md5, _babelRuntimeHelpersInteropRequireDefault) {
    exports.__esModule = true;
    var _Md5Hash = _babelRuntimeHelpersInteropRequireDefault['default'](_md5);
    var createHash = function createHash(type) {
        if (type === 'md5') {
            return new _Md5Hash['default']();
        }
        throw new Error('Unsupported hash type: ' + type);
    };
    exports.createHash = createHash;
});

define('crypto', ['crypto/main'], function (main) {
    return main;
});

define('slug', ['exports'], function (exports) {
    exports.__esModule = true;

    function trim(text) {
        return text.replace(/\.(md|html)$/, '');
    }

    var encode = function encode(slug) {
        var length = trim(slug).length;
        return length.toString(16).toUpperCase() + '.5C' + slug;
    };
    exports.encode = encode;
    var decode = function decode(slug) {
        if (isValid(slug)) {
            return slug.replace(/^[0-9a-z]+\.5C/gi, '');
        }
        return slug;
    };
    exports.decode = decode;
    var getDocumentPath = function getDocumentPath(opt_pathname) {
        var pathname = opt_pathname || location.pathname;
        var filename = pathname.split('/').pop();
        if (isValid(filename)) {
            return pathname.replace('/' + filename.replace(/\.(md|html)$/, ''), '');
        }
        return pathname;
    };
    exports.getDocumentPath = getDocumentPath;
    var isValid = function isValid(slug) {
        if (!slug) {
            return false;
        }
        var delimiterIndex = slug.indexOf('.5C');
        if (delimiterIndex === -1) {
            return false;
        }
        var lengthText = slug.substr(0, delimiterIndex);
        var length = parseInt(lengthText, 16);
        if (isNaN(length)) {
            return false;
        }
        return 3 + length === trim(slug).length - lengthText.length;
    };
    exports.isValid = isValid;
});

define('xtil', [
    'exports',
    'crypto',
    'babel-runtime/helpers/interop-require-default',
    './slug'
], function (exports, _crypto, _babelRuntimeHelpersInteropRequireDefault, _slug) {
    exports.__esModule = true;
    var _crypto2 = _babelRuntimeHelpersInteropRequireDefault['default'](_crypto);
    var dontEnumBug = !{toString: 1}.propertyIsEnumerable('toString');
    var inherits = function inherits(type, superType) {
        var Empty = function Empty() {
        };
        Empty.prototype = superType.prototype;
        var proto = new Empty();
        var originalPrototype = type.prototype;
        type.prototype = proto;
        for (var key in originalPrototype) {
            proto[key] = originalPrototype[key];
        }
        if (dontEnumBug) {
            if (originalPrototype.hasOwnProperty('toString')) {
                proto.toString = originalPrototype.toString;
            }
            if (originalPrototype.hasOwnProperty('valueOf')) {
                proto.valueOf = originalPrototype.valueOf;
            }
        }
        type.prototype.constructor = type;
        return type;
    };
    exports.inherits = inherits;
    var relative = function relative(from, to) {
        var trim = function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== '') {
                    break;
                }
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== '') {
                    break;
                }
            }
            if (start > end) {
                return [];
            }
            return arr.slice(start, end + 1);
        };
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        var i = 0;
        for (i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
    };
    exports.relative = relative;
    var toSlug = function toSlug(text) {
        var slug = encodeURIComponent(text.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, '')).replace(/%/g, '.');
        slug = slug.replace(/\(/g, '.28').replace(/\)/g, '.29');
        if (slug.length > 64) {
            var md5sum = _crypto2['default'].createHash('md5');
            md5sum.update(slug);
            return md5sum.digest('hex').replace(/(\w{2})/g, '.$1').toUpperCase();
        }
        return slug;
    };
    exports.toSlug = toSlug;
    var isAbsHref = function isAbsHref(href) {
        return /^(https?:)?\/\//.test(href);
    };
    exports.isAbsHref = isAbsHref;
    var fixHref = function fixHref(href) {
        if (!isAbsHref(href)) {
            var path = '';
            var hash = '';
            var placeholder = String.fromCharCode(57005) + String.fromCharCode(48879);
            if (/#/.test(href)) {
                var chunks = (placeholder + href).split(/#+/, 2);
                path = (chunks[0] || '').replace(placeholder, '');
                hash = chunks[1] || '';
                if (hash) {
                    hash = '#' + toSlug(hash);
                }
            } else {
                path = href;
            }
            if (path && !/\.(md|html?)$/.test(path)) {
                path += '.md';
            }
            if (typeof process === 'object') {
                if (process.env.NODE_ENV === 'production') {
                    path = path.replace(/\.md$/, '.html');
                }
            } else {
                if (/\.html?$/.test(location.pathname)) {
                    path = path.replace(/\.md$/, '.html');
                }
            }
            return path + hash;
        }
        return href;
    };
    exports.fixHref = fixHref;
    var escapeRegexp = function escapeRegexp(string) {
        return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/\s+/g, '\\s+');
    };
    exports.escapeRegexp = escapeRegexp;
    var unescapeHtml = function unescapeHtml(text) {
        return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D').replace(/&emsp;/g, ' ').replace(/&times;/g, '\xD7').replace(/&nbsp;/g, ' ');
    };
    exports.unescapeHtml = unescapeHtml;
    var escapeHtml = function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/“/g, '&ldquo;').replace(/”/g, '&rdquo;').replace(/ /g, '&nbsp;').replace(/×/g, '&times;');
    };
    exports.escapeHtml = escapeHtml;
    var getPathname = function getPathname(url) {
        var pathname = url;
        pathname = pathname.replace(/https?:\/\/[^\/]+/, '');
        pathname = pathname.replace(/#.*/, '');
        if (pathname === 'about:blank') {
            pathname = location.pathname;
        }
        return pathname;
    };
    var getHashname = function getHashname(url) {
        var hash = url.split('/').pop();
        if (_slug.isValid(hash)) {
            hash = _slug.decode(hash);
        }
        return '#' + hash.replace(/\.(md|html)/, '');
    };
    var resolveUrl = function resolveUrl(url) {
        var element = document.createElement('DIV');
        element.innerHTML = '<a href="' + escapeHtml(url) + '"></a>';
        var anchor = element.firstChild;
        var pathname = getPathname(anchor.href);
        return {
            pathname: _slug.getDocumentPath(pathname),
            hash: anchor.hash ? anchor.hash : getHashname(pathname)
        };
    };
    exports.resolveUrl = resolveUrl;
});

define('flags', ['exports'], function (exports) {
    exports.__esModule = true;
    var enable_account_v2 = location.host === 'cloud.baidu.com' || location.host === 'cloudtest.baidu.com';
    exports.enable_account_v2 = enable_account_v2;
});

define('help/userInfo', [
        'require',
        'jquery',
        'urijs',
        'isMobile',
        'jquery.cookie',
        '../xtil',
        '../flags'
    ],
    function (require) {
        var $ = require('jquery');
        var uri = require('urijs');
        var isMobile = require('isMobile');
        require('jquery.cookie');
        var xtil = require('../xtil');
        var FLAGS = require('../flags');
        var exports = {};
        var defaultOptions = {timeout: 3000};
        var apiHost = location.host === 'cloud.baidu.com' ? 'bce.baidu.com' : 'bcetest.baidu.com';
        /*var options = FLAGS.enable_account_v2 ? $.extend(defaultOptions, {
            url: '//' + apiHost + '/api/account/v2/displayName',
            dataType: 'jsonp'
        }) : $.extend(defaultOptions, {
            url: '/api/account/displayName',
            type: 'POST',
            dataType: 'json'
        });*/
        $.cookie.raw = true;
        exports.init = function () {
            var localUri = uri(window.location);
            if (FLAGS.enable_account_v2 && localUri.hasQuery('track')) {
                var iframeUrl = '//' + apiHost + '/helper/x.html' + location.search + '&.stamp=' + new Date().getTime();
                var iframe = $('<iframe/>').attr('src', iframeUrl).hide();
                $(document.body).append(iframe);
            }
            $('.login').show();
            /* $.ajax(options).then(function (e) {
                 var hasLogin = e.result.hasLogin === true;
                 var userType = FLAGS.enable_account_v2 ? e.result.cookies['bce-login-type'] : $.cookie('bce-login-type');
                 if (hasLogin) {
                     var name = xtil.escapeHtml(e.result.displayName);
                     var logoutUrl = '';
                     var indexUrl = 'http%3A%2F%2Fbce.baidu.com';
                     if (userType === 'UC') {
                         logoutUrl = 'http://cas.baidu.com/?action=logout&u=' + indexUrl;
                     } else if (userType === 'PASSPORT') {
                         logoutUrl = 'http://passport.baidu.com/?logout&u=' + indexUrl;
                     }
                     var userInfo = '<li class="list-nav login-li">' + '<span>' + name + '</span>' + '<ul class="sub-nav logout-nav">' + '<i class="arrow"></i>' + '<li><a href="' + logoutUrl + '">退出</a></li>' + '</ul>' + '</li>' + '<li class="beian"><a href="/beian/index.html">备案</a></li>' + '<li><a href="/forum/bce" target="_blank">论坛</a></li>' + '<li class="console"><a href="https://console.bce.baidu.com" target="_blank"><i class="iconfont icon-install"></i>管理控制台</a></li>';
                     if (isMobile.any) {
                         userInfo = '<li><a href="https://console.bce.baidu.com" target="_blank" style="color: #09F"><i class="iconfont icon-admin"></i></a></li>';
                     }
                     $('.login').html(userInfo).show();
                 } else {
                     $('.login').show();
                 }
                 if (FLAGS.enable_account_v2) {
                     for (var key in e.result.cookies) {
                         if (!e.result.cookies.hasOwnProperty(key)) {
                             continue;
                         }
                         var isTracking = key === 'CAMPAIGN_TRACK' || key === 'CAMPAIGN_TRACK_TIME';
                         if (isTracking && $.cookie(key)) {
                             continue;
                         }
                         var value = e.result.cookies[key];
                         var host = window.location.hostname;
                         if (value) {
                             if (isTracking) {
                                 $.cookie(key, value, {
                                     expires: 90,
                                     path: '/',
                                     domain: '.' + host
                                 });
                             } else {
                                 $.cookie(key, value, {
                                     path: '/',
                                     domain: '.' + host
                                 });
                             }
                         } else if (!isTracking) {
                             $.removeCookie(key, {
                                 path: '/',
                                 domain: '.' + host
                             });
                         }
                     }
                 }
             }, function () {

             });*/
        };
        return exports;
    });

define('notice/list', [
        'require',
        'jquery'
    ],
    function (require) {
        var $ = require('jquery');
        var exports = {};
        exports.init = function () {
            var noticeList = $('#notice-list');
            if (noticeList.length === 0) {
                return false;
            }
            /* $.ajax({
                 url: '/api/announcement',
                 type: 'POST',
                 dataType: 'json',
                 timeout: 3000,
                 success: function (data) {
                     if (data.success) {
                         var html = '<dl><dt>公告</dt><dd><ul>';
                         var result = data.result.length > 6 ? data.result.slice(0, 6) : data.result;
                         $.each(result, function (i, item) {
                             html += '<li><a href="/notice/index.html#' + noticeList.text(item.id).html() + '" target="_blank">[' + noticeList.text(item.createTime).html() + ']&nbsp;&nbsp;' + noticeList.text(item.title).html() + '</a></li>';
                         });
                         html += '</ul></dd></dl>';
                         noticeList.html(html);
                         showNotice(data.result);
                         indexMobileShow(data.result);
                     }
                 }
             });*/
        };

        function showNotice(list) {
            var $notice = $('.notice');
            if ($notice.length) {
                var html = '';
                for (var i = 0; i < list.length && i < 3; i++) {
                    var item = list[i];
                    html += '<li><a href="/notice/index.html#' + item.id + '" target="_blank"><i class="iconfont icon-announcement"></i>[' + item.createTime + '] ' + item.title.replace(/<.+>/g, '') + '</a></li>';
                }
                html += '<li class="more"><a href="/notice/index.html" target="_blank">更多公告 ></a><li>';
                $notice.find('ul').html(html);
                $notice.show();
            }
        }

        function indexMobileShow(list) {
            var notice = $('.index-mobile-notice');
            if (notice.length) {
                var html = '';
                for (var i = 0; i < list.length && i < 5; i++) {
                    var item = list[i];
                    html += '<li><a href="/notice/index.html#' + item.id + '" target="_blank"><strong>' + item.title.replace(/<.+>/g, '') + '</strong><span>' + item.createTime.replace(/-/g, '.') + '</span>' + '</a></li>';
                }
                notice.find('ul').html(html);
            }
        }

        return exports;
    });

define('er/assert', [], function () {
    if (window.DEBUG) {
        var assert = function (condition, message) {
            if (!condition) {
                throw new Error(message);
            }
        };
        assert.has = function (obj, message) {
            assert(obj != null, message);
        };
        assert.equals = function (x, y, message) {
            assert(x === y, message);
        };
        assert.hasProperty = function (obj, propertyName, message) {
            assert(obj[propertyName] != null, message);
        };
        assert.lessThan = function (value, max, message) {
            assert(value < max, message);
        };
        assert.greaterThan = function (value, min, message) {
            assert(value > min, message);
        };
        assert.lessThanOrEquals = function (value, max, message) {
            assert(value <= max, message);
        };
        assert.greaterThanOrEquals = function (value, min, message) {
            assert(value >= min, message);
        };
        return assert;
    } else {
        var assert = function () {
        };
        assert.has = assert;
        assert.equals = assert;
        assert.hasProperty = assert;
        assert.lessThan = assert;
        assert.greaterThan = assert;
        assert.lessThanOrEquals = assert;
        assert.greaterThanOrEquals = assert;
        return assert;
    }
});

define('PopMenu', [
        'require',
        'jquery',
        'underscore',
        'er/assert'
    ],
    function (require) {
        var $ = require('jquery');
        var u = require('underscore');
        var assert = require('er/assert');

        function PopMenu(options) {
            var defaultConfig = {
                triggerPanel: '.nav-types',
                floatPanel: '.nav-content',
                deg: 60,
                moveTimer: null,
                enterTimer: null,
                currentNum: null,
                pointerCollect: []
            };
            u.extend(this, defaultConfig, options || {});
            this.initialize();
        }

        PopMenu.prototype = {
            constructor: PopMenu,
            initialize: function () {
                this.triggerPanel = $(this.triggerPanel);
                this.floatPanel = $(this.floatPanel);
                assert.greaterThan(this.triggerPanel.size(), 0, 'TriggerPanel is not existed!');
                assert.greaterThan(this.floatPanel.size(), 0, 'FloatPanel is not existed!');
                var radian = this.deg * (2 * Math.PI / 360);
                this.tan = Math.tan(radian);
                this.currentNum = this.currentNum || this.triggerPanel.find('.current').attr('data-type-num') || 0;
                this.onPageLoaded(this.currentNum, true);
                this.initEvents();
            },
            initEvents: function () {
                this.triggerPanel.on('mousemove', u.throttle(u.bind(this.onItemMove, this), 0));
                this.triggerPanel.on('mouseleave', u.bind(this.clear, this));
                this.triggerPanel.on('mouseenter', '[data-type-num]', u.bind(this.onItemEnter, this));
                this.isBind = true;
                this.isFirstIn = true;
                this.triggerPanel.on('mouseleave', '[data-type-num]', u.bind(this.onItemLeave, this));
            },
            onItemMove: function (e) {
                var me = this;
                me.pointerCollect.push({
                    x: e.pageX,
                    y: e.pageY
                });
                if (me.pointerCollect.length > 4) {
                    me.pointerCollect.shift();
                    if (this.isFirstIn) {
                        me.reBindItemEnter();
                        $(e.target).trigger('mouseenter');
                        this.isFirstIn = false;
                    } else {
                        var start = u.first(me.pointerCollect);
                        var end = u.last(me.pointerCollect);
                        var a = end.x - start.x;
                        var b = end.y - start.y;
                        var tan = Math.abs(b / a);
                        tan <= me.tan && a > 0 ? me.slantMove(e) : me.verticalMove(e);
                    }
                }
                clearTimeout(me.enterTimer);
                me.enterTimer = setTimeout(function () {
                    $(e.target).trigger('mouseenter');
                }, 300);
            },
            slantMove: function (e) {
                this.unBindItemEnter(e);
            },
            verticalMove: function (e) {
                this.reBindItemEnter();
            },
            unBindItemEnter: function () {
                this.triggerPanel.off('mouseenter', '[data-type-num]');
                this.isBind = false;
                clearTimeout(this.moveTimer);
                this.moveTimer = setTimeout(u.bind(this.reBindItemEnter, this), 100);
            },
            reBindItemEnter: function () {
                clearTimeout(this.moveTimer);
                if (!this.isBind) {
                    this.triggerPanel.on('mouseenter', '[data-type-num]', u.bind(this.onItemEnter, this));
                    this.isBind = true;
                }
            },
            onPageLoaded: function (e, force) {
                this.triggerPanel.find('[data-type-num=0]').addClass('current');
                this.floatPanel.find('[data-type-num=0]').addClass('current');
                if (+this.currentNum === 9 || +this.currentNum === 1 || +this.currentNum === 0) {
                    this.floatPanel.parents('.products-nav').addClass('double-col');
                } else {
                    this.floatPanel.parents('.products-nav').removeClass('double-col');
                }
                if (+this.currentNum === 2) {
                    this.floatPanel.parents('.solution-nav').addClass('double-col');
                } else {
                    this.floatPanel.parents('.solution-nav').removeClass('double-col');
                }
            },
            onItemEnter: function (e, force) {
                var targetElem = $(e.currentTarget);
                var currentElem = targetElem.parent().find('.current');
                var targetIndex = targetElem.index();
                var currentIndex = currentElem.index();
                var targetContent = targetElem.parent().next().find('[data-type-num]')[targetIndex];
                if (targetIndex === currentIndex) {
                    return;
                }
                targetElem.addClass('current').siblings().removeClass('current');
                $(targetContent).addClass('current').siblings().removeClass('current');
                if ($(targetContent).attr('data-isdouble') === 'true') {
                    targetElem.parents('.nav-group').parent().addClass('double-col');
                } else {
                    targetElem.parents('.nav-group').parent().removeClass('double-col');
                }
            },
            onItemLeave: function (e) {
                clearTimeout(this.enterTimer);
            },
            clear: function (e) {
                this.isFirstIn = true;
                this.pointerCollect = [];
                clearTimeout(this.moveTimer);
                clearTimeout(this.enterTimer);
                this.moveTimer = null;
                this.enterTimer = null;
            }
        };
        return PopMenu;
    });

define('help/industry-v2', [
        'exports',
        'module'
    ],
    function (exports, module) {
        module.exports = [
            '网站',
            '建站服务',
            '数字推广营销',
            '游戏',
            '移动应用',
            '电子商务',
            '金融',
            '视频',
            '智能设备',
            '教育',
            '医疗',
            'SAAS应用',
            '行业解决方案',
            '广播电视',
            '物流',
            '政府',
            '农业',
            '通信电子',
            '制造业',
            '房地产建筑',
            '能源',
            '其他'
        ];
    });

define('io', [
        'exports',
        'jquery',
        'babel-runtime/helpers/interop-require-default'
    ],
    function (exports, _jquery, _babelRuntimeHelpersInteropRequireDefault) {
        exports.__esModule = true;
        var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
        var ajax = function ajax(api, data) {
            return _$['default'].ajax({
                url: api,
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(data ? data : '')
            });
        };
        exports.ajax = ajax;
        var ajaxHeader = function ajaxHeader(api, data, header) {
            return _$['default'].ajax({
                url: api,
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(data ? data : ''),
                headers: header && !_$['default'].isEmptyObject(header) ? header : null
            });
        };
        exports.ajaxHeader = ajaxHeader;
    });

define('feedBackSubmmitTrack', [
        'exports',
        'module',
        'crypto',
        'babel-runtime/helpers/interop-require-default',
        'isMobile',
        'urijs'
    ],
    function (exports, module, _crypto, _babelRuntimeHelpersInteropRequireDefault, _isMobile, _urijs) {
        var _crypto2 = _babelRuntimeHelpersInteropRequireDefault['default'](_crypto);
        var _isMobile2 = _babelRuntimeHelpersInteropRequireDefault['default'](_isMobile);
        var _uri = _babelRuntimeHelpersInteropRequireDefault['default'](_urijs);
        var feedBackSummitTrack = function feedBackSummitTrack(obj) {
            var search = location.search;
            var from = search ? _uri['default'].parseQuery(location.search).uifrom : '';
            var uifrom = from ? '&uifrom=' + from : '';
            var platform = _isMobile2['default'].any ? '&platform=mobile' : '&platform=pc';
            var path = undefined;
            var pathname = location.pathname + location.hash + location.search + 'formTrack';
            var md5 = _crypto2['default'].createHash('md5');
            md5.update(pathname);
            path = md5.digest('hex');
            var uidString = '';
            var trackString = '';
            var tt = new Date().getTime();
            if (!obj.attr('uid') && window.formTrackIndex) {
                uidString = path + '-' + window.formTrackIndex;
                obj.attr('uid', uidString);
            } else {
                uidString = obj.attr('uid');
            }
            trackString += 'tt:' + tt + '|et:click' + '|es:提交反馈' + '|area:' + '|uid:' + uidString + '|VideoPos:|videoOffset:|videoDura:|playTime:;';
            /*new Image().src = '/img/bh.gif?bh=' + encodeURIComponent(trackString) + uifrom + platform;
            trackString = '';*/
        };
        module.exports = feedBackSummitTrack;
    });

define('common/businessFeedback', [
    'exports',
    'babel-runtime/helpers/class-call-check',
    'jquery',
    'babel-runtime/helpers/interop-require-default',
    'underscore',
    '../help/industry-v2',
    '../io',
    '../feedBackSubmmitTrack'
], function (exports, _babelRuntimeHelpersClassCallCheck, _jquery, _babelRuntimeHelpersInteropRequireDefault, _underscore, _helpIndustryV2, _io, _feedBackSubmmitTrack) {
    exports.__esModule = true;
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var _u = _babelRuntimeHelpersInteropRequireDefault['default'](_underscore);
    var _industry = _babelRuntimeHelpersInteropRequireDefault['default'](_helpIndustryV2);
    var _io2 = _babelRuntimeHelpersInteropRequireDefault['default'](_io);
    var _feedBackSubmmitTrack2 = _babelRuntimeHelpersInteropRequireDefault['default'](_feedBackSubmmitTrack);
    var campaignId = '20170407-businessFeedback-apply';
    var api = '/api/survey/no_need_login/apply';
    var uiMap = function uiMap(item) {
        var ui = undefined;
        switch (item.type) {
            case 'text':
                ui = '<input type="text" name="' + item.id + '" id="' + item.id + '" placeholder="' + item.placeholder + '"/>';
                break;
            case 'textarea':
                ui = '<textarea name="' + item.id + '" id="' + item.id + '" placeholder="' + item.placeholder + '"></textarea>';
                break;
            case 'radio':
                ui = [];
                for (var i = 0; i < item.list.length; i++) {
                    ui.push('<label><input type="radio" name="' + item.id + '" value="' + item.list[i].name + '" />\n                <i></i>\n                <span class="radio-text">' + item.list[i].name + '</span></label>');
                }
                ui = ui.join('');
                break;
            case 'select':
                ui = [];
                ui.push('<div id="' + item.id + '" name="' + item.id + '"><i class="iconfont icon-scroll-top"></i><div class="selectArea"><i class="iconfont icon-xialajiantou"></i><span class="currentIndustry">请选择所属行业</span></div><ul>');
                for (var i = 0; i < item.list.length; i++) {
                    ui.push('<li>' + item.list[i] + '</li>');
                }
                ui.push('</ul></div>');
                ui = ui.join('');
                break;
        }
        return '<div class="form-row">\n                <div class="row-left">\n                    <i>' + (item.require ? '*' : '&nbsp;') + '</i>' + item.name + '\n                </div>\n                <div class="row-right">' + ui + '</div>\n            </div>';
    };
    var summitMap = function summitMap(item, box) {
        var value = undefined;
        switch (item.type) {
            case 'text':
                value = box.find('[name = "' + item.id + '"]').val();
                break;
            case 'textarea':
                value = box.find('[name = "' + item.id + '"]').val();
                break;
            case 'radio':
                value = box.find('[name = "' + item.id + '"]').filter(':checked').val();
                break;
            case 'select': {
                value = box.find('[name = "' + item.id + '"]').find('span').text();
                value = value == '请选择所属行业' ? '' : value;
            }
                break;
        }
        return value;
    };
    var resizeFun = function resizeFun() {
        var box = _$['default']('#business-feedback-box');
        if (!box[0]) {
            return;
        }
        var currentTop = _$['default']('.fixedbar').position().top;
        var detalTop = _$['default']('.business-consulting').position().top;
        box.find('.arrow').css({
            top: currentTop + detalTop + 15 + 'px',
            right: '71px'
        });
        var maxHeight = box.height();
        var height = box.find('.form-box').outerHeight();
        if (height > maxHeight) {
            box.addClass('overflow');
        } else {
            box.removeClass('overflow');
        }
    };
    var selectList = function selectList() {
        var cur = _$['default']('#industry span');
        var list = _$['default']('#industry ul');
        var selectArea = _$['default']('#industry .selectArea');
        selectArea.on('click', function (e) {
            cur.addClass('clickSel').siblings('.icon-xialajiantou').css('display', 'none');
            list.show();
            cur.parent().siblings('.icon-scroll-top').css('display', 'block');
            e.stopPropagation();
        });
        list.find('li').on('click', function () {
            cur.html(_$['default'](this).html());
            listHide(cur, list);
        });
        _$['default'](document).on('click', function () {
            listHide(cur, list);
        });
    };
    var listHide = function listHide(cur, list) {
        list.hide();
        cur.removeClass('clickSel');
        _$['default']('#industry').find('.icon-scroll-top').css('display', 'none');
        _$['default']('#industry').find('.icon-xialajiantou').css('display', 'block');
    };
    var Feedback = function () {
        function Feedback() {
            _babelRuntimeHelpersClassCallCheck['default'](this, Feedback);
            this.hasInit = false;
            this.question = [
                {
                    name: '咨询类型',
                    id: 'consultType',
                    type: 'radio',
                    list: [
                        {name: '售前咨询'},
                        {name: '售后咨询'},
                        {name: '活动咨询'},
                        {name: '商务合作'},
                        {name: '百度网盘'}
                    ],
                    require: true,
                    validate: function validate(text) {
                        return !text || text && text.length <= 100;
                    },
                    validateText: '请选择咨询类型',
                    placeholder: '请选择咨询类型'
                },
                {
                    name: '产品类型',
                    id: 'consultProduct',
                    require: true,
                    type: 'text',
                    validate: function validate(text) {
                        return text && text.length > 0 && text.length < 100;
                    },
                    validateText: '请输入您需要咨询的产品/解决方案的名称或类型',
                    placeholder: '请输入您需要咨询的产品/解决方案的名称或类型'
                },
                {
                    name: '咨询内容',
                    id: 'consultContent',
                    type: 'textarea',
                    require: true,
                    validate: function validate(text) {
                        return !text || text && text.length <= 1000;
                    },
                    validateText: '请详细描述您需要咨询的内容便于我们为您提供更精准的服务',
                    placeholder: '请详细描述您需要咨询的内容便于我们为您提供更精准的服务'
                },
                {
                    name: '身份类型',
                    id: 'identity',
                    type: 'radio',
                    list: [
                        {
                            name: '企业',
                            question: [{
                                name: '企业名称',
                                id: 'company',
                                require: true,
                                type: 'text',
                                validate: function validate(text) {
                                    return text && text.length > 0 && text.length <= 100;
                                },
                                validateText: '企业名称不为空或不超过100字',
                                placeholder: '请输入您所在的企业名称'
                            }]
                        },
                        {name: '个人'}
                    ],
                    require: true,
                    validate: function validate(text) {
                        return !text || text && text.length <= 100;
                    },
                    validateText: '企业名称不为空或不超过100字'
                },
                {
                    name: '所属行业',
                    id: 'industry',
                    type: 'select',
                    list: _industry['default'],
                    require: false,
                    validate: function validate(text) {
                        return true;
                    },
                    validateText: '请输入所属行业',
                    placeholder: '请输入所属行业'
                },
                {
                    name: '真实姓名',
                    id: 'name',
                    require: true,
                    type: 'text',
                    validate: function validate(text) {
                        return text && text.length > 0 && text.length < 100;
                    },
                    validateText: '请输入您的真实姓名便于我们与您联系',
                    placeholder: '请输入您的真实姓名便于我们与您联系'
                },
                {
                    name: '手机号码',
                    id: 'telephone',
                    type: 'text',
                    require: true,
                    validate: function validate(text) {
                        return /^1[0-9]{10}$/.test(text);
                    },
                    validateText: '请正确输入您的手机号码',
                    placeholder: '请正确输入您的手机号码'
                },
                {
                    name: '电子邮件',
                    id: 'email',
                    type: 'text',
                    require: true,
                    validate: function validate(text) {
                        return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(text);
                    },
                    validateText: '请输入您的电子邮箱地址',
                    placeholder: '请输入您的电子邮箱地址'
                }
            ];
        }

        Feedback.prototype.getHtml = function getHtml() {
            var question = this.question;
            var html = [];
            html = _u['default'].map(question, function (item) {
                return uiMap(item);
            });
            html = html.join('');
            return html;
        };
        Feedback.prototype.init = function init() {
            if (!this.form) {
                this.form = '\n                <div class="form-box">\n                    <form>\n                        ' + this.getHtml() + '\n                        <div class="form-row submit-row">\n                            <div class="row-right">\n                                <input track-form="咨询栏\uFF1A提交按钮" type="submit" value="提交" class="submit" id="bfsubmit" />\n                            </div>\n                        </div>\n                    </form>\n                </div>';
            }
        };
        Feedback.prototype.valid = function valid(data) {
            var isAllPass = true;
            _u['default'].each(this.question, function (item, i) {
                var val = data[i];
                var isRequire = !item.require || val;
                var isValid = item.validate(val);
                var isPass = isRequire && isValid;
                isAllPass = isAllPass && isPass;
                if (!isPass) {
                    var validText = !isRequire ? '请填写' + item.name : item.validateText;
                    var html = '<span class="valid">' + validText + '</span>';
                    _$['default']('[name = ' + item.id + ']').parents('.form-row').addClass('validdisable').append(html);
                }
            });
            return isAllPass;
        };
        Feedback.prototype.successSubmit = function successSubmit(code) {
            var box = _$['default']('#business-feedback-box');
            var warmReminder = '<div class="warm-reminder"><h4>温馨提示</h4><p>1. 产品使用中遇到问题\uFF0C欢迎您来 <a href="/forum/bce" target="_blank">论坛</a> 进行交流</p><p>2. 紧急问题建议提交 <a href="http://ticket.bce.baidu.com" target="_blank">工单</a> 或致电4008-777-818</p></div>';
            var text = code === 0 ? '<div class="submit-success"><i class="iconfont icon-correct"></i></div><h2>提交成功</h2>' + warmReminder + '<a class="toForum" href="/forum/bce" target="_blank">去论坛看看</a>' : '<div class="submit-fail"><i class="iconfont icon-warning-mark"></i></div><h2 class="failed-to-submit">提交失败</h2>' + warmReminder + '<a class="submit-again" target="_blank">再次提交</a>';
            var oForm = box.find('form');
            var oH3 = box.find('h3');
            var oHint = box.find('.hint');
            var oSpread = box.find('.spread');
            oH3.remove();
            oHint.remove();
            oSpread.remove();
            oForm.detach();
            var html = '<div class="response-show">\n                ' + text + '\n            </div>';
            box.find('.form-box').append(html);
            box.css('height', '665px');
            box.find('.submit-again').on('click', function () {
                var oFormBox = box.find('.form-box');
                oFormBox.before(oH3);
                oFormBox.append(oForm);
                oFormBox.after(oHint);
                _$['default']('.response-show').remove();
            });
        };
        Feedback.prototype.fromEvent = function fromEvent() {
            var _this = this;
            var box = _$['default']('#business-feedback-box');
            if (!box[0]) {
                return;
            }
            box.find('form').on('submit', function () {
                var submit = _$['default']('#bfsubmit');
                submit.attr('disabled', 'disabled');
                var valueList = _u['default'].map(_this.question, function (item) {
                    var val = summitMap(item, box);
                    var row = _$['default']('[name = "' + item.id + '"]').parents('.form-row');
                    var nextSub = row.next('[sublist]');
                    if (nextSub[0]) {
                        val = val + ('\uFF1A' + nextSub.find('input').val());
                    }
                    return val;
                });
                var isCooperation = valueList[0] === '商务合作';
                if (_this.valid(valueList)) {
                    var formData = {
                        campaignId: campaignId,
                        questions: _u['default'].map(_this.question, function (item, index) {
                            return {
                                title: index === 1 && isCooperation ? '合作类型' : item.name,
                                answers: [{answer: valueList[index] || ''}]
                            };
                        })
                    };
                    _feedBackSubmmitTrack2['default'](submit);
                    _io2['default'].ajax(api, formData).done(function (response) {
                        if (response.success) {
                            _this.successSubmit(response.result.code);
                        } else {
                            _this.successSubmit(response.result.code);
                        }
                    }).fail(function (response) {
                        _this.successSubmit(444);
                    }).always(function () {
                        submit.removeAttr('disabled');
                    });
                } else {
                    submit.removeAttr('disabled');
                }
                return false;
            });
            var me = this;
            box.find('[type = "radio"]').on('change', function () {
                var id = _$['default'](this).attr('name');
                var val = _$['default'](this).val();
                var haslist = _u['default'].find(me.question, function (item) {
                    return item.id === id;
                });
                if (haslist) {
                    var sq = _u['default'].find(haslist.list, function (i) {
                        return i.question && i.name === val;
                    });
                    if (!(sq && sq.question && sq.question[0])) {
                        _$['default'](this).parents('.form-row').next('[sublist]').remove();
                        return;
                    }
                    var html = _$['default'](uiMap(sq.question[0]));
                    _$['default'](this).parents('.form-row').after(html);
                    if (_$['default']('[name = "consultType"]:checked').val() == '售后咨询') {
                        _$['default']('#company').attr('placeholder', '请输入您开通产品时的认证企业名称');
                    }
                    html.attr('sublist', 'true');
                }
            });
        };
        return Feedback;
    }();
    var eventBind = function eventBind() {
        _$['default']('.business-consulting, footer .footer-feedback').on('click', function () {
            if (_$['default']('#business-feedback-box')[0]) {
                _$['default']('#business-feedback-box').remove();
                _$['default'](this).removeClass('current-box');
                return;
            }
            if (_$['default']('.fixed-box')) {
                _$['default']('.fixed-box').remove();
            }
            var me = _$['default'](this);
            var feedback = _$['default']('<div id="business-feedback-box" class="business-feedback-box fixed-box"><div class="arrow"></div><div class="close-ui"><i class="iconfont icon-close"></i></div><h3>业务咨询</h3></div>');
            me.addClass('current-box').siblings().removeClass('current-box');
            var bfo = new Feedback();
            bfo.init();
            _$['default']('body').append(feedback);
            feedback.append(bfo.form);
            _$['default']('<div class="hint"><div class="hint-left">特别提示\uFF1A</div><div class="hint-content">您填写并提交的上述信息视为您同意百度云及百度云授权的合作伙伴通过电话方式联系您完善信息\uFF0C以便能够为您提供更贴心的云服务\u3002</div></div>').insertAfter('.form-box');
            var box = _$['default']('#business-feedback-box');
            var winH = _$['default'](window).height();
            box.css('max-height', winH - 8);
            bfo.fromEvent();
            box.find('input, textarea, select').on('change', function () {
                _$['default'](this).parents('.form-row').removeClass('validdisable').find('.valid').remove();
            });
            selectList();
            box.find('.close-ui').on('click', function () {
                box.remove();
                me.removeClass('current-box');
            });
            var toTop = me.offset().top - _$['default'](document).scrollTop();
            var toBottom = _$['default'](window).height() - toTop - me.height();
            if (_$['default'](window).height() > toBottom + 712) {
                box.css('bottom', toBottom + 'px');
            }
            box.find('[type = "radio"]').parent().hover(function () {
                _$['default'](this).css('color', '#108CEE');
            }, function () {
                if (!_$['default'](this).hasClass('radioChecked')) {
                    _$['default'](this).css('color', '#333');
                }
            });
            box.find('[type = "radio"]').click(function () {
                _$['default'](this).parent().addClass('radioChecked').siblings().removeClass('radioChecked').css('color', '#333');
            });
            var hasHint = true;
            var hint = undefined, spread = undefined;
            box.find('[name = "consultType"]').change(function () {
                var siblings = _$['default'](this).parents('.form-row').siblings('.form-row');
                if (_$['default'](this).val() == '百度网盘') {
                    siblings.css('display', 'none');
                    _$['default'](this).parents('.form-row').after('<p class="movePan">关于百度网盘的问题咨询\uFF0C请您移步至百度网盘官网<a>pan.baidu.com</a>进行咨询\u3002</p><p class="panHint">本站是百度云的官方网站\uFF0C是由百度提供的集\u201C云计算\u3001大数据和人工智能\u201D为一体的云计算平台\u3002旨在为社会各个行业提供最安全\u3001高性能\u3001智能的计算和数据处理服务\uFF0C让智能的云计算成为社会发展的新引擎\u3002</p>');
                    hint = box.find('.hint').detach();
                    hasHint = false;
                    var consultBtn = _$['default']('.business-consulting');
                    var _toTop = consultBtn.offset().top - _$['default'](document).scrollTop();
                    var _toBottom = _$['default'](window).height() - _toTop - consultBtn.height();
                    box.css({
                        'height': '310px',
                        'top': 'auto',
                        'bottom': _toBottom + 'px'
                    });
                } else {
                    siblings.css('display', 'block');
                    _$['default']('.movePan').remove();
                    _$['default']('.panHint').remove();
                    if (!hasHint) {
                        box.append(hint);
                        hasHint = true;
                    }
                    box.css({'height': 'auto'});
                    if (_$['default'](window).height() > toBottom + 712) {
                        box.css('bottom', toBottom + 'px');
                    } else {
                        box.css('bottom', '5px');
                    }
                }
                if (_$['default'](this).val() == '售后咨询') {
                    _$['default']('#company').attr('placeholder', '请输入您开通产品时的认证企业名称');
                    _$['default']('#telephone').attr('placeholder', '请输入您开通产品时的认证手机号码');
                } else {
                    _$['default']('#company').attr('placeholder', '请输入您所在的企业名称');
                    _$['default']('#telephone').attr('placeholder', '请正确输入您的手机号码');
                }
                if (_$['default'](this).val() === '商务合作') {
                    var ele = _$['default']('#consultProduct');
                    ele.parent().prev().html('<i>*</i>合作类型');
                    ele.attr('placeholder', '请输入您需要咨询的合作类型');
                } else {
                    var ele = _$['default']('#consultProduct');
                    ele.parent().prev().html('<i>*</i>产品类型');
                    ele.attr('placeholder', '请输入您需要咨询的产品/解决方案的名称或类型');
                }
            });
            box.find('select').before('<i class="iconfont icon-xialajiantou selectArrow"></i>');
        });
        _$['default']('.fixedbar .scroll-top').on('click', function () {
            _$['default']('html, body').animate({scrollTop: 0});
        });
    };
    var init = function init() {
        eventBind();
    };
    exports.init = init;
});

define('common/contactUs', [
    'exports',
    'jquery',
    'babel-runtime/helpers/interop-require-default'
], function (exports, _jquery, _babelRuntimeHelpersInteropRequireDefault) {
    exports.__esModule = true;
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var eventBind = function eventBind() {
        _$['default']('.contact-us').on('click', function () {
            if (_$['default']('#contact-us-box')[0]) {
                _$['default']('#contact-us-box').remove();
                _$['default'](this).removeClass('current-box');
                return;
            }
            if (_$['default']('.fixed-box')) {
                _$['default']('.fixed-box').remove();
            }
            _$['default'](this).addClass('current-box').siblings().removeClass('current-box');
            var contact = _$['default']('<div id="contact-us-box" class="contact-us-box fixed-box"><div class="arrow"></div><div class="close-ui"><i class="iconfont icon-close"></i></div><h3>联系我们</h3><p><i class="iconfont icon-customer-tel"></i>客服电话\uFF1A4008-777-818</p><p><i class="iconfont icon-pre-sale-tel"></i>售前电话\uFF1A4008-777-818转1</p><p><i class="iconfont icon-record-help"></i>备案帮助\uFF1A4008-777-818转3</p></div>');
            _$['default']('body').append(contact);
            var contactBox = _$['default']('#contact-us-box');
            var me = _$['default'](this);
            contactBox.find('.close-ui').on('click', function () {
                contactBox.remove();
                me.removeClass('current-box');
            });
            var toTop = _$['default'](this).offset().top - _$['default'](document).scrollTop();
            var toBottom = _$['default'](window).height() - toTop - me.height();
            contactBox.css({
                'top': 'auto',
                'bottom': toBottom + 'px'
            });
        });
    };
    var init = function init() {
        eventBind();
    };
    exports.init = init;
});

define('help/formTrack', [
    'exports',
    'module',
    'jquery',
    'babel-runtime/helpers/interop-require-default',
    'crypto',
    'isMobile',
    'urijs'
], function (exports, module, _jquery, _babelRuntimeHelpersInteropRequireDefault, _crypto, _isMobile, _urijs) {
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var _crypto2 = _babelRuntimeHelpersInteropRequireDefault['default'](_crypto);
    var _isMobile2 = _babelRuntimeHelpersInteropRequireDefault['default'](_isMobile);
    var _uri = _babelRuntimeHelpersInteropRequireDefault['default'](_urijs);
    var fromTrack = function fromTrack() {
        var formTrack = _$['default']('[track-form]');
        var trackString = '';
        var timer = undefined;
        var search = location.search;
        var from = search ? _uri['default'].parseQuery(location.search).uifrom : '';
        var uifrom = from ? '&uifrom=' + from : '';
        var platform = _isMobile2['default'].any ? '&platform=mobile' : '&platform=pc';
        var requestid = _uri['default'].parseQuery(location.search).requestid;
        var pathname = undefined;
        var path = undefined;
        window.formTrackIndex = 0;
        var trackMsg = function trackMsg() {
            pathname = location.pathname + location.hash + location.search + 'formTrack';
            var md5 = _crypto2['default'].createHash('md5');
            md5.update(pathname);
            path = md5.digest('hex');
        };
        var addBh = function addBh(ET, ES, AREA, UID) {
            var tt = new Date().getTime();
            trackString += 'tt:' + tt + '|et:' + ET + '|es:' + ES + '|area:' + AREA + '|uid:' + UID + '|VideoPos:|videoOffset:|videoDura:|playTime:;';
            if (encodeURIComponent(trackString.length) > 500) {
                sendBh();
                clearInterval(timer);
                startInterval(30);
            }
        };
        var sendBh = function sendBh() {
            /* new Image().src = '/img/bh.gif?bh=' + encodeURIComponent(trackString) + uifrom + platform;
             trackString = '';*/
        };
        var bind = function bind(obj) {
            obj.map(function () {
                var me = _$['default'](this);
                if (typeof me.attr('uid') == 'undefined') {
                    var uid = path + '-' + window.formTrackIndex;
                    me.attr('uid', uid);
                    window.formTrackIndex++;
                }
                me.on('click', function (e) {
                    addBh('click', me.attr('track-form'), '', me.attr('uid'));
                });
            });
        };
        var startInterval = function startInterval(interval) {
            timer = setInterval(function () {
                if (trackString.length > 0) {
                    sendBh();
                }
            }, 1000 * interval);
        };
        if (formTrack.length !== 0) {
            trackMsg();
            bind(formTrack);
            window.onbeforeunload = function () {
                if (trackString.length > 0) {
                    sendBh();
                }
            };
            window.onload = function () {
                sendBh();
            };
            startInterval(30);
        }
    };
    module.exports = fromTrack;
});

define('common', [
    'require',
    'jquery',
    'isMobile',
    'underscore',
    './help/userInfo',
    './notice/list',
    './PopMenu',
    './common/businessFeedback',
    './common/contactUs',
    './help/formTrack'
], function (require) {
    var $ = require('jquery');
    var isMobile = require('isMobile');
    var u = require('underscore');
    var helpInfo = require('./help/userInfo');
    var notice = require('./notice/list');
    var PopMenu = require('./PopMenu');
    var businessFeedback = require('./common/businessFeedback');
    var contactUs = require('./common/contactUs');
    var formTrack = require('./help/formTrack');
    var exports = {};
    exports.init = function () {
        helpInfo.init();
        businessFeedback.init();
        contactUs.init();
        $(window).on('scroll', function () {
            var winToTop = $(window).scrollTop();
            if (winToTop >= 300) {
                $('.scroll-top').show();
            } else {
                $('.scroll-top').hide();
            }
        });
        $(document).ready(function () {
            var $body = $('body');
            if (isMobile.any) {
                $body.delegate('.list-nav', 'touchend', function (e) {
                    $('.sub-nav').hide();
                    $(this).find('.sub-nav').show();
                });
                $body.on('touchend', function (e) {
                    var el = e.target;
                    if ($(el).closest('.list-nav').length === 0) {
                        $('.sub-nav').hide();
                    }
                });
            } else {
                $body.delegate('.list-nav', 'mouseover', function (e) {
                    $(this).find('.sub-nav').delay(10).show();
                });
                $body.delegate('.list-nav', 'mouseleave', function (e) {
                    if (!e.toElement || e.toElement && e.toElement.tagName !== 'IMG') {
                        $(this).find('.sub-nav').hide();
                    }
                });
                $body.delegate('.sub-nav', 'mouseleave', function (e) {
                    $(this).hide();
                });
                var header = $('header');
                var products = $('.products-nav');
                var allProductNav = $('.all-products-nav');

                function removeAllProduct(productsNav) {
                    productsNav.addClass('noallproduct');
                    productsNav.find('.all-products-nav').removeClass('current').next().addClass('current');
                    productsNav.find('.all-product').removeClass('current').next().addClass('current');
                }

                var subSection = products.parents('section');
                if (header.css('position') === 'fixed') {
                    removeAllProduct(products);
                } else if (products.length > 1) {
                    products.each(function (index, ele) {
                        if ($(ele).attr('data-noallproduct') === 'true') {
                            removeAllProduct($(ele));
                        }
                    });
                }
            }
            new PopMenu();
            var time;

            function callback(search) {
                if (search.hasClass('current') && !$('#header-search-input').val() && document.activeElement.id !== 'header-search-input') {
                    $('#header-search-input').animate({width: '0px'}, 300, 'linear', function () {
                        search.removeClass('current');
                        isMobile.any && search.prev('ul').show();
                    });
                }
            }

            var searchBlur = function (e) {
                var search = $(this).parents('.header-search');
                time = setTimeout(u.bind(callback, window, search), 300);
            };
            $('#header-search-input').on('blur', searchBlur).on('focus', function () {
                var search = $(this).parents('.header-search');
                if (!search.hasClass('current')) {
                    search.addClass('current');
                    var width = $(this).data('width');
                    if (!width) {
                        width = isMobile.any ? '100px' : '147px';
                    }
                    $('#header-search-input').animate({width: width}, 300);
                }
                isMobile.any && search.prev('ul').hide();
            });
            $('#header-search-button').on('click', function () {
                clearTimeout(time);
                $('#header-search-input').trigger('focus');
            });
            $('#header-search-input').val('');
            notice.init();
        });
        $(document).on('click', 'a[rel="noreferrer"]', function () {
            var href = $(this).attr('href');
            window.open('/relay.html?url=' + encodeURIComponent(href), '_blank');
            return false;
        });
        $('#header-search-button').click(function () {
            var query = $('#header-search-input').val();
            if ($.trim(query) !== '') {
                $('#header-search-form').submit();
            }
        });
        $('.tab-navigator > ul').on('mouseenter', 'a', function (e) {
            var $link = $(this);
            var $tabNavigator = $link.closest('.tab-navigator');
            $tabNavigator.find('>ul >li').removeClass('selected');
            $tabNavigator.find('>div').removeClass('selected');
            var target = $link.closest('li').addClass('selected').data('target');
            $tabNavigator.children('div').each(function () {
                $(this).toggleClass('selected', $(this).hasClass(target));
            });
        });
        formTrack();
    };
    return exports;
});

define('help/cssSupport', [
    'exports',
    'module'
], function (exports, module) {
    var backgroundSizeSupport = function backgroundSizeSupport() {
        var style = document.body.style;
        return 'backgroundSize' in style;
    };
    var transformSupport = function transformSupport() {
        var style = document.body.style;
        return 'backgroundSize' in style;
    };
    module.exports = {
        backgroundSize: backgroundSizeSupport(),
        transform: transformSupport()
    };
});

define('help/solutionTrack', [
    'exports',
    'module',
    'jquery',
    'babel-runtime/helpers/interop-require-default',
    'crypto',
    'isMobile',
    'urijs'
], function (exports, module, _jquery, _babelRuntimeHelpersInteropRequireDefault, _crypto, _isMobile, _urijs) {
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var _crypto2 = _babelRuntimeHelpersInteropRequireDefault['default'](_crypto);
    var _isMobile2 = _babelRuntimeHelpersInteropRequireDefault['default'](_isMobile);
    var _uri = _babelRuntimeHelpersInteropRequireDefault['default'](_urijs);
    var trackInit = function trackInit(pathname, playerList) {
        var bothTrack = _$['default']('[track-both]');
        var hoverTrack = _$['default']('[track-hover]');
        var clickTrack = _$['default']('[track-click]');
        var trackString = '';
        var timer = undefined;
        var search = location.search;
        var from = search ? _uri['default'].parseQuery(location.search).uifrom : '';
        var uifrom = from ? '&uifrom=' + from : '';
        var index = 0;
        var platform = _isMobile2['default'].any ? '&platform=mobile' : '&platform=pc';
        var requestid = _uri['default'].parseQuery(location.search).requestid;
        if (!pathname) {
            pathname = window.location.pathname;
        }
        var md5 = _crypto2['default'].createHash('md5');
        md5.update(pathname);
        path = md5.digest('hex');
        var setInfo = function setInfo(video, type, msg, event) {
            var UID = _$['default'](video.getContainer()).parent().attr('uid');
            var tt = new Date().getTime();
            var playTime = '';
            var videoDura = video.getDuration();
            var videoPos = video.getPosition();
            if (type !== 'play') {
                if (video.videostart) {
                    playTime = (+tt - +video.videostart) / 1000;
                    video.videostart = false;
                } else {
                    playTime = 0;
                }
            }
            video.isPlayed = type === 'play' ? true : false;
            if (type === 'seek') {
                video.videostart = tt;
                trackString += 'tt:' + tt + '|et:video-' + type + '|es:' + msg + '|area:' + '' + '|uid:' + UID + '|VideoPos:' + videoPos + '|videoOffset:' + event.offset + '|videoDura:' + videoDura + '|playTime:' + playTime + ';';
            } else {
                trackString += 'tt:' + tt + '|et:video-' + type + '|es:' + msg + '|area:' + '' + '|uid:' + UID + '|VideoPos:' + videoPos + '|videoOffset:|videoDura:' + videoDura + '|playTime:' + playTime + ';';
            }
        };
        var videoEvent = function videoEvent() {
            playerList = playerList.length > 0 ? playerList : [playerList];
            playerList.forEach(function (video) {
                video.onReady(function () {
                    video.duration = video.getDuration();
                }).onPlay(function () {
                    video.videostart = new Date().getTime();
                    if (video.isPlayed !== true) {
                        setInfo(video, 'play', '开始播放');
                        video.isPlayed = true;
                    }
                }).onPause(function () {
                    setInfo(video, 'pause', '暂停播放');
                }).onSeek(function (event) {
                    setInfo(video, 'seek', '进度条拖动', event);
                }).onBeforeComplete(function () {
                    setInfo(video, 'complete', '播放完毕');
                    sendBh();
                }).onStop(function () {
                    setInfo(video, 'stop', '停止播放');
                    sendBh();
                });
            });
        };
        var richEditorElement = function richEditorElement() {
            var richEditor = _$['default']('[track-rich]');
            if (richEditor.length !== 0) {
                var elementA = richEditor.find('a');
                _$['default'](elementA).filter(function () {
                    if (_$['default'](this).attr('uid')) {
                        return false;
                    }
                    var text = '链接:' + _$['default'](this).text();
                    _$['default'](this).attr('track-click', text);
                });
                bind(elementA, 'click', 'track-click');
            }
        };
        var calculatorTrack = function calculatorTrack() {
            var calculatorContent = _$['default']('[track-calculator]');
            if (calculatorContent.length !== 0) {
                bind(calculatorContent, 'click', 'track-calculator');
            }
        };
        var addBh = function addBh(ET, ES, AREA, UID) {
            var tt = new Date().getTime();
            trackString += 'tt:' + tt + '|et:' + ET + '|es:' + ES + '|area:' + AREA + '|uid:' + UID + '|VideoPos:|videoOffset:|videoDura:|playTime:;';
            if (encodeURIComponent(trackString.length) > 500) {
                sendBh();
                clearInterval(timer);
                startInterval(30);
            }
        };
        var sendBh = function sendBh() {
            /* new Image().src = '/img/bh.gif?bh=' + encodeURIComponent(trackString) + uifrom + platform;
             trackString = '';*/
        };
        var startInterval = function startInterval(interval) {
            timer = setInterval(function () {
                if (trackString.length > 0) {
                    sendBh();
                }
            }, 1000 * interval);
        };
        var bind = function bind(obj, type, prop) {
            obj.map(function () {
                var me = _$['default'](this);
                if (typeof me.attr('uid') == 'undefined') {
                    var uid = path + '-' + index;
                    me.attr('uid', uid);
                    index++;
                }
                me.on(type, function (e) {
                    if (type === 'mouseenter') {
                        type = 'hover';
                    }
                    if (prop === 'track-calculator') {
                        var target = _$['default'](e.target);
                        var value = target.text();
                        var title = me.attr('track-calculator');
                        addBh(type, title + ':' + value, '', me.attr('uid'));
                    } else {
                        addBh(type, me.attr(prop), '', me.attr('uid'));
                    }
                });
            });
        };
        var drawData = function drawData(data) {
            _$['default'].each(data, function (idx, obj) {
                var ele = _$['default']('[uid="' + path + '-' + obj.name + '"]');
                var mask = _$['default']('<span class="showData">' + obj.value + '</span>');
                if (ele.css('position') == 'static') {
                    ele.css('position', 'relative');
                }
                mask.appendTo(ele);
            });
        };
        if (requestid) {
            _$['default'].ajax({
                type: 'get',
                url: '/pageclick?requestid=' + requestid,
                timeout: 3000,
                dataType: 'json',
                success: function success(data) {
                    var obj = _$['default'].parseJSON(data[0]);
                    if (obj.success) {
                        drawData(obj.result);
                    } else {
                        console.log('获取数据失败');
                    }
                },
                error: function error() {
                    console.log('ajax失败');
                }
            });
        }
        bind(hoverTrack, 'mouseenter', 'track-hover');
        bind(clickTrack, 'click', 'track-click');
        bind(bothTrack, 'mouseenter', 'track-both');
        bind(bothTrack, 'click', 'track-both');
        richEditorElement();
        calculatorTrack();
        if (playerList && playerList.length !== 0) {
            videoEvent();
        }
        _$['default'](window).on('scroll', function () {
            var scrollTimer = undefined;
            return function () {
                if (scrollTimer)
                    clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function () {
                    var area = _$['default'](window).scrollTop();
                    addBh('scroll', '页面滑动', area, '');
                }, 500);
            };
        }());
        window.onbeforeunload = function () {
            if (trackString.length > 0) {
                sendBh();
            }
        };
        window.onload = function () {
            sendBh();
        };
        startInterval(30);
    };
    module.exports = trackInit;
});

define('common/scanDownload', [
    'exports',
    'jquery',
    'babel-runtime/helpers/interop-require-default'
], function (exports, _jquery, _babelRuntimeHelpersInteropRequireDefault) {
    exports.__esModule = true;
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var eventBind = function eventBind() {
        _$['default']('.scan-download').on('click', function () {
            if (_$['default']('#scan-download-box')[0]) {
                _$['default']('#scan-download-box').remove();
                _$['default'](this).removeClass('current-box');
                return;
            }
            if (_$['default']('.fixed-box')) {
                _$['default']('.fixed-box').remove();
            }
            _$['default'](this).addClass('current-box').siblings().removeClass('current-box');
            var scan = _$['default']('<div id="scan-download-box" class="scan-download-box fixed-box"><div class="arrow"></div><div class="close-ui"><i class="iconfont icon-close"></i></div><h3>扫描下载</h3><div class="QR-code"><img width="100" height="100" src="/img/appQR.png" /><p>百度云App</p></div><div class="QR-code"><img width="100" height="100" src="/img/publicQR.png" /><p>百度云公众号</p></div></div>');
            _$['default']('body').append(scan);
            var scanBox = _$['default']('#scan-download-box');
            var me = _$['default'](this);
            scanBox.find('.close-ui').on('click', function () {
                scanBox.remove();
                me.removeClass('current-box');
            });
            var toTop = me.offset().top - _$['default'](document).scrollTop();
            var toBottom = _$['default'](window).height() - toTop - me.height();
            scanBox.css({
                'top': 'auto',
                'bottom': toBottom + 'px'
            });
        });
    };
    var init = function init() {
        eventBind();
    };
    exports.init = init;
});

define('index', [
    'exports',
    'babel-runtime/helpers/class-call-check',
    'jquery',
    'babel-runtime/helpers/interop-require-default',
    'etpl',
    './common',
    './io',
    './help/cssSupport',
    './help/solutionTrack',
    './common/scanDownload'
], function (exports, _babelRuntimeHelpersClassCallCheck, _jquery, _babelRuntimeHelpersInteropRequireDefault, _etpl, _common, _io, _helpCssSupport, _helpSolutionTrack, _commonScanDownload) {
    exports.__esModule = true;
    var _$ = _babelRuntimeHelpersInteropRequireDefault['default'](_jquery);
    var _etpl2 = _babelRuntimeHelpersInteropRequireDefault['default'](_etpl);
    var _common2 = _babelRuntimeHelpersInteropRequireDefault['default'](_common);
    var _io2 = _babelRuntimeHelpersInteropRequireDefault['default'](_io);
    var _cssSupport = _babelRuntimeHelpersInteropRequireDefault['default'](_helpCssSupport);
    var _trackInt = _babelRuntimeHelpersInteropRequireDefault['default'](_helpSolutionTrack);
    var _scanDownload = _babelRuntimeHelpersInteropRequireDefault['default'](_commonScanDownload);
    var _exports = {};
    var kSlideCount = _$['default']('.slide-canvas .container').length;
    var prevIndex = 0;
    var bgSize = _cssSupport['default'].backgroundSize;
    var isIe8 = document.all && !document.addEventListener ? true : false;
    var ie9 = document.all && !window.atob;

    function change(index) {
        var $containers = _$['default']('.slides .container');
        var covers = _$['default']('.cover');
        var curContainer = $containers.eq(index).css('zIndex', 0);
        var curFigcaption = curContainer.find('figcaption');
        var curCover = covers.eq(index);
        var preCover = covers.eq(prevIndex);
        var siblings = $containers.eq(prevIndex);
        var curImg = curContainer.find('img');
        _$['default']('.slide-canvas').attr('class', 'slide-canvas slide-' + index);
        _$['default']('.slides nav ul').toggleClass('darkbg', true);
        _$['default']('.slide-btn').toggleClass('darkbg', true);
        var hidepadding = index !== 0 || index !== 1 ? 0 : -40;
        var showpadding = 0;
        if (index !== 0 || index !== 1) {
            curImg.css({bottom: '-40px'});
        }
        curContainer.css({opacity: 0}).show();
        curFigcaption.css({marginLeft: hidepadding});
        curCover.css('display', 'block');
        siblings.hide();
        preCover.hide();
        curContainer.animate({opacity: 1}, 400);
        curFigcaption.animate({marginLeft: showpadding}, 400);
        curImg.animate({bottom: 0}, 1000);
        siblings.css('zIndex', 0);
        curContainer.css('zIndex', 1);
        _$['default']('.slides nav ul li').eq(index).addClass('current').siblings().removeClass('current');
        prevIndex = index;
    }

    var product1 = function product1() {
        var block = _$['default']('.product .group-show .product-block');
        block.find('.product-brief').on('mouseover', function () {
            var ele = _$['default'](this);
            if (!ele.parent().hasClass('active')) {
                ele.parent().addClass('active').siblings().removeClass('active');
                var index = ele.parent().data('index');
                if (index == 1) {
                    ele.parent().next().find('.product-brief').css('border-left', '1px solid transparent');
                } else if (index == 0) {
                    ele.parent().next().next().find('.product-brief').css('border-left', '1px solid #ddd');
                }
            }
        });
        block.find('.product-details .product-intro').hover(function () {
            _$['default'](this).find('.product-desc').css('border-color', 'transparent');
            if (_$['default'](this).prev()) {
                _$['default'](this).prev().find('.product-desc').css('border-color', 'transparent');
            }
        }, function () {
            _$['default'](this).find('.product-desc').css('border-color', '#E9E9E9');
            if (_$['default'](this).prev()) {
                _$['default'](this).prev().find('.product-desc').css('border-color', '#E9E9E9');
            }
        });
    };
    var platform = function platform() {
        var isHoverCells = 0;
        var currentCenter = _$['default']('#sun .center-icon').attr('id');
        var clickId;
        var move;
        var fourPlatforms = {
            base: [
                '基础云',
                '/img/index/base.png'
            ],
            ai: [
                '天智',
                '/img/index/ai.png'
            ],
            bigdata: [
                '天算',
                '/img/index/bigdata.png'
            ],
            iot: [
                '天工',
                '/img/index/iot.png'
            ],
            media: [
                '天像',
                '/img/index/media.png'
            ]
        };
        var isAnimate = false;
        if (isIe8) {
            var introContent = _$['default']('.introduction .content');
            introContent.find('.content-item').fadeOut();
            introContent.find('#platform-base').fadeIn();
            _$['default']('#center2').css('display', 'none');
            _$['default']('#wrp .sphere1').css('display', 'none');
            _$['default']('#wrp .sphere2').css('display', 'none');
            _$['default']('#wrp .cells h3').css('border', 'none');
        }
        var oCell = _$['default']('#cell');
        if (!isHoverCells) {
            oCell.addClass('wave');
        }
        var wavelet = setInterval(function () {
            if (!isHoverCells) {
                oCell.addClass('wave');
            }
        }, 10000);
        oCell.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            _$['default'](this).removeClass('wave');
        });
        var center = _$['default']('#center');
        var center2 = _$['default']('#center2');
        _$['default']('#aniwrp .cells').click(function () {
            if (!isAnimate) {
                isAnimate = true;
                center.addClass('center-move');
                center2.addClass('center2-move');
                clickId = _$['default'](this).attr('dataid');
                var appearTxt = '.texttitle-' + clickId;
                var disappearTxt = '.texttitle-' + currentCenter;
                var wrp = _$['default']('#wrp');
                wrp.find(appearTxt).addClass('appear').siblings().removeClass('appear');
                wrp.find(disappearTxt).addClass('disappear').siblings().removeClass('disappear');
                wrp.find(disappearTxt).addClass('disappear-texttitle ');
                if (ie9) {
                    if (wrp.find('.appear').hasClass('disappear-texttitle')) {
                        wrp.find('.appear').removeClass('disappear-texttitle');
                    }
                    if (wrp.find('.disappear').hasClass('disappear-texttitle')) {
                        wrp.find('.disappear').removeClass('disappear-texttitle');
                    }
                    wrp.find('.appear').css('display', 'block');
                    wrp.find('.disappear').css('display', 'none');
                }
                var clickCell = _$['default']('div[dataid =' + clickId + ']');
                clickCell.find('h3 span').text(fourPlatforms[currentCenter][0]).css('opacity', 0).delay(1200).animate({opacity: 1}, 800);
                if (!ie9) {
                    var iconNum = _$['default'](this).attr('id');
                    switch (iconNum) {
                        case 'cell-1':
                            move = 'appear-cell1';
                            break;
                        case 'cell-2':
                            move = 'appear-cell2';
                            break;
                        case 'cell-3':
                            move = 'appear-cell3';
                            break;
                        case 'cell-4':
                            move = 'appear-cell4';
                            break;
                    }
                    _$['default'](this).addClass(move);
                }
                var contentId = 'platform-' + clickId;
                _$['default']('.introduction').find('#' + contentId).addClass('active').siblings().removeClass('active');
                if (isIe8) {
                    _$['default']('.introduction .content').find('.active').fadeIn().siblings().fadeOut();
                }
                var _this = _$['default'](this);
                setTimeout(function () {
                    _$['default']('#sun').find('#' + currentCenter).removeClass('center-icon');
                    _$['default']('#sun').find('#' + clickId).attr('class', 'center-icon');
                    clickCell.removeClass(move);
                    clickCell.find('img').attr('src', fourPlatforms[currentCenter][1]);
                    clickCell.attr('dataid', currentCenter);
                    currentCenter = clickId;
                    _$['default']('#center').removeClass('center-move');
                    center2.removeClass('center2-move');
                    isAnimate = false;
                }, 2000);
            }
        });
        _$['default']('#aniwrp .cells').hover(function () {
            isHoverCells = 1;
            _$['default'](this).addClass('cells-hover');
        }, function () {
            isHoverCells = 0;
            _$['default'](this).removeClass('cells-hover');
        });
    };
    var NumberGrow = function NumberGrow(element, options) {
        options = options || {};
        var $this = _$['default'](element), time = options.time || $this.data('time'),
            num = options.num || $this.data('value'), step = num * 16 / (time * 1000), start = 0, interval, old = 0;
        interval = setInterval(function () {
            start = start + step;
            if (start >= num) {
                clearInterval(interval);
                interval = undefined;
                start = num;
            }
            var t;
            if ($this.hasClass('reliability-data')) {
                t = start.toFixed(9);
            } else {
                t = Math.floor(start);
            }
            if (t == old) {
                return;
            }
            old = t;
            if ($this.hasClass('reliability-data')) {
                $this.text(old.toString());
            } else {
                $this.text(old.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,'));
            }
        }, 16);
    };
    var event = function event() {
        var eventInterval = [
            0,
            0,
            0,
            0
        ];
        var isHover = [
            0,
            0,
            0,
            0
        ];
        var oL = _$['default']('.event-list .event-link');
        oL.hover(function () {
            _$['default'](this).addClass('event-in');
            var _this = _$['default'](this);
            var index = _$['default'](this).index();
            isHover[index] = 1;
            eventInterval[index] = setInterval(function () {
                if (isHover[index]) {
                    _this.addClass('event-in');
                }
            }, 3600);
        }, function () {
            var index1 = _$['default'](this).index();
            isHover[index1] = 0;
        });
        oL.on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            var index2 = _$['default'](this).index();
            if (isHover[index2] === 0) {
                _$['default'](this).removeClass('event-in');
                clearInterval(eventInterval[index2]);
            } else {
                _$['default'](this).removeClass('event-in');
            }
        });
    };
    var certiDisplay = function certiDisplay() {
        var certi = _$['default']('.certification-display .group ul');
        var outerW = certi.find('li').eq(0).outerWidth();
        var ln = certi.children().length;
        var isRun = false;
        move = function () {
            var liFirst = certi.children().eq(0);
            if (!isRun) {
                isRun = true;
                liFirst.animate({marginLeft: -outerW + 'px'}, 600, function () {
                    liFirst.css('margin-left', '26px').appendTo(certi);
                    isRun = false;
                });
            }
        };
        var arrow = _$['default']('.certification-display .arrow');
        arrow.find('.arrow-right').on('click', function () {
            clearInterval(imgMove);
            move();
            imgMove = setInterval(move, 2000);
        });
        arrow.find('.arrow-left').on('click', function () {
            if (!isRun) {
                isRun = true;
                clearInterval(imgMove);
                var _ln = certi.children().length - 1;
                var liLast = certi.children().eq(_ln);
                certi.prepend(liLast);
                certi.css('left', -outerW);
                certi.animate({left: 0}, 600, function () {
                    certi.css('left', '0');
                    imgMove = setInterval(move, 2000);
                    isRun = false;
                });
            }
        });
        var imgMove = setInterval(move, 2000);
        certi.find('li').hover(function () {
            clearInterval(imgMove);
        }, function () {
            imgMove = setInterval(move, 2000);
        });
    };
    var ParallaxPart = function () {
        function ParallaxPart(el) {
            this.$el = _$['default'](el);
            this.speed = this.$el.attr('parallax-speed') || 0.3;
            this.maxScroll = this.$el.attr('parallax-max-scroll') || 50;
            this.imgHeight = this.$el.attr('parallax-img-height') || 0;
            this.staticTop = this.$el.offset().top;
            this.edge = [
                Math.max(this.staticTop - this.maxScroll / this.speed, 0),
                Math.min(this.staticTop + this.$el.height() + this.maxScroll / this.speed, document.body.offsetHeight)
            ];
            this.y = (this.$el.height() - this.imgHeight) / 2;
            this.limit = [
                -(this.imgHeight - this.$el.height()),
                0
            ];
        }

        ParallaxPart.prototype.update = function (dist, y) {
            if (y > this.edge[0] && y < this.edge[1]) {
                var d = -dist * this.speed;
                var py = this.y + d;
                if (py < this.limit[0]) {
                    py = this.limit[0];
                } else if (py > this.limit[1]) {
                    py = this.limit[1];
                }
                this.setY(py);
                this.y = py;
            }
        };
        ParallaxPart.prototype.setY = function (val) {
            this.$el.css('background-position', '50% ' + val + 'px');
        };
        return ParallaxPart;
    }();
    var ParallaxManager = function () {
        var _parts = [];
        var _y = Math.max(window.pageYOffset, 0);

        function ParallaxManager(elements) {
            var eleIsArray = undefined;
            if (Array.isArray) {
                eleIsArray = Array.isArray(elements);
            } else {
                eleIsArray = Object.prototype.toString.call(elements) === '[object Array]';
            }
            if (eleIsArray && elements.length) {
                this.elements = elements;
            }
            if (typeof elements === 'object' && elements.item) {
                this.elements = Array.prototype.slice.call(elements);
            } else if (typeof elements === 'string') {
                this.elements = document.querySelectorAll(elements);
                if (this.elements.length === 0) {
                    throw new Error('Parallax: No elements found');
                }
                this.elements = Array.prototype.slice.call(this.elements);
            }
            for (var i in this.elements) {
                _parts.push(new ParallaxPart(this.elements[i]));
            }
            _$['default'](window).on('scroll', onScroll);
        }

        var onScroll = function onScroll() {
            (function () {
                var lastTime = 0;
                var vendors = [
                    'webkit',
                    'moz'
                ];
                for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
                }
                if (!window.requestAnimationFrame) {
                    window.requestAnimationFrame = function (callback, element) {
                        var currTime = new Date().getTime();
                        var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                        var id = window.setTimeout(function () {
                            callback(currTime + timeToCall);
                        }, timeToCall);
                        lastTime = currTime + timeToCall;
                        return id;
                    };
                }
                if (!window.cancelAnimationFrame) {
                    window.cancelAnimationFrame = function (id) {
                        clearTimeout(id);
                    };
                }
            }());
            window.requestAnimationFrame(scrollHandler);
        };
        var scrollHandler = function scrollHandler() {
            var y = Math.max(window.pageYOffset, 0);
            var dist = y - _y;
            for (var i in _parts) {
                _parts[i].update(dist, y);
            }
            _y = y;
        };
        return ParallaxManager;
    }();
    var solution1 = function solution1() {
        _$['default']('.solution .sidebar li').eq(1).find('a').css('border-color', 'transparent');
        var oS = _$['default']('.solution .sidebar li:first');
        if (isIe8) {
            _$['default']('.content-item').fadeOut();
            _$['default']('#solutionwebsite').fadeIn();
        }
        _$['default']('.solution .sidebar li').hover(function () {
            if (oS != _$['default'](this)) {
                oS.find('a').css('border-color', '#333');
                if (oS.next()) {
                    oS.next().find('a').css('border-color', '#333');
                }
            }
            _$['default'](this).addClass('hover').siblings().removeClass('hover');
            _$['default'](this).find('a').css('border-color', 'transparent');
            if (_$['default'](this).next()) {
                _$['default'](this).next().find('a').css('border-color', 'transparent');
            }
            var active = _$['default'](this).data('id');
            _$['default']('.solution .solution-bg').css('background', '#000 url(./img/index/solution-' + active + '.png) top center no-repeat');
            var content = 'solution' + active;
            _$['default']('#' + content).addClass('active').siblings().removeClass('active');
            if (isIe8) {
                _$['default']('#' + content).fadeIn().siblings().fadeOut();
            }
            oS = _$['default'](this);
        }, function () {
            _$['default'](this).removeClass('hover');
            _$['default'](this).find('a').css('border-color', '#333');
            if (_$['default'](this).next()) {
                _$['default'](this).next().find('a').css('border-color', '#333');
            }
        });
        _$['default']('.solution .sidebar').on('mouseout', function () {
            oS.addClass('hover');
            oS.find('a').css('border-color', 'transparent');
            if (oS.next()) {
                oS.next().find('a').css('border-color', 'transparent');
            }
        });
    };
    var Solution = function () {
        function Solution() {
            _babelRuntimeHelpersClassCallCheck['default'](this, Solution);
            this.active = 'website';
        }

        Solution.prototype.init = function init() {
            var _this = this;
            _$['default']('.solution .sidebar li').eq(1).find('a').css('border-top', 'none');
            _$['default']('.solution .sidebar li').on('click', function () {
                var $thisNav = _$['default'](this);
                var last = _$['default']('.solution .sidebar .active');
                var active = $thisNav.data('id');
                var content = 'solution' + active;
                last.find('a').css('border-top', '1px solid #454545');
                if (last.next()) {
                    last.next().find('a').css('border-top', '1px solid #454545');
                }
                $thisNav.addClass('active').siblings().removeClass('active');
                _$['default']('#' + content).addClass('active').siblings().removeClass('active');
                _this.active = active;
                _$['default'](this).find('a').css('border', 'none');
                if (_$['default'](this).next()) {
                    _$['default'](this).next().find('a').css('border', 'none');
                }
            }).hover(function () {
                _$['default'](this).addClass('hover');
                _$['default'](this).find('a').css('border-top', 'none');
                if (_$['default'](this).next()) {
                    _$['default'](this).next().find('a').css('border-top', 'none');
                }
            }, function () {
                _$['default'](this).removeClass('hover');
                if (_$['default'](this).next()) {
                    if (_$['default'](this).next().hasClass('active')) {
                        _$['default'](this).next().find('a').css('border-top', 'none');
                        _$['default'](this).find('a').css('border-top', '1px solid #454545');
                        return;
                    }
                }
                if (_$['default'](this).prev()) {
                    if (_$['default'](this).prev().hasClass('active')) {
                        _$['default'](this).find('a').css('border-top', 'none');
                        if (_$['default'](this).next()) {
                            _$['default'](this).next().find('a').css('border-top', '1px solid #454545');
                        }
                        return;
                    }
                }
                if (!_$['default'](this).hasClass('active')) {
                    _$['default'](this).find('a').css('border-top', '1px solid #454545');
                    if (_$['default'](this).next()) {
                        _$['default'](this).next().find('a').css('border-top', '1px solid #454545');
                    }
                }
            });
        };
        return Solution;
    }();
    var init = function init() {
        _$['default'](document).ready(function () {
            var flag = true;
            var dataFlag = true;
            var height = _$['default'](window).height();
            var scrollTopInit = _$['default'](window).scrollTop();
            var oDataContainer = _$['default']('.data-center .container');
            if (_$['default']('.data-center').offset().top - scrollTopInit <= height) {
                oDataContainer.addClass('data-center-show');
                flag = false;
            }
            if (_$['default']('.data .support-data').offset().top + _$['default']('.data .support-data').height() - scrollTopInit <= height) {
                _$['default']('[data-ride="numberGrow"]').each(function () {
                    NumberGrow(this);
                });
                dataFlag = false;
            }
            _$['default'](window).on('scroll', function () {
                var dataCenterTop = _$['default']('.data-center').offset().top + _$['default']('.data-center').height() / 2;
                var dataTop = _$['default']('.data .support-data').offset().top + _$['default']('.data .support-data').height();
                var scrollTop = _$['default'](window).scrollTop();
                var windowHeight = _$['default'](window).height();
                if (dataCenterTop - scrollTop <= windowHeight && flag) {
                    oDataContainer.addClass('data-center-show');
                    flag = false;
                }
                if (dataTop - scrollTop <= windowHeight && dataFlag) {
                    _$['default']('[data-ride="numberGrow"]').each(function () {
                        NumberGrow(this);
                    });
                    dataFlag = false;
                }
            });
            if (isIe8) {
                var eventList = _$['default']('.event-list');
                eventList.find('.event-dot1').css('display', 'none');
                eventList.find('.event-dot2').css('display', 'none');
                _$['default']('.slides .switch-btn').css('display', 'none');
            }
            ParallaxManager([
                '.solution-bg',
                '.data-center-bg'
            ]);
            product1();
            solution1();
            platform();
            certiDisplay();
        });
        _common2['default'].init();
        if (!bgSize) {
            _$['default']('.slide-canvas').attr('class', 'slide-canvas slide-' + 'bgSize-disable-0');
        }
        var i = 0;
        var timer = setInterval(function () {
            i++;
            if (i === kSlideCount) {
                i = 0;
            }
            change(i);
        }, 5000);
        _$['default']('.slides nav li').click(function (e) {
            var $this = _$['default'](this);
            if ($this.is('.current')) {
                return;
            }
            clearInterval(timer);
            $this.addClass('current').siblings().removeClass('current');
            var index = $this.index();
            i = index;
            change(index);
            timer = setInterval(function () {
                i++;
                if (i === kSlideCount) {
                    i = 0;
                }
                change(i);
            }, 5000);
        });
        _$['default']('.slides .slide-btn').click(function (e) {
            var next = i + (_$['default'](this).hasClass('left') ? -1 : 1);
            var index = (next < 0 || next > kSlideCount ? kSlideCount - 1 : next) % kSlideCount;
            clearInterval(timer);
            _$['default']('.slides nav ul li').eq(index).addClass('current').siblings().removeClass('current');
            i = index;
            change(index);
            timer = setInterval(function () {
                i++;
                if (i === kSlideCount) {
                    i = 0;
                }
                change(i);
            }, 5000);
        });
        var $slides = _$['default']('.slides');
        $slides.mouseover(function (e) {
            clearInterval(timer);
        });
        $slides.mouseleave(function (e) {
            clearInterval(timer);
            timer = setInterval(function () {
                i++;
                if (i === kSlideCount) {
                    i = 0;
                }
                change(i);
            }, 5000);
        });
        _trackInt['default']();
        event();
        _scanDownload['default'].init();
    };
    exports.init = init;
});
define('solution/iot/index', [
    'require',
    'underscore',
    'esui/lib',
    'jquery',
    'etpl',
    '../../common',
    '../../io'
], function (require) {
    var u = require('underscore');
    var lib = require('esui/lib');
    var $ = require('jquery');
    var etpl = require('etpl');
    var common = require('../../common');
    var io = require('../../io');
    var exports = {};
    var CURRENTCLASSNAME = 'current';
    let ParallaxPart = function () {
        function ParallaxPart(el) {
            this.$el = $(el);
            this.speed = this.$el.attr('parallax-speed') || 0.3;
            this.maxScroll = this.$el.attr('parallax-max-scroll') || 50;
            this.imgHeight = this.$el.attr('parallax-img-height') || 0;
            this.staticTop = this.$el.offset().top;
            this.edge = [
                Math.max(this.staticTop - this.maxScroll / this.speed, 0),
                Math.min(this.staticTop + this.$el.height() + this.maxScroll / this.speed, document.body.offsetHeight)
            ];
            this.y = (this.$el.height() - this.imgHeight) / 2;
            this.limit = [
                -(this.imgHeight - this.$el.height()),
                0
            ];
        }

        ParallaxPart.prototype.update = function (dist, y) {
            if (y > this.edge[0] && y < this.edge[1]) {
                let d = -dist * this.speed;
                let py = this.y + d;
                if (py < this.limit[0]) {
                    py = this.limit[0];
                } else if (py > this.limit[1]) {
                    py = this.limit[1];
                }
                this.setY(py);
                this.y = py;
            }
        };
        ParallaxPart.prototype.setY = function (val) {
            this.$el.css('background-position', `50% ${ val }px`);
        };
        return ParallaxPart;
    }();
    let ParallaxManager = function () {
        let _parts = [];
        let _y = Math.max(window.pageYOffset, 0);

        function ParallaxManager(elements) {
            if (Array.isArray(elements) && elements.length) {
                this.elements = elements;
            }
            if (typeof elements === 'object' && elements.item) {
                this.elements = Array.prototype.slice.call(elements);
            } else if (typeof elements === 'string') {
                this.elements = document.querySelectorAll(elements);
                if (this.elements.length === 0) {
                    throw new Error('Parallax: No elements found');
                }
                this.elements = Array.prototype.slice.call(this.elements);
            }
            for (var i in this.elements) {
                _parts.push(new ParallaxPart(this.elements[i]));
            }
            window.addEventListener('scroll', onScroll);
        }

        let onScroll = function () {
            window.requestAnimationFrame(scrollHandler);
        };
        let scrollHandler = function () {
            let y = Math.max(window.pageYOffset, 0);
            let dist = y - _y;
            for (var i in _parts) {
                _parts[i].update(dist, y);
            }
            _y = y;
        };
        return ParallaxManager;
    }();
    var Interval = {
        interval: '',
        start: function (direction) {
            interval = setInterval(function () {
                let scroll = $('#verifiedDeviceList').scrollLeft();
                if (direction === 'right') {
                    $('#verifiedDeviceList').scrollLeft(scroll - 10);
                } else {
                    $('#verifiedDeviceList').scrollLeft(scroll + 10);
                }
            }, 50);
        },
        stop: function () {
            interval && clearInterval(interval);
        }
    };

    function loadVerifiedDevices() {
        /* io.ajax('/api/iot/device/list', {}).done(function (res) {
             if (res.success && res.result && res.result.length > 0) {
                 var result = res.result;
                 var arr = [];
                 u.each(result, function (item) {
                     var properties = item.properties;
                     var t = (!properties.nolink || +properties.nolink === 0 ? '<a class="device-box" href="device_detail.html?deviceId=' + item.deviceId + '">' : '<div class="device-box">') + '<li data-case-tab="' + item.deviceId + '">' + '<div class="verify-overview">' + '<img src="' + properties.deviceBannerUrl + '" title="' + properties.name + '" />' + '<span class="verify-title">' + properties.name + '</span>' + '<span class="verity-brand">' + properties.brandName + '</span>' + '</div>' + '</li>' + (!properties.nolink || +properties.nolink === 0 ? '</a>' : '</div>');
                     arr.push(t);
                 });
                 $('#verifiedDeviceList').html(arr.join(''));
                 $('#verify-right').mouseover(function () {
                     Interval.start('left');
                 });
                 $('#verify-right').mouseout(function () {
                     Interval.stop();
                 });
                 $('#verify-left').mouseover(function () {
                     Interval.start('right');
                 });
                 $('#verify-left').mouseout(function () {
                     Interval.stop();
                 });
             }
         });*/
        $('#verify-right').mouseover(function () {
            Interval.start('left');
        });
        $('#verify-right').mouseout(function () {
            Interval.stop();
        });
        $('#verify-left').mouseover(function () {
            Interval.start('right');
        });
        $('#verify-left').mouseout(function () {
            Interval.stop();
        });
    }

    class Feature {
        constructor() {
            this.current = 'product-hub';
        }

        init() {
            let _this = this;
            $('.ai-tab-nav li').on('click', function () {
                let $thisNav = $(this);
                let last = _this.current;
                let current = $thisNav.data('tab');
                $(`.${ last }`).add(`div[data-tab-content="${ last }"]`).removeClass(CURRENTCLASSNAME);
                $thisNav.add(`div[data-tab-content="${ current }"]`).addClass(CURRENTCLASSNAME);
                _this.current = current;
            }).hover(function () {
                $(this).addClass('ai-hover');
            }, function () {
                $(this).removeClass('ai-hover');
            });
        }
    }

    class Solution {
        constructor(x, y) {
            this.current = 'common';
        }

        init() {
            let _this = this;
            let curr = _this.current;
            $('.solution-item').hover(u.throttle(function (e) {
                let $el = $(this);
                let current = $el.data('solution-key');
                let last = _this.current;
                if (last === current)
                    return;
                $el.addClass(CURRENTCLASSNAME);
                $(`div[data-solution-key="${ last }"]`).removeClass(CURRENTCLASSNAME);
                $(`div[data-solution-key="${ last }"] img`).addClass('solution-img');
                $(`div[data-solution-key="${ current }"] img`).removeClass('solution-img');
                _this.current = current;
            }, 100));
        }
    }

    class Case {
        constructor() {
            this.current = 'kejiyuan';
        }

        init() {
            let _this = this;
            $('.right-btn').on('click', function () {
                let last = _this.current;
                if (last !== 'jikekeji') {
                    let $thisNav = $(`.case-tab-nav .${ last }`).next();
                    let $thisContent = $(`.cases-content .${ last }`).next();
                    let current = $thisContent.data('case-content');
                    _this.current = operateCaseClass($thisNav, $thisContent, last, current);
                }
            });
            $('.left-btn').on('click', function () {
                let last = _this.current;
                if (last !== 'kejiyuan') {
                    let $thisNav = $(`.case-tab-nav .${ last }`).prev();
                    let $thisContent = $(`.cases-content .${ last }`).prev();
                    let current = $thisContent.data('case-content');
                    _this.current = operateCaseClass($thisNav, $thisContent, last, current);
                }
            });
            $('.case-tab-nav li').on('click', function () {
                let last = _this.current;
                let $thisNav = $(this);
                let current = $thisNav.data('case-tab');
                let $thisContent = $(`.cases-content .${ current }`);
                _this.current = operateCaseClass($thisNav, $thisContent, last, current);
            });
        }
    }

    function operateCaseClass($thisNav, $thisContent, last, current) {
        $(`.case-tab-nav .${ last }`).add(`div[data-case-tab="${ last }"]`).removeClass(CURRENTCLASSNAME);
        $thisNav.add(`div[data-case-tab="${ current }"]`).addClass(CURRENTCLASSNAME);
        $(`.cases-content .${ last }`).add(`div[data-case-content="${ last }"]`).removeClass(CURRENTCLASSNAME);
        $thisContent.add(`div[data-case-content="${ current }"]`).addClass(CURRENTCLASSNAME);
        $('.cases-section').removeClass(`${ last }-bg`);
        $('.cases-section').addClass(`${ current }-bg`);
        return current;
    }

    exports.init = function () {
        common.init();
        new Feature().init();
        new Solution().init();
        new Case().init();
        ParallaxManager(['.product-bg']);
        loadVerifiedDevices();
    };
    return exports;
});
define('etpl', ['etpl/main', "jquery"], function (main, $) {
    console.log($);
    return main;
});
/*require(["jquery"], function ($) {
    var list = [
        "afd", "bbc", "bcc", "bch", "bcm", "blb", "bos", "cdn", "cds", "dcc", "ddos", "dns", "doc", "drds", "dts", "eip", "et", "gpu",
        "hosteye", "lss", "mat", "mct", "pts", "rds", "sms", "ssl", "vod", "vpc", "waf","antiporn","antiterror"
    ];
    // console.log(list.length);
    $("a").each(function () {
        var url = $(this).attr("href");
        if (url === undefined) {return}
        //
        if($(this).parents(".footer-links").length!==0||/^http/.test(url)){
            return;
        }
        var that = this;
            if (/^\/solution|^\/partner/.test(url)) {
                // console.log(window.location.host);
                $(this).attr("href", "//" + window.location.host + "" + url);
            }else {
                if (/^\./.test(url)) {
                    url = url.slice(2);
                    // console.log(url);
                }else if(/^\//.test(url)){
                    url = url.slice(1);
                }
                var res = list.every(function (value) {
                    if (url.toString().indexOf(value + ".html") !== -1 && !/^http/.test(url)) {
                        //在本项目里
                        console.log(url);
                        if(/product/.test(window.location.pathname)){
                            $(that).attr("href", "//" + window.location.host + "/product/" + url);
                        }else {
                            $(that).attr("href", "//" + window.location.host + "/" + url);
                        }
                        return false;
                    }
                    return true;
                });
            }
            //不在本项目内的页面
            if (res) {
                if(/product/.test(window.location.pathname)){
                    if(/solution|partner/.test(url)){
                        $(that).attr("href", "//" + window.location.host  + url);
                    }else if(/\/market|\/doc/.test(url)){
                        $(this).attr("href", "//cloud.baidu.com/" + url);
                    }else{
                        $(this).attr("href", "//cloud.baidu.com/product/" + url);
                    }
                }else {
                    $(that).attr("href", "//cloud.baidu.com/" + url);
                }

                /!*if(/product/.test(window.location.pathname)){
                    $(this).attr("href", "//cloud.baidu.com/product/" + url);
                }else {
                }*!/
            }


    })
});*/

