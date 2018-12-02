const net = require('net'),
    client = new net.Socket();

client.on("data", function (buffer) {
    const message = JSON.parse(buffer.toString());

    if (message.type === "modeRequest") {
        client.write(JSON.stringify({
            type: "mode",
            mode: "consumer",
            queue: "colita"
        }));
    }

    if (message.type === "handshakeSuccess") {
        client.removeAllListeners("data");
        client.on("data", handleMessage);
    }
});

function handleMessage(buffer) {
    console.log(JSON.parse(buffer.toString()));
}

client.connect(1337, '127.0.0.1');

client.on('close', function() {
	console.log('Connection closed');
});