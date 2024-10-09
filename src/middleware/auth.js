require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = (ws, req, next) => {
    try {
        const urlParams = new URLSearchParams(req.url.slice(1));
        console.log(`authorize jwt: ${urlParams}`);
        
        const token = urlParams.get('token');
        if (!token) {
            throw new Error('JWT token is missing');
        }

        // Verifiera JWT
        const userData = jwt.verify(urlParams.get('token'), process.env.JWT_SECRET);
        console.log(`token authorized for user ${userData.sub} ${userData.username}`);
        
        // Lägg med userData i request-objektet
        req.userData = userData;

    } catch (error) {
        console.log(error.message);
        // Stäng ws, GPT
        ws.close(1008, "Authorization error: " + error.message);
    }
};