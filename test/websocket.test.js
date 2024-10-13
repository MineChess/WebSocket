const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const authorize = require('../src/middleware/auth');

const PORT = process.env.PORT || 5000;
const SERVER_URL = `ws://localhost:${PORT}`;

let server;
let clients = [];

beforeAll((done) => {
    // Start the WebSocket server before tests
    server = new WebSocket.Server({ port: PORT }, done);
});

afterAll((done) => {
    // Close the server after tests
    server.close(done);
});

// Utility function to create a WebSocket client
const createClient = (token) => {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(SERVER_URL + `?token=${token}`);

        client.on('open', () => {
            resolve(client);
        });

        client.on('error', (error) => {
            reject(error);
        });
    });
};

// Utility function to generate a JWT token
const generateToken = (username) => {
    return jwt.sign({ sub: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('WebSocket Server Tests', () => {
    afterEach(() => {
        clients.forEach(client => client.close()); // Close all clients after each test
        clients = []; // Clear the clients array
    });

    it('should allow a client to connect with a valid token', async () => {
        const token = generateToken('user1');
        const client = await createClient(token);
        clients.push(client);

        client.on('message', (message) => {
            expect(message).toContain('You are player');
        });
    });

    it('should not allow connection without a token', (done) => {
        const client = new WebSocket(SERVER_URL);

        client.on('open', () => {
            // Should not reach this point
            done(new Error('Connection should not be established'));
        });

        client.on('close', (code) => {
            expect(code).toBe(1008); // Authorization failed
            done();
        });

        client.on('error', (error) => {
            // Handle connection error if needed
            done(error);
        });
    });

    it('should not allow connection with an invalid token', (done) => {
        const invalidToken = 'invalidtoken';
        const client = new WebSocket(SERVER_URL + `?token=${invalidToken}`);

        client.on('open', () => {
            // Should not reach this point
            done(new Error('Connection should not be established'));
        });

        client.on('close', (code) => {
            expect(code).toBe(1008); // Authorization failed
            done();
        });

        client.on('error', (error) => {
            // Handle connection error if needed
            done(error);
        });
    });

    it('should handle player messaging and broadcast', async () => {
        const token1 = generateToken('user1');
        const client1 = await createClient(token1);
        clients.push(client1);

        const token2 = generateToken('user2');
        const client2 = await createClient(token2);
        clients.push(client2);

        // Set up message listener for client2
        client2.on('message', (message) => {
            expect(message).toEqual(JSON.stringify({ type: 'move', data: 'move data' }));
        });

        // Simulate sending a message from client1
        client1.send(JSON.stringify({ type: 'move', data: 'move data' }));
    });

    it('should close connection when a player disconnects', async () => {
        const token = generateToken('user3');
        const client = await createClient(token);
        clients.push(client);

        expect(clients.length).toBe(1); // Before disconnect

        client.close(); // Close the connection

        // Allow some time for the close event to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        // Re-fetch clients to ensure the array reflects the actual connection state
        expect(clients.length).toBe(0); // After disconnect
    });
});
