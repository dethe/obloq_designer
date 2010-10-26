// Create the node app
var fs = require('fs');
var configstring = fs.readFileSync('config/couchdb.json', 'utf-8');
var config = JSON.parse(configstring);
var couchbase = config['couchbase'];
// console.log('couchbase: %s', couchbase);
var express = require('express'),
    jade = require('jade'),
    formidable = require('formidable'),
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
    title: 'Kinzin Design Specification'
};

// Fill navigation lists from database
db.view('indices', 'index', null, function(err, result){
        if (err){
        console.log('Error: %s while trying to load index lists', err);
        return;
    }
    var list_info = {};  //temp dictionary for collecting (CouchDB really should do this)
    var list_collection = []; // list for sorting and partials
    result.rows.forEach(function(row){
        if (! list_info[row.key]){
            list_info[row.key] = {title: row.key, list: []};
            list_collection.push(list_info[row.key]); // same object in both dict and list
        }
        list_info[row.key].list.push({url: row.id, title: row.value});
    });
    list_collection.forEach(function(sublist){
        sublist.list.sort();  // Sort each sublist
    });
    list_collection.sort(); // Sort the list of lists
    // console.log('result of accessing %s is: %s', 'index lists', sys.inspect(list_info));
    locals.nav_lists = list_collection; // expose list of lists for partials
    // console.log('retrieved %s successfully', list_info.id);
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
    if (req.header('Content-type').indexOf('multipart/form-data') > -1){
        upload_file(page_name, req, res);
        return;
    }
    // console.log('saving page %s', page_name)
    // console.log('body: %s', req.body);
    // console.log('params: %s', req.params.length);
    // console.log('query: %s', req.query);
    // console.log('content-type: %s', req.header('Content-type'));
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
            if (req.param('title_text')){
                result['title'] = req.param('title_text');
            }
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

function upload_err(file, res, message){
    console.log(message);
    if (f){
        fs.unlink(f.path);
    }
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('error');
    res.end();
}

function upload_file(page_name, req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if (err){
            upload_err(null, res, 'Error while uploading file'); return;
        }
        f = files.userfile;
        db.getDoc(page_name, function(err, doc){
            if (err){
                upload_err(f, res, 'error loading document for attachment'); return;
            }
            db.saveAttachment(f.path, page_name, {name: f.filename, contentType: f.mime, rev: doc._rev}, function(err, doc){
                if (err){
                    upload_err(f, res, 'Error loading file into couch attachment'); return;
                }
                console.log('received upload: %s, saved to couch', files.userfile.filename);            
                res.writeHead(200, {'Content-type': 'text/plain'});
                res.end('success');
                return;
            });
        });
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
