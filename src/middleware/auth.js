require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const urlParams = new URLSearchParams(req.url.slice(1));
        console.log(`authorize jwt: ${urlParams}`)
        // Verifiera JWT:n
        const userData = jwt.verify(urlParams, process.env.JWT_SECRET)
        console.log(`token authorized for user ${userData.sub} ${userData.username}`)
        // Lägg med userData i request-objektet
        req.userData = userData
        next()
    } catch (error) {
        console.log(error.message)
        ws.close()
        res.status(401).send({
            message: "Authorization error",
            error: error.message
        })
    }
}