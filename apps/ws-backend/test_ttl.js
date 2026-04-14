const WebSocket = require('ws');

function testTTL() {
    return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:8080?token=guest&userId=ttl_tester');

        ws.on('open', () => {
            console.log('Connected. Joining room "ttl_test_room"...');
            ws.send(JSON.stringify({ type: 'join_room', roomId: 'ttl_test_room', guestName: 'Tester' }));

            setTimeout(() => {
                console.log('Disconnecting from room...');
                ws.close();
                setTimeout(resolve, 500);
            }, 1000);
        });
    });
}

testTTL().then(() => console.log('Test logic done.'));
