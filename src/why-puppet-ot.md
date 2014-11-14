# Why do we need PuppetJS versioning and Operational Transformations?
# Optional Version control and JSON-Patch Transformations

Because of the asynchronous nature of bidirectional web communication (caused by network latency, server side push, etc), it can be assumed that client and the server are for most of the time out of sync. 
> In fact it is not necessarily client and server, all following applies as well to server-server, client-client, or any peer-to-peer collaborating on JSON document.

To improve mutual view-model consistency, we introduce optional features:

1. Versioning,
2. Operational Transformations.

## Versioning

PuppetJS uses JSON-Patch to reduce traffic, simplify applications flow, and improve UX. Therefore by nature of JSON-Patch, we need to assure that patches are applied by both peers (client and server) in the same order. On the other hand, JavaScript is asynchronous by nature, and we do not want to force application to be written in sequential, synchronous way.

To solve this problem we introduced optional versions in view-model

```
{
  "_ServerVersion": 0, 
  "_ClientVersion$": 0, 
  /* ... */
}
```

Since both parties uses separated copies of conceptually same JSON document, both need to monitor local and remote version number.
That's why both numbers are sent at the beginning of every batch of patches.  

Thus:
 - `_ServerVersion` is **server's local version**, and **client's remote version**
 - `_ClientVersion$` is **client's local version**, and **server's remote version**

The first patch in the batch is the `test` operation, which value is the last acknowledged remote version.

The second patch in the batch is the `replace` operation, which value is sender's local version, consecutive to the previously sent.

Version helps with:

1. Patch Queueing solves the problem of messages delivered in wrong order,
2. Supports possible JSON-Path Operational Transformation, by reducing the number of transformations needed.


A response is not always assumed for a request, so the features applies **not only** for regular HTTP client-server communication, but also WebSockets, server push, server-to-server, etc.
 
 * As every batch of changes is perpended with `op: "test"`, with (the latest acknowledged by) **sender's remote version**. So according to JSON-Patch spec entire batch will be applied if, and only if it matches **recipient's local version**.

  If it is grater than actual **recipient's local version** it should result in obvious error as incorrect input or hacking attempt. 
  > In regular synchronous case lower values should also be rejected, as it attempt to change outdated document. However, as we would like to keep asynchronicity, and do not buffer changes before sending to another peer (for performance and UX reasons), we need to **transform** JSON-Patch before application.

  :sparkles: With OT enabled lower values will not be immediately rejected, but applied only after [transformation](#JSON-Patch_OperationalTransformation).
 * Each peer updates **its** (acknowledged) **remote version** if, and only if other peer send valid `replace` operation (again, change is done according to common JSON-Patch rules),
 * Each peer should bump **its local version** (and send entire batch to other peer) whenever something change in its document (whenever batch of patches is applied).
   In some cases peer can respond with just (`"test"` plus) version bump (`"replace"`), to manifest it acknowledged and applied the change. However, it should be limited (most probably only server could send that) to avoid endless handshaking.


## Patch Queueing

Patch Queueing solves the problem of messages delivered in wrong order.

A batch of patches can be applied only if it contains a `op: "replace"` to **remote version** number which is greater by 1 than the last known **remote version** number.

If the remote version number is greater by more than 1 (a "version gap"), it is queued until a version greater exactly by 1 arrives, then all consecutive patches are applied.

If the remote version number is the same or smaller as the already acknowledged, that is a fatal error. (Same request comes another time, or someone is trying to hack document)

### Example

Initial JSON view-model:

```json
{
  "_ServerVersion": 0, 
  "_ClientVersion$": 0,
  "Message$": ""
}
```

Browser sends request #1:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/Message$", "value": "Hello "}
]
```

Browser sends request #2:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Message$", "value": "Hello World"}
]
```

In case the server receives patch with `_ClientVersion$: 2` before `_ClientVersion$: 1`, it must be queued. Only after `_ClientVersion$: 1` is applied over `_ClientVersion$: 0`, can `_ClientVersion$: 2` be applied over `_ClientVersion$: 1`.


## Path Operational Transformation

Path Operational Transformation solves the problem of the remote peer providing changes to document, that was already changed locally.
(When the **sender's remote version** is lower than current **recipient's local version**).

In such case according to [Operational Transformation principles](http://en.wikipedia.org/wiki/Operational_transformation) and using JSON-Patch Operation (link to more math.-oriented paper about JSON-Patches algebra - in progress by @tomalec) PuppetJS tries to transform given remote patch over patches that were already applied locally.

 > Here is where we use "Local Version Acknowledged By Remote"



### Example 1

A common scenario for that case is a purchase order items list where the client requests to remove multiple product items from the list faster than it receives the confirmation of removal from the server.

Initial JSON view-model:

```json
{
  "_ServerVersion": 0, 
  "_ClientVersion$": 0,
  "Items": [{
      "Description": "Ananas",
      "Remove$": false
    },{
      "Description": "Banana",
      "Remove$": false
    }]
}
```

Browser sends request #B1 to remove Ananas:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/Items/0/Remove$", "value": true}
]
```

Browser sends request #B2 to remove Banana:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Items/1/Remove$", "value": true}
]
```

Assuming that client requests arrive at the desired order, when the server receives `_ClientVersion$: 1` it removes Ananas from the array, and responds:

Server response #S1:
```json
[
  {"op": "test", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/_ServerVersion", "value": 1},
  {"op": "remove", "path": "/Items/0"}
]
```

In consequence, when #B2 with `_ClientVersion$: 2` arrives, Banana is already at the array index 0 and at the requested path to array index 1 is not valid anymore.

With JSON-Path Operational Transformation, the server compose (apply) on patch with another:
`B2' = B2 * S1`:
```json
  {"op": "test", "path": "/_ServerVersion", "value": 1},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Items/0/Remove$", "value": true}
```


:warning:
> `A * B != B * A` - order of patches matters! Same as in applying JSON-Patch to JSON document, as well in applying JSON-Patch to JSON-Patch
> See JSON-Patch algebra paper for more fancy details


### **Not an Example for Puppet JS OT**, but for app logic

A common scenario for that case is a quiz application which replaces a question on the screen after it receives an answer for the currently displayed question. In case when a user double different answers, before server responds.

Initial JSON view-model:

```json
{
  "_ServerVersion": 0, 
  "_ClientVersion$": 0,
  "Question": "What is the capital of Sweden?",
  "Answers": [{
      "Description": "Stockholm",
      "Select$": false
    },{
      "Description": "Berlin",
      "Select$": false
    }],
    ...
}
```

Browser sends request #B1 to select Answers:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/Answers/0/Select$", "value": true}
]
```
and as in previous example server responds #S1:
```json
[
  {"op": "test", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/_ServerVersion", "value": 1},
  {"op": "remove", "path": "/Answers/0"}
]
```

Before the server response reaches browser, the client clicks on Berlin by accident which results with request #B2:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Answers/1/Select$", "value": false}
]
```

Again as in previous example, server app receives transformed patch:

```json
  {"op": "test", "path": "/_ServerVersion", "value": 1},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Answers/0/Select$", "value": true}
```

Now it is up to application logic to react whether it supports selecting more than one answer or not.
#### Supports
then it may respond with 
```json
[
  {"op": "test", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/_ServerVersion", "value": 2},
  {"op": "remove", "path": "/Answers/0"}
]
```

#### Doesn't
then it may respond with 
```json
[
  {"op": "test", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/_ServerVersion", "value": 2},
  {"op": "replace", "path": "/Warning/", "value": "Beep! Some warning"},
  {"op": "replace", "path": "/Answers/", "value": "__correct set of currently available answers__"}
]
```

So we are not forcing application to any behavior, we give complete freedom, we only make sure that JSON document are consistent.
As app developers have complete freedom on writing asynchronous apps, they need to be aware of such scenarios anyways.



### Example 3 - failing transformation

Sometimes it may happen that transformation cannot be done.

A common scenario for that case is a purchase order items list where the client requests to remove multiple product items from the list faster than it receives the confirmation of removal from the server.

Initial JSON view-model:

```json
{
  "_ServerVersion": 0, 
  "_ClientVersion$": 0,
  "Items": [{
      "Description": "Banana",
      "Amount$": 10,
      "Remove$": false
    }]
}
```

Browser sends request #B1 to remove Bananas:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/Items/0/Remove$", "value": true}
]
```
As UX was not so well designed, user was able to change amount field, after clicking to delete it from basket, but before server response reached the browser.
Browser sends request #B2 to add one more Banana:

```json
[
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2},
  {"op": "replace", "path": "/Items/1/Amount$", "value": 11}
]
```

Server response #S1, for removing Bananas:
```json
[
  {"op": "test", "path": "/_ClientVersion$", "value": 1},
  {"op": "replace", "path": "/_ServerVersion", "value": 1},
  {"op": "remove", "path": "/Items/0"}
]
```

Then #B2 rives to the server.
So we try to transform JSON-Patch.


:warning:
> This highly depends on the way we implement specific transformations, as we can make it that way:

We could either 

### Imperatively state that server is the only source of truth, and precess with IT

`B2' = B2 * S1`:
```json
  {"op": "test", "path": "/_ServerVersion", "value": 1},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2}
```
As for server operations we are using IT (Inclusion Transformation - IT(A, B) defined that way the impact of B is effectively included), and for client we do 
ET (Exclusion Transformation - IT(A, B) defined that way the impact of B is effectively excluded)


### or give up

and reject the patch in a way that the recipient triggers a callback which can be registered by an application that wants to feedback an error to the user. This means that by default the error situations are handled "silently", but an application can decide to play a sound or show a message in case of a rejection.

Patch batches are considered non-atomic, meaning that if one patch gets rejected, the other patches before and after that can still be applied. It goes against the JSON Patch spec (RFC 6902) but is vital in case of a stream of independent UI events. The rejection callback is triggered as many times as there are patch rejections in the batch (one callback for one rejection)


### Questions:
1. Should version name be hardcoded or provided as parameter in PuppetJS constructor? In [my visualization](http://tomalec.github.io/Puppet-operational-transformation/visualization.html) I made it as parameters, as in general concept both peers are equal (transformations may differ).

2. Consider sending two test ops, for JSON-Patch clarity:
  ```json
  {"op": "test", "path": "/_ServerVersion", "value": 0},
  {"op": "test", "path": "/_ClientVersion", "value": 1},
  {"op": "replace", "path": "/_ClientVersion$", "value": 2}
```
  So in our [queuing process](#patch-queueing), fact that batch should not be applied will be clearly stated in JSON-Patch itself.

3. Consider explaining  "Local Version Acknowledged By Remote"(I still miss shorter name ;) ) it may be a bit of implementation detail