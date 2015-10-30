var sub = require('./lib/comm').receiver('qemu-manager');
console.log('Connecting to master...');
sub.monitor();
var spawn = require('child_process').spawn;

var child = spawn('bash', ['lib/launch.sh']);

/*child.stdout.on('data', function(data) {
  console.log('QEMU: ' + data);
});

child.stderr.on('data', function(data) {
  console.log('ERR QEMU: ' + data);
});*/

sub.on('connect', function() {
  console.log('Connected to master');
});

sub.on('disconnect', function() {
  console.log('Disconnected from master');
});

sub.on('message', function() {
  var msg = arguments[1].toString();
  process.stdout.write('> ' + msg);
  child.stdin.write(msg);
});
