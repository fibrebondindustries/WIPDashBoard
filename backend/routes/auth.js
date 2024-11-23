const express = require('express');
const { poolPromise, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const router = express.Router();


// Create an API endpoint to retrieve data
router.get('/data', async (req, res) => {
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
router.get('/health', async (req, res) => {
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
router.get('/stockData', async (req, res) => {
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


router.get('/RMshortage', async (req, res) => {
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


router.get('/BOXRMshortage', async (req, res) => {
    try {
        

        const pool = await poolPromise;
        const request = pool.request();

        let query = `SELECT [ITEM NAME],[RM ITEM DESCRIPTION], SUM([QUANTITY REQ-1]) as req, 
        AVG([STOCK IN HAND]) as avail,AVG([Shortage]) as shortage FROM [dbo].[stk_cls] where [shortage] != 0 
        and [PROCESS NAME] LIKE '%BOX%' group by [ITEM NAME],[RM ITEM DESCRIPTION]`;
       
        const result = await request.query(query);

       
        res.json(result.recordset);
    } catch (err) {
        console.error("Query failed:", err);
        res.status(500).json({ error: "Error fetching raw material stock data" });
    }
});


////Admin Dashboard 23 nov
// Signup API
router.post('/signup', async (req, res) => {
    const { Name, Email, Mobile, Password, Auth, EmployeeID } = req.body;

    if (!Name || !Email || !Mobile || !Password || !Auth || !EmployeeID) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if the email already exists
        const emailCheck = await pool
            .request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT * FROM [dbo].[Users] WHERE Email = @Email');

        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert the user
        await pool
            .request()
            .input('Name', sql.VarChar, Name)
            .input('Email', sql.VarChar, Email)
            .input('Mobile', sql.NVarChar, Mobile)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('Auth', sql.VarChar, Auth)
            .input('EmployeeID', sql.VarChar, EmployeeID)
            .query(`
                INSERT INTO [dbo].[Users] (Name, Email, Mobile, Password, Auth, EmployeeID)
                VALUES (@Name, @Email, @Mobile, @Password, @Auth, @EmployeeID)
            `);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login API
// router.post('/login', async (req, res) => {
//     const { Email, Password } = req.body;

//     if (!Email || !Password) {
//         return res.status(400).json({ error: 'Please check your credentials' });
//     }

//     try {
//         const pool = await poolPromise;

//         // Fetch user by email
//         const user = await pool
//             .request()
//             .input('Email', sql.NVarChar, Email)
//             .query(`
//                 SELECT id, Name, Email, Mobile, Password, Auth, EmployeeID
//                 FROM [dbo].[Users]
//                 WHERE Email = @Email
//             `);

//         if (user.recordset.length === 0) {
//             return res.status(401).json({ error: 'Please check your credentials' });
//         }

//         // Compare the password
//         const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

//         if (!isMatch) {
//             return res.status(401).json({ error: 'Please check your credentials' });
//         }

//         // Return the user details
//         res.status(200).json({
//             message: 'Login successful',
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
//         console.error('Login error:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


router.post('/login', async (req, res) => {
    const { identifier, Password } = req.body;

    if (!identifier || !Password) {
        return res.status(400).json({ error: 'Please check your credentials' });
    }

    try {
        const pool = await poolPromise;

        // Query the database to find a user by Email or EmployeeID
        const user = await pool
            .request()
            .input('identifier', sql.NVarChar, identifier)
            .query(`
                SELECT id, Name, Email, Mobile, Password, Auth, EmployeeID
                FROM [dbo].[Users]
                WHERE Email = @identifier OR EmployeeID = @identifier
            `);

        // Check if the user exists
        if (user.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid Email/Employee ID or Password' });
        }

        // Compare the password using bcrypt
        const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid Email/Employee ID or Password' });
        }

        // Return the user details with appropriate redirection
        const redirectUrl = user.recordset[0].Auth === 'User' ? '/userPage' : '/dashboard';

        res.status(200).json({
            message: 'Login successful',
            redirectTo: redirectUrl,
            user: {
                id: user.recordset[0].id,
                Name: user.recordset[0].Name,
                Email: user.recordset[0].Email,
                Mobile: user.recordset[0].Mobile,
                Auth: user.recordset[0].Auth,
                EmployeeID: user.recordset[0].EmployeeID,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// router.post('/userActivity', async (req, res) => {
//     const { EmployeeID, loginTime, logoutTime } = req.body;

//     if (!EmployeeID || !loginTime || !logoutTime) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     try {
//         const pool = await poolPromise;
//         await pool
//             .request()
//             .input('EmployeeID', sql.NVarChar, EmployeeID)
//             .input('loginTime', sql.DateTime, loginTime)
//             .input('logoutTime', sql.DateTime, logoutTime)
//             .query(`
//                 INSERT INTO UserActivity (EmployeeID, loginTime, logoutTime)
//                 VALUES (@EmployeeID, @loginTime, @logoutTime)
//             `);

//         res.status(201).json({ message: 'Activity recorded successfully' });
//     } catch (err) {
//         console.error('Error recording activity:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.post('/userActivity', async (req, res) => {
    const { EmployeeID, loginTime, logoutTime } = req.body;

    if (!EmployeeID || !loginTime || !logoutTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const pool = await poolPromise;

        // Convert IST to UTC before storing
        const loginTimeUTC = convertISTToUTC(loginTime);
        const logoutTimeUTC = convertISTToUTC(logoutTime);

        await pool
            .request()
            .input('EmployeeID', sql.NVarChar, EmployeeID)
            .input('LoginTime', sql.DateTime, loginTimeUTC)
            .input('LogoutTime', sql.DateTime, logoutTimeUTC)
            .query(`
                INSERT INTO UserActivity (EmployeeID, LoginTime, LogoutTime)
                VALUES (@EmployeeID, @LoginTime, @LogoutTime)
            `);

        res.status(200).json({ message: 'Activity recorded successfully' });
    } catch (err) {
        console.error('Error recording activity:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Utility function to convert IST to UTC
function convertISTToUTC(istTime) {
    const istDate = new Date(istTime);
    const offsetIST = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(istDate.getTime() - offsetIST).toISOString().slice(0, 19).replace('T', ' ');
}

// Convert UTC to IST
function convertToIST(date) {
    const utcDate = new Date(date);
    const offsetIST = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(utcDate.getTime() + offsetIST).toISOString().slice(0, 19).replace('T', ' ');
}


module.exports = router;
