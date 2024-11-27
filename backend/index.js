// const express = require('express');
// const cors = require('cors');
// const dbCheckMiddleware = require('./middleware/dbCheck');
// const authRoutes = require('./routes/auth');

// const app = express();
// const PORT = 5050;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(dbCheckMiddleware);

// // Routes
// app.use('/api', authRoutes);

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on ${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // Import node-cron
const { poolPromise, sql } = require('./config/db'); // Ensure you have the DB connection properly configured
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

// Add Cron Job Logic
cron.schedule("0 * * * *", async () => {
    try {
        const pool = await poolPromise; // Use your pool connection
        const result = await pool.request().query(`
            SELECT EmployeeID, TemporaryDepartment, OriginalDepartment 
            FROM DepartmentHistory 
            WHERE ToTime IS NULL AND DATEDIFF(HOUR, FromTime, GETDATE()) >= 12
        `);

        const employeesToRestore = result.recordset;

        for (const employee of employeesToRestore) {
            // Update ToTime for the employee in DepartmentHistory
            await pool.request()
                .input("EmployeeID", sql.NVarChar, employee.EmployeeID)
                .input("ToTime", sql.DateTime, new Date())
                .query(`
                    UPDATE DepartmentHistory
                    SET ToTime = @ToTime
                    WHERE EmployeeID = @EmployeeID AND ToTime IS NULL
                `);

            console.log(`Restored EmployeeID: ${employee.EmployeeID} to OriginalDepartment: ${employee.OriginalDepartment}`);
        }
    } catch (error) {
        console.error("Error in cron job:", error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
