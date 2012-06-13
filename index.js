module.exports.app = {}
module.exports.controllers = {}
module.exports.models = {}

module.exports.init = function(app) {
    module.exports.app = app;
    var util = require('util');
    var path = require('path');
    var fs = require('fs');

    var loadModule = function (modulePath, moduleName) {
        var loadComponents = function (type) {
            var componentsPath = path.join(modulePath, app.set(type + 'Directory'));
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
                }
            }
        }

        loadComponents('controller');
        loadComponents('model');
    }

    var appPath = path.join(process.cwd() ,app.set('applicationDirectory'));

    loadModule(appPath, app.set('defaultModule'));

    var modulesPath = path.join(process.cwd(), app.set('applicationDirectory'), app.set('moduleDirectory'));

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

    app.all('/:module?/:controller?/:action?', function(req, res, next) {
        req.params.module = req.param('module', app.set('defaultModule'));
        req.params.controller = req.param('controller', app.set('defaultController'));
        req.params.action = req.param('action', app.set('defaultAction'));

        if (module.exports.controllers[req.params.module] == undefined) {
            req.params.controller = req.params.module;
            req.params.module = app.set('defaultModule');
        }

        //res.end(util.inspect(req.params));return;

        if (module.exports.controllers[req.params.module] == undefined || module.exports.controllers[req.params.module][req.params.controller] == undefined) {
            next();
            return;
        }

        var controller = new module.exports.controllers[req.params.module][req.params.controller]();

        if (controller[req.params.action + 'Action'] == undefined) {
            next();
            return;
        }

        //var path = require('path');

        if (req.params.module == app.set('defaultModule')) {
            app.set('views', process.cwd() + path.join(app.set('applicationDirectory'), app.set('viewDirectory')));
        } else {
            app.set('views', process.cwd() + path.join(app.set('applicationDirectory'), app.set('moduleDirectory'), req.params.module, app.set('viewDirectory')));
        }

        //console.log(app.set('views'));

        try {
            var helper = require('mvc/controller');
            helper = new helper(module.exports, module.exports.app, req, res);
            for (var i in helper) {
                controller[i] = helper[i];
            }

            //controller._render('index');
            //controller._model('message2s');


            if (controller.before != undefined) {
                controller.before();
            }

            controller[req.params.action + 'Action']();

            //console.log(controller.asd);
            //res.render(req.params.controller + '/' + req.params.action, controller._view);

            if (controller.after != undefined) {
                controller.after();
            }

            controller._output();

            //res.end();

            //console.log(util.inspect(req.params));


            //require('/var/www/mrzjs/eval2.js');
        } catch(e) {
            console.log(e.stack.toString());
            res.end(e.stack.toString());
        }
        //console.log('Server running at http://127.0.0.1:8124/');
    });
}