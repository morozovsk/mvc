module.exports.app = {}
module.exports.controllers = {}
module.exports.models = {}
module.exports.settings = {}

module.exports.init = function(app, settings) {
    var defaultSettings = {
        applicationDirectory: 'app',
        moduleDirectory: 'modules',
        controllerDirectory: 'controllers',
        modelDirectory: 'models',
        defaultModule: 'index',
        defaultController: 'index',
        defaultAction: 'index',
        viewDirectory: 'views',
        controllerCache: true,
        modelCache: true
    }

    if (settings === undefined) {
        settings = defaultSettings;
    } else {
        for (var i in defaultSettings) {
            if (settings[i] === undefined) {
                settings[i] = defaultSettings[i];
            }
        }
    }

    module.exports.settings = settings;

    module.exports.app = app;
    var util = require('util');
    var path = require('path');
    var fs = require('fs');

    var loadModule = function (modulePath, moduleName) {
        var loadComponents = function (type) {
            var componentsPath = path.join(modulePath, settings[type + 'Directory']);
            //console.log(componentsPath);
            module.exports[type + 's'][moduleName] = {};

            var components = [];

            try {
                components = fs.readdirSync(componentsPath);
            } catch (e) {}

            if (components.length) {
                var componentPath, componentName;
                for (var i = 0; i < components.length; i++) {
                    componentPath = path.join(componentsPath, components[i]);
                    //console.log(componentPath);

                    componentName = components[i];
                    if (componentName.slice(-3) == '.js') {
                        componentName = componentName.slice(0,-3);
                    }

                    var component = require(componentPath);

                    module.exports[type +'s'][moduleName][componentName] = component;

                    if ((type == 'controller' && !settings['controllerCache']) || (type == 'model' && !app.settings['modelCache'])) {
                        fs.watchFile(componentPath, function(event, filename) {
                            try {
                                delete(require.cache[componentPath]);
                                module.exports[type +'s'][moduleName][componentName] = require(componentPath);
                            } catch (e){
                                //console.log(e.stack.toString());
                            }
                        });
                    }
                }
            }
        }

        loadComponents('controller');
        loadComponents('model');
    }

    var appPath = path.join(process.cwd(), settings.applicationDirectory);

    loadModule(appPath, settings.defaultModule);

    var modulesPath = path.join(process.cwd(), settings.applicationDirectory, settings.moduleDirectory);

    //console.log(util.inspect(module.exports));

    //console.log(modulesPath);
    var modules = [];
    try {
        modules = fs.readdirSync(modulesPath);
    } catch (e) {}
    //console.log(modules)

    if (modules.length) {
        for (var i = 0; i < modules.length; i++) {
            //console.log(modules[i]);
            //console.log(util.inspect(module.exports.controllers));
            loadModule(path.join(modulesPath, modules[i]), modules[i]);
        }
    }

    //load models and controllers;

    app.all('/:module?/:controller?/:action?', function(request, response, next) {
        request.params.module = request.param('module', settings.defaultModule);
        request.params.controller = request.param('controller', settings.defaultController);
        request.params.action = request.param('action', settings.defaultAction);

        if (module.exports.controllers[request.params.module] == undefined) {
            request.params.controller = request.params.module;
            request.params.module = settings.defaultModule;
        }

        //res.end(util.inspect(request.params));return;

        if (module.exports.controllers[request.params.module] == undefined || module.exports.controllers[request.params.module][request.params.controller] == undefined) {
            next();
            return;
        }

        var controller = new module.exports.controllers[request.params.module][request.params.controller]();

        if (controller[request.params.action + 'Action'] == undefined) {
            next();
            return;
        }

        //var path = require('path');

        if (request.params.module == settings.defaultModule) {
            app.set('views', path.join(process.cwd(), settings.applicationDirectory, settings.viewDirectory));
        } else {
            app.set('views', path.join(process.cwd(), settings.applicationDirectory, settings.moduleDirectory, request.params.module, settings.viewDirectory));
        }

        //console.log(app.set('views'));

        try {
            var helper = require('mvc/controller');
            helper = new helper(module.exports, module.exports.app, request, response, settings);
            for (var i in helper) {
                controller[i] = helper[i];
            }

            //controller._render('index');
            //controller._model('message2s');


            if (controller.before != undefined) {
                controller.before();
            }

            controller[request.params.action + 'Action']();

            //console.log(controller.asd);
            //res.render(request.params.controller + '/' + request.params.action, controller._view);

            if (controller.after != undefined) {
                controller.after();
            }

            var _render = function () {
                return response.render(path.join(request.params.controller, request.params.action), controller._locals());
            }

            var _json = function () {
                return response.json(response.locals());
            }

            var _jsonp = function () {
                return response.send(request.query.callback + '(' + JSON.stringify(response.locals()) + ');');
            }

            var _xml = function () {
                return response.send(require('mvc/xml').XML.stringify(response.locals()));
            }

            if (controller._formats.length) {
                for (var i in controller._formats) {
                    if (request.is(controller._formats[i])) {
                        if (controller._formats[i] == 'html') {
                            _render();
                        } else if (controller._formats[i] == 'json') {
                            _json();
                        } else if (controller._formats[i] == 'javascript') {
                            _jsonp();
                        } else if (controller._formats[i] == 'xml') {
                            _xml();
                        }
                        break;
                    }
                }
                response.end();
            } else {
                _render();
            }

            //res.end();

            //console.log(util.inspect(request.params));


            //require('/var/www/mrzjs/eval2.js');
        } catch(e) {
            console.log(e.stack.toString());
            response.end(e.stack.toString());
        }
        //console.log('Server running at http://127.0.0.1:8124/');
    });
}