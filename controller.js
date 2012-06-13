module.exports = function (mvc, app, request, response) {
    this._app = app;
    this._request = request;
    this._response = response;
    this._params = request.params;
    this._param = request.param;
    this._query = request.query;
    this._cookies = request.cookies;
    this._partial = response.partial;
    this._redirect = response.redirect;

    this._formats = [];
    this._view = {};
    this._template = null;
    this._layout = null;

    this._local = response.local;
    this._locals = response.locals;

    this._render = function () {
        return response.render(request.params.controller + '/' + request.params.action, this._view);
    }

    this._json = function () {
        return response.json(this._view);
    }

    this._jsonp = function () {
        return response.send(request.query.callback + '(' + JSON.stringify(this._view) + ');');
    }

    this._xml = function () {
        return response.send(require('mvc/xml').XML.stringify(this._view));
    }

    this._output = function () {
        if (this._formats.length) {
            for (var i in this._formats) {
                if (request.is(this._formats[i])) {
                    if (this._formats[i] == 'html') {
                        this._render();
                    } else if (this._formats[i] == 'json') {
                        response._json();
                    } else if (this._formats[i] == 'javascript') {
                        response._jsonp();
                    } else if (this._formats[i] == 'xml') {
                        response._xml();
                    }
                    break;
                }
            }
            response.end();
        } else {
            this._render();
        }
    }

    this._model = function (modelName, moduleName) {
        if (moduleName == undefined) {
            moduleName = request.params.module;
        }

        if (mvc.models[moduleName] == undefined || mvc.models[moduleName][modelName] == undefined) {
            throw new Error('Model ' + modelName + ' does not exist in module ' + moduleName);
        }

        return new mvc.models[moduleName][modelName]();
    }

    this._queryParam = function (name, defaultValue) {
        if (request.query[name] !== undefined) {
            return this.query[name];
        }

        return defaultValue;
    };

    this._url = function (params) {
        var url = '/';

        if (params.module !== undefined && params.module !== app.set('defaultModule') || params.controller !== undefined && params.controller !== app.set('defaultController') || params.action !== undefined && params.action !== app.set('defaultController')) {
            url += (params.module == undefined ? app.set('defaultModule') : params.module);

            if (params.controller !== undefined && params.controller !== app.set('defaultController') || params.action !== undefined && params.action !== app.set('defaultController')) {
                url += '/' + (params.controller == undefined ? app.set('defaultController') : params.controller);

                if (params.action !== undefined && params.action !== app.set('defaultController')) {
                    url += '/' + (params.action ? app.set('defaultAction') : params.action);
                }
            }
        }

        delete params.module;
        delete params.controller;
        delete params.action;

        var qs = require('qs').stringify(params);

        if (qs) {
            url += '?' + qs;
        }

        return url;
    }

    /*this._forward = function (action, controller, module, query) {

    }*/
}

//module.exports.qwe = function(){}

/*
 this.redirect = function (target) {
 var url;
 if (typeof target == 'string') {
 url = target;
 }
 else if (typeof this.app.router.url == 'function') {
 if (this.name && !target.controller)
 target.controller = this.name;
 if (this.params.format && !target.format)
 target.format = this.params.format;

 url = this.app.router.url(target);
 }

 if (!url) {
 var contr = target.controller || this.name;
 var act = target.action;
 var ext = target.format || this.params.format;
 var id = target.id;
 contr = geddy.string.decamelize(contr);
 url = '/' + contr;
 url += act ? '/' + act : '';
 url += id ? '/' + id : '';
 if (ext) {
 url += '.' + ext;
 }
 }

 this.content = '';

 _doResponse.apply(this, [302, {'Location': url}]);
 };

 this.transfer = function (action) {
 this.params.action = action;
 this._handleAction(action);
 };

 this.respond = function (content, opts) {
 var options = opts || {}
 , format = typeof opts == 'string' ? options : options.format
 , negotiated = _negotiateContent.call(this, format);

 // Error during content-negotiation may result in an error response;
 // do not continue
 if (this.completed) {
 return;
 }

 this.format = negotiated.format;
 this.contentType = negotiated.contentType;

 if (!this.contentType) {
 var err = new errors.NotAcceptableError('Not an acceptable media type.');
 this.error(err);
 }

 if (options.template) {
 this.template = options.template;
 }
 if (options.layout) {
 this.layout = 'app/views/' + options.layout;
 }

 // If content needs formatting
 if (typeof content != 'string') {
 if (this.format) {
 // Special-case HTML -- will go out to template-rendering code,
 // and then come back here with content as a string
 if (this.format == 'html') {
 this.renderTemplate(content);
 return;
 }
 // Otherwise format according to ... format
 else {
 content = controller.formatters[this.format](content, this);
 }
 }
 // If we couldn't perform content-negotiaton successfully, bail
 // with error
 else {
 _throwUndefinedFormatError.call(this);
 return;
 }
 }

 this.content = content;
 _doResponse.apply(this, [200, {'Content-Type': this.contentType}]);

 };


 this.renderTemplate = function (data) {
 var _this = this
 , dirName;

 dirName = geddy.inflection.pluralize(this.name);
 dirName = geddy.string.snakeize(dirName);

 // Calculate the template if not set
 this.template = this.template ||
 'app/views/' + dirName + '/' + this.params.action;

 // Calculate the layout if not set
 this.layout = this.layout ||
 'app/views/layouts/' + dirName;

 var templater = new Templater();
 var content = '';

 templater.addListener('data', function (d) {
 // Buffer for now, but could stream
 content += d;
 });

 templater.addListener('end', function () {
 _this.respond(content, 'html');
 });

 templater.render(data, {
 layout: this.layout
 , template: this.template
 , controller: this.name
 , action: this.params.action
 });
 };

 this.url = function (params) {
 var url = false;

 // attempt the stringification with defaults mixed in
 params = geddy.mixin({controller:'Application', action:'index' }, params);

 // iterate through the existing routes until a suitable match is found
 for (var i in this.routes) {
 // do the controller & acton match?
 if (typeof(this.routes[i].params.controller) != 'undefined' &&
 this.routes[i].params.controller != params.controller) {
 continue;
 }
 if (typeof(this.routes[i].params.action) != 'undefined' &&
 this.routes[i].params.action != params.action) {
 continue;
 }

 url = this.routes[i].stringify(params);
 if (url) {
 break;
 }
 }

 // no love? return false
 if (!url) {
 return false;
 }


 // build the possibly empty query string
 //var qs = require('../../deps/qs').stringify(url[1]);

 // if there is a query string...
 //if (qs.length > 0) {
 //return url[0] + '?' + qs;
 //}


 // just return the url
 return url[0];
 };
 }*/