var WebSocket = require('ws');

var wss = new WebSocket.Server({
    port: 3000,
    verifyClient: (a, cb) => {
        let authInfo = a.req.headers['sec-websocket-protocol'];
        let couldConnect = true
        wss.clients.forEach((client) => {
            if (client.protocol == authInfo) {
                couldConnect = false;
            }
        })
        cb(couldConnect);
    }
});
wss.on('connection', function connection(ws) {
    var userInfo = ws.protocol.split('.');
    console.log("room:" + userInfo[0] + " user:" + userInfo[1] + "connected");
    sendRoomUsers(userInfo[0])
    ws.on('message',(data) => {
        let toUser = JSON.parse(data).to
        wss.clients.forEach((client) => {
            try {
                if (client.protocol.split('.')[0] == userInfo[0] && client.protocol.split('.')[1] == toUser) {
                    client.send(data);
                    console.log(data)
                }
            } catch (e) {
                client.terminate();
                console.log(e)
            }
        });
    });
    ws.on('close', () => {
        sendRoomUsers(userInfo[0])
    });
    ws.isAlive = true;
    ws.on('pong', function heartbeat() {
        this.isAlive = true;
    });
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);

function sendRoomUsers(room) {
    let roomUsers = []
    wss.clients.forEach((client) => {
        if (client.protocol.split('.')[0] == room) {
            roomUsers.push(client.protocol.split('.')[1])
        }
    })
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({ roomUsers: roomUsers }))
    });
}