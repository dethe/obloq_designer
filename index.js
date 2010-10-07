// Create the node app
var express = require('express'),
    app = express.createServer();

// set up routes
app.get('/', function(req, res){
    res.send('Hello World');
});

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});


// start listening for connections
app.listen(5000);
console.log('Express server started on port %s', app.address().port);