const WebSocket = require('ws');
require('dotenv').config();
const authorize = require('./middleware/auth');

const PORT = process.env.PORT || 5000;
const wss = new WebSocket.Server({ port: PORT });
const clients = new Set();
let clientCount = 0;

const initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let gameBoard = JSON.parse(JSON.stringify(initialBoard)); // Deep copy of initial board

wss.on('connection', (ws, req) => {
    authorize(ws, req, () => {

        console.log(`Client connected`);

        if (!clients.has(ws)) {
            clients.add(ws);
            clientCount++;
            broadcastClientCount();

            // Send the initial game state to the newly connected client
            ws.send(JSON.stringify({
                type: 'gameState',
                board: gameBoard
            }));
        }

        console.log(`Connected clients: ${clients.size}`);

        ws.on('message', (message) => {
            const msg = JSON.parse(message);
            console.log('Received message:', msg);

            if (msg.type === 'move') {
                const start = msg.start;
                const end = msg.end;

                // Handle the move
                const piece = gameBoard[start[0]][start[1]];
                if (piece) {
                    // Move the piece
                    gameBoard[end[0]][end[1]] = piece; // Place the piece at the new position
                    gameBoard[start[0]][start[1]] = null; // Remove it from the old position

                    // Broadcast the new game state to all clients
                    broadcastGameState();
                } else {
                    console.log('Invalid move attempt:', msg);
                }
            }
        });

        ws.on('close', () => {
            if (clients.has(ws)) {
                clients.delete(ws);
                clientCount--;
                broadcastClientCount();
            }
            console.log('Client disconnected');
        });
    })

    function broadcastClientCount() {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'clientCount', count: clientCount }));
            }
        });
    }

    function broadcastGameState() {
        const message = JSON.stringify({ type: 'gameState', board: gameBoard });
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
});
