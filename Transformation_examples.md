Client sends:
C_{1,0}: [{"op":"test","path":"/_ServerVersion","value":"0"},{"op":"replace","path":"/_ClientVersion$","value":1},{"op":"replace","path":"/Current/Answers/0/Choose$","value":true}]
Client sends:
C_{2,0}: [{"op":"test","path":"/_ServerVersion","value":"0"},{"op":"replace","path":"/_ClientVersion$","value":2},{"op":"replace","path":"/Current/Answers/1/Choose$","value":true}]
Server recieves C1, responds:
S_{1,1}: [{"op":"test","path":"/_ClientVersion$","value":1},{"op":"replace","path":"/_ServerVersion","value":1},{"op":"remove","path":"/Current/Answers/0"}]
Server recieves C_{2,0}:
 as C_{2,0} is based on out dated {"op":"test","path":"/_ServerVersion","value":"0"}, Puppets needs to transform (C_{2,0})' = transform(C_{2,0}, S_{1,1}) =: C_{2,0} * S_{1,1} (Op_{2,1})
 [* is non-commutative, associative operation]
 [as Cn is based on out dated {"op":"test","path":"/_ServerVersion","value":"x"}, Puppets needs to transform (C_{n,x}' = C_{n,x} * S_{n,x+1} * .. * S_{n,n-1} ]
 server-side app will get (C_{2,0})' 
 [{"op":"test","path":"/_ServerVersion","value":"1"},{"op":"replace","path":"/_ClientVersion$","value":2},{"op":"replace","path":"/Current/Answers/0/Choose$","value":true}]
