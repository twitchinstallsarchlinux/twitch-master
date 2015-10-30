var pub = require('./lib/comm').sender();

process.stdin.resume();

process.stdin.on('data', function(data) {
  pub.send(['qemu-manager', data.toString()]);
});
