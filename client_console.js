var sub = require('./lib/comm').receiver('client-console', true);
console.log('Connecting to master...');

sub.on('connect', function() {
  console.log('Connected to master');
});

sub.on('disconnect', function() {
  console.log('Disconnected from master');
  console.log('Connecting to master...');
});

sub.on('message', function() {
  var msg = arguments[1].toString();
  console.log(msg);
});
