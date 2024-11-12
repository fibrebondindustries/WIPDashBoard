const express = require('express');
const sql = require('mssql');
const cors = require('cors');

// Database connection configuration
const config = {
    user: 'remote_user', // Your SQL Server username
    password: 'FIBRE-IT1433', // Your SQL Server password
    server: '192.168.0.161', // Your SQL Server instance name
    database: 'WIPDATA', // Your database name
    Port: 1433,
    options: {
        encrypt: false, // Disable encryption for local development
        trustServerCertificate: true,
    }
};

// Initialize Express
const app = express();
const PORT = 5000;

// Use CORS middleware
app.use(cors()); // This will enable CORS for all routes

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("Connected to SQL Server successfully.");
        return pool;
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

// Create an API endpoint to retrieve data

// API to fetch filtered data based on department
// app.get('/api/data', async (req, res) => {
//     try {
//         const department = req.query.department; // Get department filter from query
//         const pool = await poolPromise;
//         const request = pool.request();

//         // If a department is specified, filter by department; otherwise, fetch all data
//         // let query = 'SELECT * FROM [WIPDATA].[dbo].[StagingTable]';
//         let query ="select T1.* , T2.[Description] from [dbo].[StagingTable] T1"+
// "             left join [dbo].[Description] T2 on T1.[JOB ORDER NO] = T2.[JOB ORDER NO]";
//         if (department) {
//             query += ' WHERE DEPARTMENT = @department';
//             request.input('department', sql.NVarChar, department);
//         }

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (err) {
//         console.error("Query failed:", err);
//         res.status(500).send("Error fetching data");
//     }
// });

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
        if (department && jobOrderNo) {
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
        res.status(500).send("Error fetching data");
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
