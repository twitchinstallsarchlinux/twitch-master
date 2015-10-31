var fs  = require('fs');
var irc = require('irc');
var pub = require('./lib/comm').sender();


process.stdin.resume();
process.stdin.on('data', function(data) {
  process.stdout.write('Control: ' + data);
  var args = data.toString().split(' ');
  switch(args[0].trim()) {
    case 'map_load':
      map_load();
      break;
    default:
      console.log("Sending... ", args);
      pub.send(args);
      break;
  }
});

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

// Load json config
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var twitch_chat = new irc.Client('irc.twitch.tv', config['nick'], {
    channels: ['#' + config['nick']],
    userName: config['nick'],
    password: config['password'],
    autoConnect: false
});

twitch_chat.connect(0, function() {
  console.log("Twitch connected!");
});

var last_tally = {};

twitch_chat.addListener('message#' + config['nick'], function(from, msg) {
  msg = msg.trim();
  if (map[msg] != null) {
    console.log(from + ': ' + msg + ' -> ' + map[msg]);
    pub.send(['client-console', '> ' + from + ': ' + msg]);
    last_tally[from.trim()] = msg;
  }
});

setInterval(function() {
  var command_count = {};
  for (var user in last_tally) {
    if (command_count[last_tally[user]] == null)
      command_count[last_tally[user]] = 0;
    command_count[last_tally[user]] += 1;
  }

  var top_array = [];
  var top_count = 0;
  for (var command in command_count) {
    if (command_count[command] > top_count) {
      top_array = [];
      top_array.push(command);
      top_count = command_count[command];
    } else if (command_count[command] == top_count) {
      top_array.push(command);
    }
  }

  if (top_array.length > 0) {
    var selected_command = top_array[Math.floor(Math.random()*top_array.length)];
    console.log('Selected: ' + selected_command);
    pub.send(['client-status', 'WINNING COMMAND: ' + selected_command]);
    pub.send(['qemu-master', map[selected_command]]);
  } else {
    console.log('Not enough votes');
    pub.send(['client-status', 'NOT ENOUGH VOTES PLACED!']);
  }

  // Clear last tally
  last_tally = {};
}, 10 * 1000);
