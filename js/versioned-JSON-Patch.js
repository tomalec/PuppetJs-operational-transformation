(function (scope) {
  'use strict';

  // Constructor for new operations.
  // TODO: separate VersionedJson Patch out of transforamtions  (tomalec)
  function VersionedJSONPatch (ops, localRevision, remoteRevision, localRevPropName, remoteRevPropName) {
    if (!this || this.constructor !== VersionedJSONPatch) {
      // => function was called without 'new'
      return new VersionedJSONPatch(ops, localRevision, remoteRevision, localRevPropName, remoteRevPropName);
    }
    // Array of JSON operations (plain JSON-Patch object)
    this.ops = ops || [];

    // maybe not needed
    this.localRevision = localRevision;
    this.remoteRevision = remoteRevision;
    this.localRevPropName = localRevPropName;
    this.remoteRevPropName = remoteRevPropName;

    this.patch = [
      {op:"replace", path: localRevPropName, value: localRevision},
      {op:"test", path: remoteRevPropName, value: remoteRevision}
    ].concat(ops);

  }

  // Converts operation into a JSON value.
  VersionedJSONPatch.prototype.toJSON = function () {
    return this.patch;
  };

  // Converts a plain JS object into an operation and validates it.
  VersionedJSONPatch.fromJSON = function (json) {
      return new VersionedJSONPatch(json.splice(2), json[0].value, json[1].value, json[0].path, json[1].path);
  };

  scope.VersionedJSONPatch = VersionedJSONPatch;

}(window));
