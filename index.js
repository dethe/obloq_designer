// Create the node app
var fs = require('fs');
var configstring = fs.readFileSync('config/couchdb.json', 'utf-8');
var config = JSON.parse(configstring);
var couchbase = config['couchbase'];
// console.log('couchbase: %s', couchbase);
var express = require('express'),
    jade = require('jade'),
    app = express.createServer(
        express.bodyDecoder(),
        express.methodOverride(),
        express.cookieDecoder(),
        express.session(),
        express.staticProvider(__dirname + '/public')
    ),
    couchdb = require('couchdb'),
    client = couchdb.createClient(config.port, config.url, config.user, config.password),
    markdown = require('node-markdown').Markdown,
    sys = require('sys');
var db = client.db(config.database);

// things to update from database
var locals = {
    couchbase: couchbase,
    title: 'Kinzin Design Specification',
    nav_lists: [
        {id: 'layout_list', title: 'Layouts', list: []},
        {id: 'bars_list', title: 'Bars', list: []},
        {id: 'card_list', title: 'Cards', list: []},
        {id: 'dialog_list', title: 'Dialogs', list: []}
    ]
};

// Fill navigation lists from database
locals.nav_lists.forEach(function(list_info){
    // console.log('trying to retrieve %s', list_info.id);
    db.getDoc(list_info.id, function(err, result){
        if (err){
            console.log('Error: %s while trying to load layout list', err);
            return;
        }   
        // console.log('result of accessing %s is: %s', name, sys.inspect(result.values));
        list_info.list = result.values;
        // console.log('retrieved %s successfully', list_info.id);
    });
});

var tabs = ['context', 'wireframes', 'behaviour', 'code'];

// set up routes
app.get('/', function(req, res){
    get_page('home_page', req, res);
});

app.get('/:page', function(req, res){
    get_page(req.params.page, req, res);
});

app.post('/', function(req, res){
    save_page('home_page', req, res);
});

app.post('/:page', function(req, res){
    // console.log('body: %s', req.body);
    // console.log('params: %s', req.params.length);
    // console.log('query: %s', req.query);
    // console.log('content-type: %s', req.header('Content-type'));
    save_page(req.params.page, req, res);
});

function save_page(page_name, req, res){
    db.getDoc(page_name, function(err, result){
        if (err){
            console.log('Unable to retrieve page from DB');
            app.error('Unable to retrieve page from DB');
            res.send({response: 'Error', err: err});
        }else{
            var field;
            ['behaviour', 'code', 'context', 'wireframes'].forEach(function(name){
                field = name + '_text';
                if (req.param(field)){
                    // console.log('%s: %s', field, req.param(field));
                    result[field] = req.param(field);
                }
            });
            db.saveDoc(result, function(err, data){
                // console.log('saved data');
                res.send({response: 'saved data', err: false});
            });
        }
    });
}

function get_page(page_name, req, res){
    console.log('getting page %s', page_name);
    var tabcontent = [], text, markup;
    locals.pagename = page_name;
    db.getDoc(page_name, function(err, result){
        if (err){
            console.log('No page found, should put an option to create a new page');
            tabs.forEach(function(tab){
                tabcontent.push({
                    name: tab,
                    text: '',
                    markup: '<p></p>'
                });
            });
            locals.tabcontent = tabcontent;
            locals.componentname = 'Component Name';
            locals.attachments = [];
        }else{
            tabs.forEach(function(tab){
                text = result[tab + '_text'] || '';
                markup = '';
                if (text){
                    markup = markdown(text);
                }
                tabcontent.push({
                    name: tab,
                    text: text,
                    markup: markup
                });
            });
            locals.tabcontent = tabcontent;
            locals.componentname = result.title;
            locals.attachments = result._attachments || [];
        }
        res.render('index', {locals: locals});
    });
}

app.configure(function(){
    app.use(app.router);
    app.set( "view engine", "jade" );
    app.register( ".jade", jade );
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// start listening for connections
app.listen(5000);
console.log('Running in %s mode', process.env.NODE_ENV);    
console.log('Express server started on port %s', app.address().port);
