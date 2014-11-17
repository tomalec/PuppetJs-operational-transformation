if (typeof pot === 'undefined') {
  var pot = {};
}

pot.Peer = (function (global) {
  'use strict';

  // Peer constructor
  function Peer (revision) {
  }


  return Peer;

}(this));

if (typeof module === 'object') {
  module.exports = pot.Peer;
}
