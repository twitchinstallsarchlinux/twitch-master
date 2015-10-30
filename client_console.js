var sub = require('./lib/comm').receiver('client-console');
console.log('Connecting to master...');
sub.monitor();

sub.on('connect', function() {
  console.log('Connected to master');
});

sub.on('disconnect', function() {
  console.log('Disconnected from master');
  console.log('Connecting to master...');
});

sub.on('message', function() {
  var msg = arguments[1].toString();
  process.stdout.write('> ' + msg);
  child.stdin.write(msg);
});
