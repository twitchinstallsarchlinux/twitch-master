var fs  = require('fs');
var irc = require('irc');
var pub = require('./lib/comm').sender();

// Load json command mapping
var map = JSON.parse(fs.readFileSync('map.json', 'utf8'));

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
    pub.send(['client-console', 'WINNING COMMAND: ' + selected_command]);
    pub.send(['qemu-master', map[selected_command]]);
  } else {
    console.log('Not enough votes');
    pub.send(['client-console', 'NOT ENOUGH VOTES PLACED!']);
  }

  // Clear last tally
  last_tally = {};
}, 10 * 1000);
