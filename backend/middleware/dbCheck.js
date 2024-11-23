const { isDatabaseConnected } = require('../config/db');

const dbCheckMiddleware = (req, res, next) => {
    if (!isDatabaseConnected) {
        return res.status(500).json({ error: 'Database Connection Lost' });
    }
    next();
};

module.exports = dbCheckMiddleware;
