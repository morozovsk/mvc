This is light weight mvc framework for express on node.js

samples of application structure:

##without modules
app/
-controllers/
--index.js
-models/
--message.js
-views/
--layout.ejs
--index/
---index.ejs

###with modules
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