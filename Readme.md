This is light weight mvc framework for express on node.js

samples of application structure:

###without modules (https://github.com/morozovsk/mvc/tree/master/samples/sample-without-modules)

    app/
    -controllers/
    --index.js
    -models/
    --message.js
    -views/
    --layout.ejs
    --index/
    ---index.ejs

###with modules (https://github.com/morozovsk/mvc/tree/master/samples/sample-with-modules)

    app/
    -controllers/
    --index.js
    -models/
    --message.js
    -views/
    --layout.ejs
    --index/
    ---index.ejs
    -modules/
    --admin/
    ---controllers/
    ----index.js
    ---models/
    ----message.js
    ---views/
    ----layout.ejs
    ----index/
    -----index.ejs

You can use helpers in your controllers:

    this._app - link to express.createServer()
    this._request - link to express request
    this._response - link to express response
    this._params - link to request.params
    this._param - link to request.param
    this._query - link to request.query
    this._cookies - link to request.cookies
    this._partial - link to response.partial
    this._redirect - link to response.redirect
    this._local - link to response._local
    this._locals - link to response._locals
    this._queryParam(name, defaultValue) - method for request.query like request.param
    this._url(params) - method for generate url from object (example: this._url({controller:"message", action:"edit", id: 5}) => '/message/edit?id=5')