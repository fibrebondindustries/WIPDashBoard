const express = require('express');
const sql = require('mssql');
const cors = require('cors');

// Database connection configuration
const config = {
    user: 'fbiazure',
    password: 'FIBRE@007',
    server: 'fbicloud.database.windows.net',
    database: 'WIP-AzureDatabase',
    options: {
        encrypt: true,                  // Required for Azure SQL
        trustServerCertificate: false,  // Must be false for Azure SQL
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
// Initialize Express
const app = express();
const PORT = 5050;

// Use CORS middleware
app.use(cors()); // This will enable CORS for all routes

let isDatabaseConnected = true;

// Create a connection pool
// const poolPromise = new sql.ConnectionPool(config)
//     .connect()
//     .then(pool => {
//         console.log("Connected to SQL Server successfully.");
//         isDatabaseConnected = true;
//         return pool;
//     })
//     .catch(err => {
//         console.error("Database connection failed:", err);
//         isDatabaseConnected = false;
//     });
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Connected to SQL Server successfully.");
        isDatabaseConnected = true;
        return pool;
    })
    .catch(err => {
        console.error("Database connection failed. Retrying in 5 seconds...");
        setTimeout(() => {
            isDatabaseConnected = false;
            poolPromise; // Retry connection
        }, 5000);
    });


// Middleware to check database connection status
app.use((req, res, next) => {
    if (!isDatabaseConnected) {
        return res.status(500).json({ error: "Database Connection Lost" });
    }
    next();
});
    
// Create an API endpoint to retrieve data
app.get('/api/data', async (req, res) => {
    try {
        const department = req.query.department; // Get department filter from query
        const jobOrderNo = req.query.jobOrderNo; // Get jobOrderNo filter from query
        const pool = await poolPromise;
        const request = pool.request();

        // Base query to join StagingTable with Description table
        let query = `
            SELECT T1.*, T2.[Description]
            FROM [dbo].[StagingTable] T1
            LEFT JOIN [dbo].[Description] T2 ON T1.[JOB ORDER NO] = T2.[JOB ORDER NO]
        `;

        // Adding conditions based on provided filters
       // Adding conditions based on provided filters
       if (department === 'null') {
        // If department is 'null', filter for rows where DEPARTMENT IS NULL
        query += ' WHERE T1.DEPARTMENT IS NULL';
         } else if (department && jobOrderNo) {
            // If both department and jobOrderNo are provided, filter by both
            query += ' WHERE T1.DEPARTMENT = @department AND T1.[JOB ORDER NO] = @jobOrderNo';
            request.input('department', sql.NVarChar, department);
            request.input('jobOrderNo', sql.NVarChar, jobOrderNo);
        } else if (department) {
            // If only department is provided, filter by department
            query += ' WHERE T1.DEPARTMENT = @department';
            request.input('department', sql.NVarChar, department);
        } else if (jobOrderNo) {
            // If only jobOrderNo is provided, filter by jobOrderNo
            query += ' WHERE T1.[JOB ORDER NO] = @jobOrderNo';
            request.input('jobOrderNo', sql.NVarChar, jobOrderNo);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Query failed:", err);
        isDatabaseConnected = false; // Mark as disconnected if an error occurs
        res.status(500).send("Error fetching data");
    }
});

// Listen for SQL connection errors
sql.on('error', err => {
    console.error("SQL error:", err);
    isDatabaseConnected = false;
});

// Health check API to verify database connection
app.get('/api/health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        await request.query('SELECT 1'); // Simple query to check the connection
        res.json({ status: 'connected' }); // If successful, database is connected
    } catch (err) {
        //console.error("Health check failed:", err);
        res.status(500).json({ status: 'disconnected' }); // Database is disconnected
    }
});


/// New API endpoint to retrieve data from the RawMReq table based on an optional job order number (JO NO)
app.get('/api/stockData', async (req, res) => {
    try {
        const joNo = req.query.joNo; // Retrieve the 'joNo' parameter from the query string

        const pool = await poolPromise;
        const request = pool.request();

        let query = 'SELECT * FROM [dbo].[stk_cls]';
        if (joNo) {
            // If a specific `joNo` is provided, add it to the query
            query += ' WHERE [JO NO] = @joNo';
            request.input('joNo', sql.NVarChar, joNo);
        }

        const result = await request.query(query);
        const data = result.recordset; // Retrieve data from the query result

        // Process each row to add the `isShortage` flag
        const processedData = data.map((row) => ({
            ...row,
            isShortage: row['Quantity_Shortage'] !== null && row['Quantity_Shortage'] > 0, // Check if `Quantity_Shortage` is not null and greater than 0
        }));

        res.json(processedData); // Send the processed data as JSON
    } catch (err) {
        console.error("Query failed:", err);
        res.status(500).json({ error: "Error fetching raw material stock data" });
    }
});


app.get('/api/RMshortage', async (req, res) => {
    try {
        

        const pool = await poolPromise;
        const request = pool.request();

        let query = 'SELECT * FROM [dbo].[Shortage_Stock]';
       
        const result = await request.query(query);

       
        res.json(result.recordset);
    } catch (err) {
        console.error("Query failed:", err);
        res.status(500).json({ error: "Error fetching raw material stock data" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});