var fs  = require('fs');
var pub = require('./lib/comm').sender();

var TIMEOUT = 500;

// Load json command mapping
var map = {}

function map_load() {
  fs.exists('map.json', function() {
    try {
      var map_new = JSON.parse(fs.readFileSync('map.json', 'utf8'));
      map = map_new;
      console.log('(Re)loaded map.json');
    } catch (ex) {
      console.log('Could not load map.json');
      console.log(ex);
    }
  });
}

map_load();

var length = 0;

function iter() {
  var next = Object.keys(map)[length];
  if (next != null) {
    console.log('Sending: ' + next + ' -> ' + map[next]);
    pub.send(['qemu-manager', map[next] + '\n']);
    length++;
    setTimeout(iter, TIMEOUT);
  } else {
    console.log('Done!');
  }
}

setTimeout(iter, TIMEOUT);
