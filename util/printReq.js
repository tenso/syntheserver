/*global require*/
var net = require("net");

var server = net.createServer((socket) => {
    socket.on("end", () => {
        console.log("client disconnected");
    });
    socket.on("data", (data) => {
        console.log(data.toString());
    });
});

server.listen({
  host: "localhost",
  port: 80,
  exclusive: true
});
