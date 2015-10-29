var zmq = require('zmq')
var pub = zmq.socket('pub')

pub.bind('tcp://*:1300', function(err) {
  if(err)
    console.log(err)
  else
    console.log('Listening on 1300...')
});

setInterval(function() {
  send_qemu_manager('sendkey a');
}, 1000);

function send_qemu_manager(msg) {
  pub.send(['qemu-manager', msg]);
}
