require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = (ws, req) => {
    try {
        const urlParams = new URLSearchParams(req.url.slice(1)); // Parse URL parameters from the request URL
        console.log(`authorize jwt: ${urlParams}`);
        
        const token = urlParams.get('token');
        if (!token) {
            throw new Error('JWT token is missing');
        }

        // Verify JWT
        const userData = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`token authorized for user ${userData.sub} ${userData.username}`);
        return true

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            console.log('JWT verification failed:', error.message);
        } else {
            console.log(error.message);
        }
        // Close ws with an authorization error
        return false
    }
};