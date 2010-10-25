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
            var component_type;
            if (/^(bar|toolbar|footer|header)_/.test(row.id)){
                component_type = 'Bars';
            }else if (/^layout_/.test(row.id)){
                component_type = 'Layouts';
            }else if(/^card=/.test(row.id)){
                component_type = 'Cards';
            }else if(/^dialog_/.test(row.id)){
                component_type = 'Dialogs';
            }else if(/^home_/.test(row.id)){
                 component_type = 'Specials';
            }else if(/_list$/.test(row.id)){
                component_type = 'Lists';
            }else{
                console.log('unrecognized component type: ' + row.id);
                return;
            }
            doc.component_type = component_type;
            db.saveDoc(doc, function(err, data){
                if(err){
                    console.log('problem saving %s back to database', doc._id);
                    return;
                }
                console.log('Saved %s', doc._id);
            });
        });
    });
});




