const sql = require('mssql');

const config = {
    user: 'fbiazure',
    password: 'FIBRE@007',
    server: 'fbicloud.database.windows.net',
    database: 'WIP-AzureDatabase',
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let isDatabaseConnected = true;

// Create the connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log('Connected to SQL Server successfully.');
        isDatabaseConnected = true;
        return pool;
    })
    .catch((err) => {
        console.error('Database connection failed. Retrying in 5 seconds...');
        setTimeout(() => {
            isDatabaseConnected = false;
            poolPromise; // Retry connection
        }, 5000);
    });

sql.on('error', (err) => {
    console.error('SQL error:', err);
    isDatabaseConnected = false;
});

module.exports = { sql, poolPromise, isDatabaseConnected };
