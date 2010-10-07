// Create the node app
var express = require('express'),
    app = express.createServer();

// set up routes
app.get('/', function(req, res){
    res.send('Hello World');
});

// start listening for connections
app.listen(5000);
console.log('Express server started on port %s', app.address().port);