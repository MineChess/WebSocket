const WebSocket = require('ws');
require('dotenv').config();
const authorize = require('./middleware/auth');

const PORT = process.env.PORT || 5000;

const wss = new WebSocket.Server({ port: PORT }); //wss is the websocket server

let players = [];

console.log('WebSocket server is running on ws://localhost:', PORT);

wss.on('connection', (ws, req) => {

    if (!authorize(ws, req)) {
        ws.close(1008, "Authorization failed");
        console.log("Authorization failed: Connection closed");
        return;
    }

    console.log('New connection established');

    if (players.length < 2) {
        players.push(ws);
        const playerNumber = players.length;
        const message = JSON.stringify({ type: 'info', message: 'You are player ' + playerNumber });
        ws.send(message);
        console.log('Sent to player ' + playerNumber + ':', message);
        console.log('Number of connected players:', players.length);

        if (players.length === 2) {
            const startMessageWhite = JSON.stringify({ type: 'info', message: 'Game start! You are white.' });
            const startMessageBlack = JSON.stringify({ type: 'info', message: 'Game start! You are black.' });
            players[0].send(startMessageWhite);
            players[1].send(startMessageBlack);
            console.log('Game started');
            console.log('Sent to player 1:', startMessageWhite);
            console.log('Sent to player 2:', startMessageBlack);
        }

        // DC player after 1 hour (3600 seconds)
        const disconnectTimeout = setTimeout(() => {
            ws.close(1000, 'Session expired: Disconnected after 1 hour');
            console.log(`Player ${playerNumber} was disconnected after 1 hour`);
        }, 3600 * 1000); // 1 hour

        ws.on('message', (message) => {
            console.log('Received message:', message);
            try {
                const data = JSON.parse(message);
                if (data.type === 'move') {
                    players.forEach(player => {
                        if (player !== ws) {
                            player.send(message);
                            console.log('Broadcasted move:', message);
                        }
                    });
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Connection closed');
            clearTimeout(disconnectTimeout); // Clear the disconnect timeout if the player disconnects earlier
            players = players.filter(player => player !== ws);
            console.log('Number of connected players:', players.length);
        });
    } else {
        const fullMessage = JSON.stringify({ type: 'info', message: 'Game is full.' });
        ws.send(fullMessage);
        console.log('Sent to player: Game is full');
        ws.close();
    }
});
