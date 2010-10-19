var fs = require('fs');
var configstring = fs.readFileSync('config/couchdb.json', 'utf-8');
var config = JSON.parse(configstring);
var couchbase = config['couchbase'];
// console.log('couchbase: %s', couchbase);
var couchdb = require('couchdb'),
    client = couchdb.createClient(config.port, config.url, config.user, config.password);
var db = client.db(config.database);

db.getDoc('_all_docs', function(err, doc){
    if (err){
        console.log('we have problems: %s', JSON.stringify(err));
        return;
    }
    doc.rows.forEach(function(row){
        db.getDoc(row.id, function(err, doc){
            if (err){
                console.log('more problems: %s', JSON.stringify(err));
                return;
            }
            if (doc.title){
                var key;
                console.log('processing %s', doc._id);
                ['behaviour', 'code', 'context', 'wireframes'].forEach(function(name){
                    key = name + '_text';
                    doc[key] = doc[key].replace('127.0.0.1', '192.168.1.169');
                });
                db.saveDoc(doc, function(err, data){
                    if(err){
                        console.log('problem saving %s back to database', doc._id);
                        return;
                    }
                    console.log('Saved %s', doc._id);
                });
            }else{
                console.log('skipping %s', doc._id);
            }
        });
    });
});




