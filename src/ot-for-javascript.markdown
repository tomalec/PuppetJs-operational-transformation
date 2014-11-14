---
title: Operational Transformation in JavaScript
---

Getting started
---------------


### Node.JS

Install package with NPM:

~~~
    $ npm install ot
~~~

Here's how to include it:

<!-- TODO: usage with bower -->

~~~javascript
    var ot = require('ot');
~~~


### Browser

Download the [combined script](https://raw.github.com/Operational-Transformation/ot.js/master/dist/ot.js) that includes only the relevant parts for building a browser client or the [minified script](https://raw.github.com/Operational-Transformation/ot.js/master/dist/ot-min.js) for production.

A single global variable ``ot`` is exported.

<!--
The script has been tested on Chromium 17, Firefox 11 and Internet Explorer 9.
-->


Operation
---------

Operational Transformation is a general technology that can work with many types of documents like drawings, rich-text documents and complex data structures. However, this library currently includes only operations on plain text documents. Here's how you can create an operation:

~~~javascript
var operation = new ot.Operation()
  .retain(11)
  .insert(" dolor");
~~~

An operation is like a diff: it stores the changes done to a document. However, operations in this library work on single characters instead of whole lines. The operation in the example has two components: ``retain(11)`` and ``insert(' dolor')`` in that order. There's also a third type of component: ``delete(' some characters')``. An operation can include any number of components. Note that the insert and delete components don't save the position where the characters should be inserted respectively deleted. That's what the retain component type is for. When you apply an operation to a string, an invisible cursor begins traversing the string from left to right. The insert and *delete* components mutate the string at the current position of the cursor while the retain component simply advances the position of the cursor by the specified number of characters. Back to our example: the operation skips over the first 11 characters of the string and then appends the string "dolor ". We can apply it to a string like this:

~~~javascript
operation.apply("lorem ipsum"); // => "lorem ipsum dolor"
operation.apply("lorem ipsum amet"); // throws an error
~~~

The last example throws an error because the operation doesn't span the whole length of the string. To ensure correctness and to prevent mistakes, the invisible cursor must be positioned at the end of the input string after the last component. If we wanted to apply the operation operation to the second input string, we would have to add another component that skips over the last characters:

~~~javascript
operation.retain(5).apply("lorem ipsum amet"); // => "lorem ipsum dolor amet" 
// operation now contains the components retain(11), insert(" dolor") and retain(5)
~~~

Because of this rule, it is possible to infer the length of every valid input string and the length of the output string after applying the operation to a valid input string.

~~~javascript
"lorem ipsum amet".length; // => 16
operation.baseLength; // => 16
"lorem ipsum dolor amet".length; // => 22
operation.targetLength // => 22
~~~

But not every string of the correct length can be used as an operation as an input string. There's another rule that's used to make sure that an operation is correct. Delete components store the deleted characters instead of the number of deleted characters. When a delete component is applied, the stored characters must match the next characters in the input string.

~~~javascript
var operation = new ot.Operation() // create new operation
  .delete("lorem ")
  .retain(5);
operation.apply("lorem ipsum"); // => "ipsum"
operation.apply("trolo ipsum"); // throws an error
~~~

The way we have defined operations (any numbers of components instead of simple commands to insert or delete characters at a specified position) has one additional advantage: Two operations can be composed into one operation that includes the changes of both operations:

~~~javascript
// Define two consecutive operations
var operation0 = new ot.Operation()
  .retain(11)
  .insert(" dolor");
var operation1 = new ot.Operation()
  .delete("lorem ")
  .retain(11);

// Our input string
var str0 = "lorem ipsum";

// Apply operations one after another
var str1 = operation0.apply(str0); // "lorem ipsum dolor"
var str2a = operation1.apply(str1); // "ipsum dolor"

// Combine operations and apply the combined operation
var combinedOperation = operation0.compose(operation1);
var str2b = combinedOperation.apply(str0); // "ipsum dolor"
~~~

In this example, the user appended the characters " dolor" first and then deleted the first word "lorem ". But how can we handle the case when the changes have been performed by different users at the same time? That's when the ``transform`` function that is really at the heart of OT comes in:

~~~javascript
// Both users start with the same document
var str = "lorem ipsum";

// User A appends the string " dolor"
var operationA = new ot.Operation()
  .retain(11)
  .insert(" dolor");
var strA = operationA.apply(str); // "lorem ipsum dolor"

// User B deletes the string "lorem " at the beginning
var operationB = new ot.Operation()
  .delete("lorem ")
  .retain(5);
var strB = operationB.apply(str); // "ipsum";
~~~

We need a way to apply operationB to strA and operationA to operationA to strB such that the resulting strings are the equal. The function transform provides such a way. It takes two operations a and b that happened concurrently and computes two operations a' and b' such that when one client applies a and then b' to an input string and the other client applies b and then a', they both end up with the same string.

~~~javascript
var transformedPair = ot.Operation.transform(operationA, operationB);
var operationAPrime = transformedPair[0];
var operationBPrime = transformedPair[1];

var strABPrime = operationAPrime.apply(strB); // "ipsum dolor"
var strBAPrime = operationBPrime.apply(strA); // "ipsum dolor"
~~~

<!--
There is one additional method available on operations: ``invert`` returns a new operation that reverts all changes of a given operation. For example:

~~~javascript
var str = "lorem ipsum";
var operation = new ot.Operation()
  .delete("lorem ")
  .retain(5);
operation.apply(str); // => "ipsum"
var inverse = operation.invert();
inverse.apply(operation.apply(str)); // => "lorem ipsum"
~~~

This function comes in handy when implementing undo and redo stacks.
-->


<!--
CodeMirror integration
----------------------

Although this library can be extended to work with other editors like ACE from Cloud9 or simple textarea elements, it is intended to be used together with `CodeMirror <https://codemirror.net/>`_. You can can listen for changes on the CodeMirror instance and convert them like this:

~~~javascript
var oldValue = "lorem ipsum\ndolor sit amet";
var wrapper = document.getElementById('wrapper');
var cm = CodeMirror(wrapper, {
  value: oldValue,
  onChange: function (cm, change) {
    var operation = new ot.Operation().fromCodeMirrorChange(change, oldValue);
    // do something with the operation here, like logging it
    // or sending it to the server
    oldValue = cm.getValue();
  }
});
~~~

You have to call the method `fromCodeMirrorChange` with a [CodeMirror change object](http://codemirror.net/doc/manual.html#option_onChange>) and the value of the editor *before* the change. This is necessary to store the deleted characters if characters were deleted.

The method ``applyToCodeMirror`` applies an operation to a CodeMirror instance. Theoretically, it is not strictly necessary, because you could simply get the current value from the editor, apply the operation and set the new value. However, this approach has several disadvantages. Firstly, CodeMirror needs to rebuild it's internal datastructures, a substantial amount of CodeMirror's DOM tree needs to be rerendered and syntax highlighting needs to start from the beginning of the document. Secondly, the user's current cursor position is lost. Here's how you can use it:

~~~javascript
var operation = new ot.Operation()
  .retain(6)
  .delete(" ipsum")
  .retain(15);
operation.applyToCodeMirror(cm);
~~~

A call to this method will trigger the ``onChange`` callback. Therefore you have to be careful not to create infinite loops by applying an operation received from the server and sending it back to the server as if it was a change that the user has made.
-->


Server
------

~~~javascript
var server = new ot.Server("lorem ipsum");
server.broadcast = function (operation) {
  // you have to broadcast the operation to all connected
  // clients including the one that the operation came from
};

// when you receive an operation as a JSON string from one of the clients, do:
function onReceiveOperation (json) {
  var operation = ot.Operation.fromJSON(JSON.parse(json));
}
~~~


Client
-------

~~~javascript
var client = new ot.Client(0); // the client joins at revision 0

client.applyOperation = function (operation) {
  // apply the operation to the editor, e.g.
  // operation.applyToCodeMirror(cm);
};

client.sendOperation = function (operation) {
  // send the operation to the server, e.g. with ajax:
  $.ajax({
    url: '/operations',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(operation)
  });
};

function onUserChange (change) {
  var operation = client.createOperation(); // has the right revision number
  // initialize operation here with for example operation.fromCodeMirrorChange
  client.applyClient(operation);
}

function onReceiveOperation (json) {
  var operation = ot.Operation.fromJSON(JSON.parse(json));
  client.applyServer(operation);
}
~~~


Feedback and questions
----------------------

* GitHub: https://github.com/Operational-Transformation/ot.js
* Email: `tim@timbaumann.info <mailto:tim@timbaumann.info>`_

<!--
* IRC: there's a good chance I'm hanging out as timjb on #tree (that's the channel of the `Tree project <https://github.com/garden/tree>`_, a project using my library)
-->

