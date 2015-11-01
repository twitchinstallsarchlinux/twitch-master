var fs  = require('fs');
var irc = require('irc');
var pub = require('./lib/comm').sender();

var command_interval = 15;
var command_mode = 'anarchy';
// possible values: democracy, anarchy

function reportStatus(message) {
  pub.send(['client-status', message]);

  if (twitch_chat && config) {
    twitch_chat.say('#' + config['nick'], message);
  }
}

process.stdin.resume();
process.stdin.on('data', function(data) {
  process.stdout.write('Control: ' + data);
  var args = data.toString().split(' ');
  switch(args[0].trim()) {
    case 'map_load':
      map_load();
      break;
    case 'reset_voting':
      // For when this inevitably breaks
      voting_command = null;
      break;
      
    case 'anarchy':
      command_mode = 'anarchy';
      last_command = null;
      reportStatus('ANARCHY is now in effect');
      break;
    case 'democracy':
      command_mode = 'democracy';
      last_tally = {};
      reportStatus('DEMOCRACY is now in effect');
      break;
    
    case 'set_interval':
      var new_interval = +args[1];
      if (new_interval >= 1) {
        command_interval = new_interval;
        reportStatus('VOTING INTERVAL is now ' + new_interval + ' seconds');
      } else {
        console.log('Trouble parsing command interval seconds, try again');
      }
      break;
      
    default:
      console.log("Sending...", args);
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
var last_command;

twitch_chat.addListener('message#' + config['nick'], function(from, msg) {
  msg = msg.trim();
  if (map[msg] != null) {
    console.log(from + ': ' + msg + ' -> ' + map[msg]);
    pub.send(['client-console', '> ' + from + ': ' + msg]);
    last_tally[from.trim()] = msg;
    last_command = msg;
  }
});

var voting_command = null;

function democracy() {
  var command_count = {};
  for (var user in last_tally) {
    if (command_count[last_tally[user]] == null)
      command_count[last_tally[user]] = 0;
    command_count[last_tally[user]] += 1;
  }

  var top_array = [];
  var top_count = 0;
  var second_array = [];
  var second_count = 0;
  for (var command in command_count) {
    if (command_count[command] > top_count) {
      second_array = top_array.slice();
      second_count = top_count;
      top_array = [];
      top_array.push(command);
      top_count = command_count[command];
    } else if (command_count[command] == top_count) {
      top_array.push(command);
    } else if (command_count[command] > second_count) {
      second_array = [];
      second_array.push(command);
      second_count = command_count[command]
    } else if (command_count[command] == second_count) {
      second_array.push(command);
    }
  }

  var counts = '';
  var commands = top_array.concat(second_array);
  for (var index in commands) {
    var command = commands[index];
    counts += '\'' + command + '\' = ' + Math.round(command_count[command]/Object.keys(last_tally).length * 100, 2) + '%';
    if (index != Object.keys(commands).length - 1)
      counts += ', '
  }

  // Clear out tally info for next time
  last_tally = {};

  if (top_array.length > 0) {
    var selected_command = top_array[Math.floor(Math.random()*top_array.length)];

    console.log('Selected: ' + selected_command);
    reportStatus('Winning command: ' + selected_command);

    console.log('Votes: ' + counts);
    reportStatus('VOTES: ' + counts);

    return selected_command;
  }
}

function anarchy() {
  if (last_command) {
    var selected_command = last_command;
    last_command = null;
    
    reportStatus('Winning command: ' + selected_command);
    return selected_command;
  }
}

function processCommand() {
  var next_ms = command_interval * 1000;
  if (command_mode == 'anarchy' && !voting_command) {
    // Smudges timer by random amounts. Last # is smudge factor.
    next_ms += Math.round((Math.random() - 0.5) * 2 * next_ms * 0.1)
  }
  setTimeout(processCommand, next_ms);
  
  var selected_command;
  
  if (command_mode == 'democracy' || voting_command != null) {
    selected_command = democracy();
  } else if (command_mode == 'anarchy') {
    selected_command = anarchy();
  }

  if (selected_command) {
    if (voting_command != null) {
      // We are voting to run a dangerous command
      if (selected_command == 'yes') {
        console.log('Vote succeeded: ' + voting_command);
        twitch_chat.say('#' + config['nick'], 'Vote succeeded: ' + voting_command)
        pub.send(['client-status', 'VOTING SUCCEEDED: ' + voting_command]);

        // Send
        var command_qemu = map[voting_command].replace(/^VOTE /, '');
        console.log('Sending to qemu: ' + command_qemu);
        pub.send(['qemu-master', command_qemu]);
      } else {
        console.log('Vote failed: ' + voting_command);
        twitch_chat.say('#' + config['nick'], 'Vote failed: ' + voting_command)
        pub.send(['client-status', 'VOTING FAILED: ' + voting_command]);
      }
      voting_command = null;

    } else if (map[selected_command].indexOf("VOTE") == 0) {
      // This command requires a vote
      console.log('Voting on command: ' + selected_command);
      twitch_chat.say('#' + config['nick'], 'Vote \'yes\' to run this command: ' + selected_command);
      pub.send(['client-status', 'VOTING ON COMMAND (yes to run this command): ' + selected_command]);
      voting_command = selected_command;
      last_tally = {}; // in case we are in anarchy
      
    } else if (map[selected_command] != "") {
      // Normal command, not NOOP
      console.log('Sending to qemu: ' + map[selected_command]);
      pub.send(['qemu-master', map[selected_command]]);
    }
    
  } else {
    console.log('Not enough votes');
    twitch_chat.say('#' + config['nick'], 'Not enough votes');
    pub.send(['client-status', 'NOT ENOUGH VOTES PLACED!']);
  }
}

// Set the first voting timer
setTimeout(processCommand, command_interval * 1000);
