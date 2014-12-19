if (typeof ot === 'undefined') {
  // Export for browsers
  var ot = {};
}

ot.JSONPatchOperation = (function () {
  'use strict';

  // Constructor for new operations.
  // TODO: separate VersionedJson Patch out of transforamtions  (tomalec)
  function JSONPatchOperation (ops, localRevision, remoteRevision, localRevPropName, remoteRevPropName) {
    if (!this || this.constructor !== JSONPatchOperation) {
      // => function was called without 'new'
      return new JSONPatchOperation(ops, localRevision, remoteRevision, localRevPropName, remoteRevPropName);
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

    // An operation's baseLength is the length of every string the operation
    // can be applied to.
    this.baseLength = 0;
    // The targetLength is the length of every string that results from applying
    // the operation on a valid input string.
    this.targetLength = 0;
  }

  JSONPatchOperation.prototype.equals = function (other) {
    debugger;
    if (this.baseLength !== other.baseLength) { return false; }
    if (this.targetLength !== other.targetLength) { return false; }
    if (this.ops.length !== other.ops.length) { return false; }
    for (var i = 0; i < this.ops.length; i++) {
      if (this.ops[i] !== other.ops[i]) { return false; }
    }
    return true;
  };

  // Operation are essentially lists of ops. There are three types of ops:
  //
  // * Retain ops: Advance the cursor position by a given number of characters.
  //   Represented by positive ints.
  // * Insert ops: Insert a given string at the current cursor position.
  //   Represented by strings.
  // * Delete ops: Delete the next n characters. Represented by negative ints.

  var isRetain = JSONPatchOperation.isRetain = function (op) {
    debugger;
    return typeof op === 'number' && op > 0;
  };

  var isInsert = JSONPatchOperation.isInsert = function (op) {
    debugger;
    return typeof op === 'string';
  };

  var isDelete = JSONPatchOperation.isDelete = function (op) {
    debugger;
    return typeof op === 'number' && op < 0;
  };


  // After an operation is constructed, the user of the library can specify the
  // actions of an operation (skip/insert/delete) with these three builder
  // methods. They all return the operation for convenient chaining.

  // Skip over a given number of characters.
  JSONPatchOperation.prototype.retain = function (n) {
    debugger;
    if (typeof n !== 'number') {
      throw new Error("retain expects an integer");
    }
    if (n === 0) { return this; }
    this.baseLength += n;
    this.targetLength += n;
    if (isRetain(this.ops[this.ops.length-1])) {
      // The last op is a retain op => we can merge them into one op.
      this.ops[this.ops.length-1] += n;
    } else {
      // Create a new op.
      this.ops.push(n);
    }
    return this;
  };

  // Insert a string at the current position.
  JSONPatchOperation.prototype.insert = function (str) {
    debugger;
    if (typeof str !== 'string') {
      throw new Error("insert expects a string");
    }
    if (str === '') { return this; }
    this.targetLength += str.length;
    var ops = this.ops;
    if (isInsert(ops[ops.length-1])) {
      // Merge insert op.
      ops[ops.length-1] += str;
    } else if (isDelete(ops[ops.length-1])) {
      // It doesn't matter when an operation is applied whether the operation
      // is delete(3), insert("something") or insert("something"), delete(3).
      // Here we enforce that in this case, the insert op always comes first.
      // This makes all operations that have the same effect when applied to
      // a document of the right length equal in respect to the `equals` method.
      if (isInsert(ops[ops.length-2])) {
        ops[ops.length-2] += str;
      } else {
        ops[ops.length] = ops[ops.length-1];
        ops[ops.length-2] = str;
      }
    } else {
      ops.push(str);
    }
    return this;
  };

  // Delete a string at the current position.
  JSONPatchOperation.prototype['delete'] = function (n) {
    debugger;
    if (typeof n === 'string') { n = n.length; }
    if (typeof n !== 'number') {
      throw new Error("delete expects an integer or a string");
    }
    if (n === 0) { return this; }
    if (n > 0) { n = -n; }
    this.baseLength -= n;
    if (isDelete(this.ops[this.ops.length-1])) {
      this.ops[this.ops.length-1] += n;
    } else {
      this.ops.push(n);
    }
    return this;
  };

  // Tests whether this operation has no effect.
  JSONPatchOperation.prototype.isNoop = function () {
    debugger;
    return this.ops.length === 0 || (this.ops.length === 1 && isRetain(this.ops[0]));
  };

  // Pretty printing.
  JSONPatchOperation.prototype.toString = function () {
    debugger;
    // map: build a new array by applying a function to every element in an old
    // array.
    var map = Array.prototype.map || function (fn) {
      var arr = this;
      var newArr = [];
      for (var i = 0, l = arr.length; i < l; i++) {
        newArr[i] = fn(arr[i]);
      }
      return newArr;
    };
    return map.call(this.ops, function (op) {
      if (isRetain(op)) {
        return "retain " + op;
      } else if (isInsert(op)) {
        return "insert '" + op + "'";
      } else {
        return "delete " + (-op);
      }
    }).join(', ');
  };

  // Converts operation into a JSON value.
  JSONPatchOperation.prototype.toJSON = function () {
  //   debugger;
    return this.patch;
  };

  // Converts a plain JS object into an operation and validates it.
  JSONPatchOperation.fromJSON = function (json) {
      return new JSONPatchOperation(json.splice(2), json[0].value, json[1].value, json[0].path, json[1].path)
  //   debugger;
  //   var o = new JSONPatchOperation();
  //   for (var i = 0, l = ops.length; i < l; i++) {
  //     var op = ops[i];
  //     if (isRetain(op)) {
  //       o.retain(op);
  //     } else if (isInsert(op)) {
  //       o.insert(op);
  //     } else if (isDelete(op)) {
  //       o['delete'](op);
  //     } else {
  //       throw new Error("unknown operation: " + JSON.stringify(op));
  //     }
  //   }
  //   return o;
  };

  // Apply an operation to a string, returning a new string. Throws an error if
  // there's a mismatch between the input string and the operation.
  JSONPatchOperation.prototype.apply = function (tree) {
    jsonpatch.apply(tree, this.ops);
    return tree;
    debugger;
    var operation = this;
    if (str.length !== operation.baseLength) {
      throw new Error("The operation's base length must be equal to the string's length.");
    }
    var newStr = [], j = 0;
    var strIndex = 0;
    var ops = this.ops;
    for (var i = 0, l = ops.length; i < l; i++) {
      var op = ops[i];
      if (isRetain(op)) {
        if (strIndex + op > str.length) {
          throw new Error("Operation can't retain more characters than are left in the string.");
        }
        // Copy skipped part of the old string.
        newStr[j++] = str.slice(strIndex, strIndex + op);
        strIndex += op;
      } else if (isInsert(op)) {
        // Insert string.
        newStr[j++] = op;
      } else { // delete op
        strIndex -= op;
      }
    }
    if (strIndex !== str.length) {
      throw new Error("The operation didn't operate on the whole string.");
    }
    return newStr.join('');
  };
  JSONPatchOperation.prototype.transform = function (operations) {
    // var clonedPatch = JSON.parse(JSON.stringify(this.patch)); // clone needed for debugging and visualization
    var clonedPatch = JSON.parse(JSON.stringify(this.ops)); // clone needed for debugging and visualization
    var result = operations.reduce(composeJSONPatchOps, clonedPatch); // <=> composeJSONPatchOps(this, operations.concat() )
    return new JSONPatchOperation(result, this.localRevision, operations[operations.length-1].localRevision, this.localRevPropName, this.remoteRevPropName);
  }
  JSONPatchOperation.transform = function (sequenceA, sequences) {
    // var clonedPatch = JSON.parse(JSON.stringify(this.patch)); // clone needed for debugging and visualization
    var clonedPatch = JSON.parse(JSON.stringify(sequenceA)); // clone needed for debugging and visualization
    var result = sequences.reduce(composeJSONPatches, clonedPatch); // <=> composeJSONPatches(this, operations.concat() )
    return result;
    // return new JSONPatchOperation(result, this.localRevision, operations[operations.length-1].localRevision, this.localRevPropName, this.remoteRevPropName);
  }
  var composeJSONPatchOps = function( original, patch ){
    // composeJSONPatches(original.ops, patch.ops);
    // return original;
        var p = 0, pLen = patch.ops.length, patchOp;
        while (p < pLen) {
            patchOp = patch.ops[p];
            p++;


            // basic validation (as in fast-json-patch)
            if (patchOp.value === undefined && (patchOp.op === "add" || patchOp.op === "replace" || patchOp.op === "test")) {
                throw new Error("'value' MUST be defined");
            }
            if (patchOp.from === undefined && (patchOp.op === "copy" || patchOp.op === "move")) {
                throw new Error("'from' MUST be defined");
            }

            // apply patch operation to all original ops
            if(transformAgainst[patchOp.op]){ // if we have any function to transformpatchOp.op at all
              if(typeof transformAgainst[patchOp.op] == "function"){ //not perfectly performant but gives easier maintenance and flexibility with transformations
                transformAgainst[patchOp.op](patchOp, original);
              } else {
                var orgOpsLen = original.ops.length, currentOp = 0;
                while (currentOp < orgOpsLen) {
                  var originalOp = original.ops[currentOp];
                  currentOp++;

                  if( transformAgainst[patchOp.op][originalOp.op] ){
                    transformAgainst[patchOp.op][originalOp.op](patchOp, originalOp)
                  } else{
                    console.log("No function to transform " + originalOp.op + "against" + patchOp.op);
                  }
                }
              }
            } else {
              console.log("No function to transform against " + patchOp.op)
            }
        }
        return original;
    };
  var composeJSONPatches = function( original, sequenceB ){
        var p = 0, pLen = sequenceB.length, patchOp;
        while (p < pLen) {
            patchOp = sequenceB[p];
            p++;


            // basic validation (as in fast-json-patch)
            if (patchOp.value === undefined && (patchOp.op === "add" || patchOp.op === "replace" || patchOp.op === "test")) {
                throw new Error("'value' MUST be defined");
            }
            if (patchOp.from === undefined && (patchOp.op === "copy" || patchOp.op === "move")) {
                throw new Error("'from' MUST be defined");
            }

            // apply patch operation to all original ops
            if(transformAgainst[patchOp.op]){ // if we have any function to transformpatchOp.op at all
              if(typeof transformAgainst[patchOp.op] == "function"){ //not perfectly performant but gives easier maintenance and flexibility with transformations
                transformAgainst[patchOp.op](patchOp, original);
              } else {
                var orgOpsLen = original.length, currentOp = 0;
                while (currentOp < orgOpsLen) {
                  var originalOp = original[currentOp];
                  currentOp++;

                  if( transformAgainst[patchOp.op][originalOp.op] ){
                    transformAgainst[patchOp.op][originalOp.op](patchOp, originalOp)
                  } else{
                    console.log("No function to transform " + originalOp.op + "against" + patchOp.op);
                  }
                }
              }
            } else {
              console.log("No function to transform against " + patchOp.op)
            }
        }
        return original;
    };
    var transformAgainst = {
      remove: function(patchOp, original){
        console.log("Transforming ", JSON.stringify(original) ," against `remove` ", patchOp);
        var orgOpsLen = original.length, currentOp = 0, originalOp;
        // remove operation objects
        while (currentOp < orgOpsLen) {
          var originalOp = original[currentOp];


          // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
          console.log("TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)");
          // node in question was removed
          if( patchOp.path === originalOp.path || originalOp.path.indexOf(patchOp.path + "/") === 0 ){
            console.log("Removing ", originalOp);
            original.splice(currentOp,1);
            orgOpsLen--;
            currentOp--;
          } 
          currentOp++;
        }
        // shift indexes
        var match = patchOp.path.match(/(.*\/)(\d+)$/); // last element is a number
        if(match){
          console.warn("Bug prone guessing that, as number given in path, this is an array!");
          var arrayPath = match[1];
          var index = parseInt( match[2], 10 );
          console.log("Shifting array indexes")
          orgOpsLen = original.length;
          currentOp = 0;
          while (currentOp < orgOpsLen) {
            originalOp = original[currentOp];
            currentOp++;

            if(originalOp.path.indexOf(arrayPath) === 0){//item from the same array
              originalOp.path = replacePathIfHigher(originalOp.path, arrayPath, index);
            }
            if(originalOp.from && originalOp.from.indexOf(arrayPath) === 0){//item from the same array
              originalOp.from = replacePathIfHigher(originalOp.from, arrayPath, index);
            }
          }
        }

      },
      replace: function(patchOp, original){
        console.log("Transforming ", JSON.stringify(original) ," against `replace` ", patchOp);
        var orgOpsLen = original.length, currentOp = 0, originalOp;
        // remove operation objects withing replaced JSON node
        while (currentOp < orgOpsLen) {
          var originalOp = original[currentOp];


          // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
          console.log("TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)");
          // node in question was removed
          // IT:
          // if( patchOp.path === originalOp.path || originalOp.path.indexOf(patchOp.path + "/") === 0 ){

          if( originalOp.path.indexOf(patchOp.path + "/") === 0 ){
            console.log("Removing ", originalOp);
            original.splice(currentOp,1);
            orgOpsLen--;
            currentOp--;
          } 
          currentOp++;
        }
        
      }
    };
    function replacePathIfHigher(path, repl, index){
      var result = path.substr(repl.length);
      var match = result.match(/^(\d+)(.*)/);
      if(match && match[1] > index){
        return repl + (match[1] - index) + match[2];
      } else {
        return path;
      }
    }
  // JSONPatch does not implement undo => not needed
  // // Computes the inverse of an operation. The inverse of an operation is the
  // // operation that reverts the effects of the operation, e.g. when you have an
  // // operation 'insert("hello "); skip(6);' then the inverse is 'delete("hello ");
  // // skip(6);'. The inverse should be used for implementing undo.
  // JSONPatchOperation.prototype.invert = function (str) {
  //   debugger;
  //   var strIndex = 0;
  //   var inverse = new JSONPatchOperation();
  //   var ops = this.ops;
  //   for (var i = 0, l = ops.length; i < l; i++) {
  //     var op = ops[i];
  //     if (isRetain(op)) {
  //       inverse.retain(op);
  //       strIndex += op;
  //     } else if (isInsert(op)) {
  //       inverse['delete'](op.length);
  //     } else { // delete op
  //       inverse.insert(str.slice(strIndex, strIndex - op));
  //       strIndex -= op;
  //     }
  //   }
  //   return inverse;
  // };

  // tomalec: not needed?? 
  // // Compose merges two consecutive operations into one operation, that
  // // preserves the changes of both. Or, in other words, for each input string S
  // // and a pair of consecutive operations A and B,
  // // apply(apply(S, A), B) = apply(S, compose(A, B)) must hold.
  // JSONPatchOperation.prototype.compose = function (operation2) {
  //   debugger;
  //   var operation1 = this;
  //   if (operation1.targetLength !== operation2.baseLength) {
  //     throw new Error("The base length of the second operation has to be the target length of the first operation");
  //   }

  //   var operation = new JSONPatchOperation(); // the combined operation
  //   var ops1 = operation1.ops, ops2 = operation2.ops; // for fast access
  //   var i1 = 0, i2 = 0; // current index into ops1 respectively ops2
  //   var op1 = ops1[i1++], op2 = ops2[i2++]; // current ops
  //   while (true) {
  //     // Dispatch on the type of op1 and op2
  //     if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
  //       // end condition: both ops1 and ops2 have been processed
  //       break;
  //     }

  //     if (isDelete(op1)) {
  //       operation['delete'](op1);
  //       op1 = ops1[i1++];
  //       continue;
  //     }
  //     if (isInsert(op2)) {
  //       operation.insert(op2);
  //       op2 = ops2[i2++];
  //       continue;
  //     }

  //     if (typeof op1 === 'undefined') {
  //       throw new Error("Cannot compose operations: first operation is too short.");
  //     }
  //     if (typeof op2 === 'undefined') {
  //       throw new Error("Cannot compose operations: first operation is too long.");
  //     }

  //     if (isRetain(op1) && isRetain(op2)) {
  //       if (op1 > op2) {
  //         operation.retain(op2);
  //         op1 = op1 - op2;
  //         op2 = ops2[i2++];
  //       } else if (op1 === op2) {
  //         operation.retain(op1);
  //         op1 = ops1[i1++];
  //         op2 = ops2[i2++];
  //       } else {
  //         operation.retain(op1);
  //         op2 = op2 - op1;
  //         op1 = ops1[i1++];
  //       }
  //     } else if (isInsert(op1) && isDelete(op2)) {
  //       if (op1.length > -op2) {
  //         op1 = op1.slice(-op2);
  //         op2 = ops2[i2++];
  //       } else if (op1.length === -op2) {
  //         op1 = ops1[i1++];
  //         op2 = ops2[i2++];
  //       } else {
  //         op2 = op2 + op1.length;
  //         op1 = ops1[i1++];
  //       }
  //     } else if (isInsert(op1) && isRetain(op2)) {
  //       if (op1.length > op2) {
  //         operation.insert(op1.slice(0, op2));
  //         op1 = op1.slice(op2);
  //         op2 = ops2[i2++];
  //       } else if (op1.length === op2) {
  //         operation.insert(op1);
  //         op1 = ops1[i1++];
  //         op2 = ops2[i2++];
  //       } else {
  //         operation.insert(op1);
  //         op2 = op2 - op1.length;
  //         op1 = ops1[i1++];
  //       }
  //     } else if (isRetain(op1) && isDelete(op2)) {
  //       if (op1 > -op2) {
  //         operation['delete'](op2);
  //         op1 = op1 + op2;
  //         op2 = ops2[i2++];
  //       } else if (op1 === -op2) {
  //         operation['delete'](op2);
  //         op1 = ops1[i1++];
  //         op2 = ops2[i2++];
  //       } else {
  //         operation['delete'](op1);
  //         op2 = op2 + op1;
  //         op1 = ops1[i1++];
  //       }
  //     } else {
  //       throw new Error(
  //         "This shouldn't happen: op1: " +
  //         JSON.stringify(op1) + ", op2: " +
  //         JSON.stringify(op2)
  //       );
  //     }
  //   }
  //   return operation;
  // };

  // tomalec: not needed?? 
  // function getSimpleOp (operation, fn) {
  //   debugger;
  //   var ops = operation.ops;
  //   var isRetain = JSONPatchOperation.isRetain;
  //   switch (ops.length) {
  //   case 1:
  //     return ops[0];
  //   case 2:
  //     return isRetain(ops[0]) ? ops[1] : (isRetain(ops[1]) ? ops[0] : null);
  //   case 3:
  //     if (isRetain(ops[0]) && isRetain(ops[2])) { return ops[1]; }
  //   }
  //   return null;
  // }

  // tomalec: not needed?? 
  // function getStartIndex (operation) {
  //   debugger;
  //   if (isRetain(operation.ops[0])) { return operation.ops[0]; }
  //   return 0;
  // }

  // tomalec: not needed?? 
  // // When you use ctrl-z to undo your latest changes, you expect the program not
  // // to undo every single keystroke but to undo your last sentence you wrote at
  // // a stretch or the deletion you did by holding the backspace key down. This
  // // This can be implemented by composing operations on the undo stack. This
  // // method can help decide whether two operations should be composed. It
  // // returns true if the operations are consecutive insert operations or both
  // // operations delete text at the same position. You may want to include other
  // // factors like the time since the last change in your decision.
  // JSONPatchOperation.prototype.shouldBeComposedWith = function (other) {
  //   debugger;
  //   if (this.isNoop() || other.isNoop()) { return true; }

  //   var startA = getStartIndex(this), startB = getStartIndex(other);
  //   var simpleA = getSimpleOp(this), simpleB = getSimpleOp(other);
  //   if (!simpleA || !simpleB) { return false; }

  //   if (isInsert(simpleA) && isInsert(simpleB)) {
  //     return startA + simpleA.length === startB;
  //   }

  //   if (isDelete(simpleA) && isDelete(simpleB)) {
  //     // there are two possibilities to delete: with backspace and with the
  //     // delete key.
  //     return (startB - simpleB === startA) || startA === startB;
  //   }

  //   return false;
  // };

  // tomalec: not needed?? 
  // // Decides whether two operations should be composed with each other
  // // if they were inverted, that is
  // // `shouldBeComposedWith(a, b) = shouldBeComposedWithInverted(b^{-1}, a^{-1})`.
  // JSONPatchOperation.prototype.shouldBeComposedWithInverted = function (other) {
  //   debugger;
  //   if (this.isNoop() || other.isNoop()) { return true; }

  //   var startA = getStartIndex(this), startB = getStartIndex(other);
  //   var simpleA = getSimpleOp(this), simpleB = getSimpleOp(other);
  //   if (!simpleA || !simpleB) { return false; }

  //   if (isInsert(simpleA) && isInsert(simpleB)) {
  //     return startA + simpleA.length === startB || startA === startB;
  //   }

  //   if (isDelete(simpleA) && isDelete(simpleB)) {
  //     return startB - simpleB === startA;
  //   }

  //   return false;
  // };

  // Transform takes two operations A and B that happened concurrently and
  // produces two operations A' and B' (in an array) such that
  // `apply(apply(S, A), B') = apply(apply(S, B), A')`. This function is the
  // heart of OT.
  JSONPatchOperation.transform____ = function (operation1, operation2) {
    debugger;
    if (operation1.baseLength !== operation2.baseLength) {
      throw new Error("Both operations have to have the same base length");
    }

    var operation1prime = new JSONPatchOperation();
    var operation2prime = new JSONPatchOperation();
    var ops1 = operation1.ops, ops2 = operation2.ops;
    var i1 = 0, i2 = 0;
    var op1 = ops1[i1++], op2 = ops2[i2++];
    while (true) {
      // At every iteration of the loop, the imaginary cursor that both
      // operation1 and operation2 have that operates on the input string must
      // have the same position in the input string.

      if (typeof op1 === 'undefined' && typeof op2 === 'undefined') {
        // end condition: both ops1 and ops2 have been processed
        break;
      }

      // next two cases: one or both ops are insert ops
      // => insert the string in the corresponding prime operation, skip it in
      // the other one. If both op1 and op2 are insert ops, prefer op1.
      if (isInsert(op1)) {
        operation1prime.insert(op1);
        operation2prime.retain(op1.length);
        op1 = ops1[i1++];
        continue;
      }
      if (isInsert(op2)) {
        operation1prime.retain(op2.length);
        operation2prime.insert(op2);
        op2 = ops2[i2++];
        continue;
      }

      if (typeof op1 === 'undefined') {
        throw new Error("Cannot compose operations: first operation is too short.");
      }
      if (typeof op2 === 'undefined') {
        throw new Error("Cannot compose operations: first operation is too long.");
      }

      var minl;
      if (isRetain(op1) && isRetain(op2)) {
        // Simple case: retain/retain
        if (op1 > op2) {
          minl = op2;
          op1 = op1 - op2;
          op2 = ops2[i2++];
        } else if (op1 === op2) {
          minl = op2;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1;
          op2 = op2 - op1;
          op1 = ops1[i1++];
        }
        operation1prime.retain(minl);
        operation2prime.retain(minl);
      } else if (isDelete(op1) && isDelete(op2)) {
        // Both operations delete the same string at the same position. We don't
        // need to produce any operations, we just skip over the delete ops and
        // handle the case that one operation deletes more than the other.
        if (-op1 > -op2) {
          op1 = op1 - op2;
          op2 = ops2[i2++];
        } else if (op1 === op2) {
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          op2 = op2 - op1;
          op1 = ops1[i1++];
        }
      // next two cases: delete/retain and retain/delete
      } else if (isDelete(op1) && isRetain(op2)) {
        if (-op1 > op2) {
          minl = op2;
          op1 = op1 + op2;
          op2 = ops2[i2++];
        } else if (-op1 === op2) {
          minl = op2;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = -op1;
          op2 = op2 + op1;
          op1 = ops1[i1++];
        }
        operation1prime['delete'](minl);
      } else if (isRetain(op1) && isDelete(op2)) {
        if (op1 > -op2) {
          minl = -op2;
          op1 = op1 + op2;
          op2 = ops2[i2++];
        } else if (op1 === -op2) {
          minl = op1;
          op1 = ops1[i1++];
          op2 = ops2[i2++];
        } else {
          minl = op1;
          op2 = op2 + op1;
          op1 = ops1[i1++];
        }
        operation2prime['delete'](minl);
      } else {
        throw new Error("The two operations aren't compatible");
      }
    }

    return [operation1prime, operation2prime];
  };

  return JSONPatchOperation;

}());

// Export for CommonJS
if (typeof module === 'object') {
  module.exports = ot.JSONPatchOperation;
}