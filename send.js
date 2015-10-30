var zmq = require('zmq')
var control = zmq.socket('req');

control.connect('tcp://localhost:1301', function(err) {
  if (err)
    console.log(err);
});

control.on('message', function(msg) {
  console.log(msg);
});

control.send("TEST");

process.stdin.resume();
process.stdin.on('data', function(data) {
  process.stdout.write('local: ' + data);
  control.send(data.toString());
});
