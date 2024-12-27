const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // Import node-cron
// const axios = require("axios");
const { poolPromise, sql } = require('./config/db'); // Ensure you have the DB connection properly configured
const dbCheckMiddleware = require('./middleware/dbCheck');
const authRoutes = require('./routes/auth');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json());
app.use(dbCheckMiddleware);

// Routes
app.use('/api', authRoutes);


// Add Cron Job Logic
cron.schedule("0 * * * *", async () => { // This runs the job every minute
    try {
        const pool = await poolPromise; // Use your pool connection
        // const result = await pool.request().query(`
        //   SELECT [EmployeeID], [TemporaryDepartment], [OriginalDepartment], [FromTime], [ToTime],
        //   DATEDIFF(HOUR, FromTime, GETDATE()) AS HoursDifference
        //   FROM [dbo].[DepartmentHistory]
        //   WHERE ToTime IS NULL;
        // `);
        const result = await pool.request().query(`
          SELECT 
            EmployeeID, 
            TemporaryDepartment, 
            OriginalDepartment, 
            FromTime 
          FROM [dbo].[DepartmentHistory]
          WHERE ToTime IS NULL 
            AND DATEDIFF(HOUR, FromTime, GETDATE()) >= 12
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

// Add Cron Job Logic
cron.schedule("0 * * * *", async () => { // Runs every 2 minutes
    try {
      const pool = await poolPromise;

       // Step 1: Find all active UserActivity records where LogoutTime is NULL and 12 hours have passed since LoginTime
       const userActivityResult = await pool.request().query(`
        SELECT EmployeeID, Department, LoginTime 
        FROM UserActivity
        WHERE LogoutTime IS NULL 
          AND DATEDIFF(HOUR, LoginTime, GETDATE()) >= 12
    `);
  
      const activeUsers = userActivityResult.recordset;
  
      // Step 2: For each active user, get their original department from Users table
      for (const user of activeUsers) {
        const userResult = await pool.request()
          .input("EmployeeID", sql.NVarChar, user.EmployeeID)
          .query(`
            SELECT Department 
            FROM [dbo].[Emp_Master]
            WHERE EmployeeID = @EmployeeID
          `);
  
        const originalDepartment = userResult.recordset[0]?.Department;
  
        if (originalDepartment) {
          // Step 3: Update the UserActivity table with the original department
          await pool.request()
            .input("EmployeeID", sql.NVarChar, user.EmployeeID)
            .input("Department", sql.NVarChar, originalDepartment)
            .input("LogoutTime", sql.DateTime, new Date()) // Update LogoutTime if needed
            .query(`
              UPDATE UserActivity
              SET Department = @Department, LogoutTime = @LogoutTime
              WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
            `);
  
          console.log(
            `Auto-logged out EmployeeID: ${user.EmployeeID} and restored to Department: ${originalDepartment}`
          );
        } else {
          console.log(
            `No matching original department found for EmployeeID: ${user.EmployeeID}`
          );
        }
      }
    } catch (error) {
      console.error("Error in cron job:", error.message);
    }
  });




// Schedule the task to check for changes in UserActivity every 5 seconds
// cron.schedule("*/5 * * * * *", async () => {
//   try {
//     const pool = await poolPromise;

//     // Check for any recent activity in the UserActivity table within the last 5 seconds
//     const result = await pool.request().query(`
//       SELECT COUNT(*) AS ChangeCount
//       FROM [dbo].[UserActivity]
//       WHERE 
//         DATEDIFF(SECOND, LoginTime, GETDATE()) < 5 
//         OR DATEDIFF(SECOND, LogoutTime, GETDATE()) < 5
//     `);

//     if (result.recordset[0].ChangeCount > 0) {
//       console.log("Detected changes in UserActivity. Triggering update-resources API...");

//       // Trigger the API to update resources
//       await axios.post("https://wip.fibrebondindustries.com/departments/update-resources", null, {
//         httpsAgent: new https.Agent({
//           rejectUnauthorized: false, // Accepts the SSL certificate for development
//         }),
//       });
      

//       console.log("API triggered successfully.");
//     } else {
//       console.log("No recent changes in UserActivity.");
//     }
//   } catch (error) {
//     console.error("Error monitoring UserActivity or triggering API:", error);
//   }
// });










// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on ${PORT}`);
// });


// HTTPS Configuration for local development
const options = {
  cert: fs.readFileSync('./ssl/server.crt'),  // Path to your SSL certificate
  key: fs.readFileSync('./ssl/server.key')   // Path to your private key
};

// Start the server with HTTPS https://localhost:5050
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});