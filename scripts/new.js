var cc = require('couch-client'),
    db = cc('http://localhost:5984/kinzin');


function get_doc(slug, title, add_to){
  db.get(add_to + '_list', function(err, result){
    if (err){
      console.log('Error reading from database');
      return;
    }
    add_to_list(result, slug, title);
  });
}

function add_to_list(result, slug, title){
    result.values.push({url: slug, title: title});
    save_doc(result);
}

function read_file(slug, title){
  var fs = require('fs');
  fs.readFile('template.txt', 'utf-8', function(err, data){
    if (err){
      console.log('Error reading from file');
      return;
    }
    var obj = JSON.parse(data);
    obj._id = slug;
    obj.title = title;
//    console.log(JSON.stringify(obj));
    save_doc(obj);
  });
}

function save_doc(homepage){
  db.save(homepage, function(err, data){
    if (err){
        console.log('Error writing to database');
        return;
    }
    console.log('Document saved!');
  });
}

//get_home();
read_file(process.argv[2], process.argv[3]);
get_doc(process.argv[2], process.argv[3], process.argv[4]);