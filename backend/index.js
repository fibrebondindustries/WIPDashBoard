// const express = require('express');
// const sql = require('mssql');
// const cors = require('cors');

// // Database connection configuration
// const config = {
//     user: 'fbiazure',
//     password: 'FIBRE@007',
//     server: 'fbicloud.database.windows.net',
//     database: 'WIP-AzureDatabase',
//     options: {
//         encrypt: true,                  // Required for Azure SQL
//         trustServerCertificate: false,  // Must be false for Azure SQL
//     },
//     pool: {
//         max: 10,
//         min: 0,
//         idleTimeoutMillis: 30000
//     }
// };
// // Initialize Express
// const app = express();
// const PORT = 5050;

// // Use CORS middleware
// app.use(cors()); // This will enable CORS for all routes

// app.use(express.json()); // Add this line

// let isDatabaseConnected = true;

// // Create a connection pool

// const poolPromise = new sql.ConnectionPool(config)
//     .connect()
//     .then(pool => {
//         console.log("Connected to SQL Server successfully.");
//         isDatabaseConnected = true;
//         return pool;
//     })
//     .catch(err => {
//         console.error("Database connection failed. Retrying in 5 seconds...");
//         setTimeout(() => {
//             isDatabaseConnected = false;
//             poolPromise; // Retry connection
//         }, 5000);
//     });


// // Middleware to check database connection status
// app.use((req, res, next) => {
//     if (!isDatabaseConnected) {
//         return res.status(500).json({ error: "Database Connection Lost" });
//     }
//     next();
// });
    
// // Create an API endpoint to retrieve data
// app.get('/api/data', async (req, res) => {
//     try {
//         const department = req.query.department; // Get department filter from query
//         const jobOrderNo = req.query.jobOrderNo; // Get jobOrderNo filter from query
//         const pool = await poolPromise;
//         const request = pool.request();

//         // Base query to join StagingTable with Description table
//         let query = `
//             SELECT T1.*, T2.[Description]
//             FROM [dbo].[StagingTable] T1
//             LEFT JOIN [dbo].[Description] T2 ON T1.[JOB ORDER NO] = T2.[JOB ORDER NO]
//         `;

//         // Adding conditions based on provided filters
//        // Adding conditions based on provided filters
//        if (department === 'null') {
//         // If department is 'null', filter for rows where DEPARTMENT IS NULL
//         query += ' WHERE T1.DEPARTMENT IS NULL';
//          } else if (department && jobOrderNo) {
//             // If both department and jobOrderNo are provided, filter by both
//             query += ' WHERE T1.DEPARTMENT = @department AND T1.[JOB ORDER NO] = @jobOrderNo';
//             request.input('department', sql.NVarChar, department);
//             request.input('jobOrderNo', sql.NVarChar, jobOrderNo);
//         } else if (department) {
//             // If only department is provided, filter by department
//             query += ' WHERE T1.DEPARTMENT = @department';
//             request.input('department', sql.NVarChar, department);
//         } else if (jobOrderNo) {
//             // If only jobOrderNo is provided, filter by jobOrderNo
//             query += ' WHERE T1.[JOB ORDER NO] = @jobOrderNo';
//             request.input('jobOrderNo', sql.NVarChar, jobOrderNo);
//         }

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (err) {
//         console.error("Query failed:", err);
//         isDatabaseConnected = false; // Mark as disconnected if an error occurs
//         res.status(500).send("Error fetching data");
//     }
// });

// // Listen for SQL connection errors
// sql.on('error', err => {
//     console.error("SQL error:", err);
//     isDatabaseConnected = false;
// });

// // Health check API to verify database connection
// app.get('/api/health', async (req, res) => {
//     try {
//         const pool = await poolPromise;
//         const request = pool.request();
//         await request.query('SELECT 1'); // Simple query to check the connection
//         res.json({ status: 'connected' }); // If successful, database is connected
//     } catch (err) {
//         //console.error("Health check failed:", err);
//         res.status(500).json({ status: 'disconnected' }); // Database is disconnected
//     }
// });


// /// New API endpoint to retrieve data from the RawMReq table based on an optional job order number (JO NO)
// app.get('/api/stockData', async (req, res) => {
//     try {
//         const joNo = req.query.joNo; // Retrieve the 'joNo' parameter from the query string

//         const pool = await poolPromise;
//         const request = pool.request();

//         let query = 'SELECT * FROM [dbo].[stk_cls]';
//         if (joNo) {
//             // If a specific `joNo` is provided, add it to the query
//             query += ' WHERE [JO NO] = @joNo';
//             request.input('joNo', sql.NVarChar, joNo);
//         }

//         const result = await request.query(query);
//         const data = result.recordset; // Retrieve data from the query result

//         // Process each row to add the `isShortage` flag
//         const processedData = data.map((row) => ({
//             ...row,
//             isShortage: row['Quantity_Shortage'] !== null && row['Quantity_Shortage'] > 0, // Check if `Quantity_Shortage` is not null and greater than 0
//         }));

//         res.json(processedData); // Send the processed data as JSON
//     } catch (err) {
//         console.error("Query failed:", err);
//         res.status(500).json({ error: "Error fetching raw material stock data" });
//     }
// });


// app.get('/api/RMshortage', async (req, res) => {
//     try {
        

//         const pool = await poolPromise;
//         const request = pool.request();

//         let query = 'SELECT * FROM [dbo].[Shortage_Stock]';
       
//         const result = await request.query(query);

       
//         res.json(result.recordset);
//     } catch (err) {
//         console.error("Query failed:", err);
//         res.status(500).json({ error: "Error fetching raw material stock data" });
//     }
// });


// app.get('/api/BOXRMshortage', async (req, res) => {
//     try {
        

//         const pool = await poolPromise;
//         const request = pool.request();

//         let query = `SELECT [ITEM NAME],[RM ITEM DESCRIPTION], SUM([QUANTITY REQ-1]) as req, 
//         AVG([STOCK IN HAND]) as avail,AVG([Shortage]) as shortage FROM [dbo].[stk_cls] where [shortage] != 0 
//         and [PROCESS NAME] LIKE '%BOX%' group by [ITEM NAME],[RM ITEM DESCRIPTION]`;
       
//         const result = await request.query(query);

       
//         res.json(result.recordset);
//     } catch (err) {
//         console.error("Query failed:", err);
//         res.status(500).json({ error: "Error fetching raw material stock data" });
//     }
// });


// ////Admin Dashboard 23 nov

// app.post('/api/signup', async (req, res) => {
//     const { Name, Email, Mobile, Password, Auth, EmployeeID } = req.body;

//     if (!Name || !Email || !Mobile || !Password || !Auth || !EmployeeID) {
//         return res.status(400).json({ error: "All fields are required" });
//     }

//     try {
//         const pool = await poolPromise;

//         // Check if the email already exists
//         const emailCheckRequest = pool.request();
//         const emailCheck = await emailCheckRequest
//             .input('Email', sql.NVarChar, Email)
//             .query('SELECT * FROM [dbo].[Users] WHERE Email = @Email');

//         if (emailCheck.recordset.length > 0) {
//             return res.status(400).json({ error: "Email already registered" });
//         }

//         // Hash the password using bcrypt
//         const bcrypt = require('bcrypt');
//         const hashedPassword = await bcrypt.hash(Password, 10); // Hash the password with salt rounds = 10

//         // Insert the new user with the hashed password
//         const insertRequest = pool.request();
//         await insertRequest
//             .input('Name', sql.VarChar, Name)
//             .input('Email', sql.VarChar, Email)
//             .input('Mobile', sql.NVarChar, Mobile) // Use NVARCHAR here
//             .input('Password', sql.NVarChar, hashedPassword)
//             .input('Auth', sql.VarChar, Auth)
//             .input('EmployeeID', sql.VarChar, EmployeeID)
//             .query(`
//                 INSERT INTO [dbo].[Users] (Name, Email, Mobile, Password, Auth, EmployeeID)
//                 VALUES (@Name, @Email, @Mobile, @Password, @Auth, @EmployeeID)
//             `);

//         res.status(201).json({ message: "User registered successfully" });
//     } catch (err) {
//         console.error("Signup error:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });




// app.post('/api/login', async (req, res) => {
//     const { Email, Password } = req.body;

//     if (!Email || !Password) {
//         return res.status(400).json({ error: "Email and Password are required" });
//     }

//     try {
//         const pool = await poolPromise;
//         const request = pool.request();

//         // Retrieve the user record by email
//         const user = await request
//             .input('Email', sql.NVarChar, Email)
//             .query(`
//                 SELECT id, Name, Email, Mobile, Password, Auth, EmployeeID
//                 FROM [WIP-AzureDatabase].[dbo].[Users]
//                 WHERE Email = @Email
//             `);

//         if (user.recordset.length === 0) {
//             return res.status(401).json({ error: "Invalid Email or Password" });
//         }

//         // Compare the provided password with the hashed password in the database
//         const bcrypt = require('bcrypt');
//         const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

//         if (!isMatch) {
//             return res.status(401).json({ error: "Invalid Email or Password" });
//         }

//         // Return the user details (except the password)
//         res.status(200).json({
//             message: "Login successful",
//             user: {
//                 id: user.recordset[0].id,
//                 Name: user.recordset[0].Name,
//                 Email: user.recordset[0].Email,
//                 Mobile: user.recordset[0].Mobile,
//                 Auth: user.recordset[0].Auth,
//                 EmployeeID: user.recordset[0].EmployeeID,
//             },
//         });
//     } catch (err) {
//         console.error("Login error:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });



// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on ${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const dbCheckMiddleware = require('./middleware/dbCheck');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json());
app.use(dbCheckMiddleware);

// Routes
app.use('/api', authRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
