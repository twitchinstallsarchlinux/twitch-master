var zmq = require('zmq');

module.exports.receiver = function(topic, monitor) {
  monitor = monitor == null ? false : monitor;
  var sub = zmq.socket('sub');
  if (monitor)
    sub.monitor();
  sub.connect('tcp://localhost:1300');
  sub.subscribe(topic);
  return sub;
};

module.exports.sender = function() {
  var pub = zmq.socket('pub');
  pub.bind('tcp://*:1300', function(err) {
    if(err)
      console.log(err);
    else
      console.log('Listening on 1300...');
  });
  return pub;
};

