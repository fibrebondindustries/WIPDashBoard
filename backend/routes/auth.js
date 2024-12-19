const express = require("express");
const { poolPromise, sql } = require("../config/db");
const bcrypt = require("bcrypt");
const router = express.Router();

// Create an API endpoint to retrieve data
// router.get("/data", async (req, res) => {
//   try {
//     const department = req.query.department; // Get department filter from query
//     const jobOrderNo = req.query.jobOrderNo; // Get jobOrderNo filter from query
//     const pool = await poolPromise;
//     const request = pool.request();

    // // Base query to join StagingTable with Description table
    // let query = `
    //         SELECT T1.*, T2.[Description]
    //         FROM [dbo].[StagingTable] T1
    //         LEFT JOIN [dbo].[Description] T2 ON T1.[JOB ORDER NO] = T2.[JOB ORDER NO]
    //     `;

 
//     // Adding conditions based on provided filters
//     if (department === "null") {
//       // If department is 'null', filter for rows where DEPARTMENT IS NULL
//       query += " WHERE T1.DEPARTMENT IS NULL";
//     } else if (department && jobOrderNo) {
//       // If both department and jobOrderNo are provided, filter by both
//       query +=
//         " WHERE T1.DEPARTMENT = @department AND T1.[JOB ORDER NO] = @jobOrderNo";
//       request.input("department", sql.NVarChar, department);
//       request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
//     } else if (department) {
//       // If only department is provided, filter by department
//       query += " WHERE T1.DEPARTMENT = @department";
//       request.input("department", sql.NVarChar, department);
//     } else if (jobOrderNo) {
//       // If only jobOrderNo is provided, filter by jobOrderNo
//       query += " WHERE T1.[JOB ORDER NO] = @jobOrderNo";
//       request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
//     }

//     const result = await request.query(query);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Query failed:", err);
//     isDatabaseConnected = false; // Mark as disconnected if an error occurs
//     res.status(500).send("Error fetching data");
//   }
// });


router.get("/data", async (req, res) => {
  try {
    const department = req.query.department; // Get department filter from query
    const jobOrderNo = req.query.jobOrderNo; // Get jobOrderNo filter from query
    const pool = await poolPromise;
    const request = pool.request();

    // Base query to join StagingTable with WIP table
    let query = `
      SELECT 
        T1.[JOB ORDER NO], 
        T1.[JOB ORDER DATE], 
        T1.[ITEM NAME], 
        T1.[PROCESS NAME], 
        T1.[PROCESS GROUP], 
        T1.[QUANTITY], 
        T1.[DEPARTMENT],
        T1.[Updated_Time],
        T1.[PendingProcess],
        T2.[Description],
        WIP.[WorkerStatus],
        WIP.[Result],
        WIP.[Wip_quantity]
      FROM [dbo].[StagingTable] T1
      LEFT JOIN [dbo].[WIP] WIP ON T1.[DEPARTMENT] = WIP.[DEPARTMENT]
      LEFT JOIN [dbo].[Description] T2 ON T1.[JOB ORDER NO] = T2.[JOB ORDER NO]
    `;

    // Adding conditions based on provided filters
    if (department === "null") {
      query += " WHERE T1.DEPARTMENT IS NULL";
    } else if (department && jobOrderNo) {
      query +=
        " WHERE T1.DEPARTMENT = @department AND T1.[JOB ORDER NO] = @jobOrderNo";
      request.input("department", sql.NVarChar, department);
      request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
    } else if (department) {
      query += " WHERE T1.DEPARTMENT = @department";
      request.input("department", sql.NVarChar, department);
    } else if (jobOrderNo) {
      query += " WHERE T1.[JOB ORDER NO] = @jobOrderNo";
      request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Query failed:", err);
    res.status(500).send("Error fetching data");
  }
});


// Listen for SQL connection errors
sql.on("error", (err) => {
  console.error("SQL error:", err);
  isDatabaseConnected = false;
});

// Health check API to verify database connection
router.get("/health", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    await request.query("SELECT 1"); // Simple query to check the connection
    res.json({ status: "connected" }); // If successful, database is connected
  } catch (err) {
    //console.error("Health check failed:", err);
    res.status(500).json({ status: "disconnected" }); // Database is disconnected
  }
});

/// New API endpoint to retrieve data from the RawMReq table based on an optional job order number (JO NO)
router.get("/stockData", async (req, res) => {
  try {
    const joNo = req.query.joNo; // Retrieve the 'joNo' parameter from the query string

    const pool = await poolPromise;
    const request = pool.request();

    let query = "SELECT * FROM [dbo].[stk_cls]";
    if (joNo) {
      // If a specific `joNo` is provided, add it to the query
      query += " WHERE [JO NO] = @joNo";
      request.input("joNo", sql.NVarChar, joNo);
    }

    const result = await request.query(query);
    const data = result.recordset; // Retrieve data from the query result

    // Process each row to add the `isShortage` flag
    const processedData = data.map((row) => ({
      ...row,
      isShortage:
        row["Quantity_Shortage"] !== null && row["Quantity_Shortage"] > 0, // Check if `Quantity_Shortage` is not null and greater than 0
    }));

    res.json(processedData); // Send the processed data as JSON
  } catch (err) {
    console.error("Query failed:", err);
    res.status(500).json({ error: "Error fetching raw material stock data" });
  }
});

router.get("/RMshortage", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = "SELECT * FROM [dbo].[Shortage_Stock]";

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error("Query failed:", err);
    res.status(500).json({ error: "Error fetching raw material stock data" });
  }
});

router.get("/BOXRMshortage", async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = `SELECT [ITEM NAME],[RM ITEM DESCRIPTION],SUM([QUANTITY REQ-1]) AS req,AVG([STOCK IN HAND]) AS avail,
    (CASE WHEN SUM([QUANTITY REQ-1]) > AVG([STOCK IN HAND]) THEN SUM([QUANTITY REQ-1]) - AVG([STOCK IN HAND])ELSE 0
    END) AS shortage FROM [dbo].[stk_cls] WHERE [PROCESS NAME] LIKE '%BOX%' GROUP BY [ITEM NAME],[RM ITEM DESCRIPTION]
HAVING 
    SUM([QUANTITY REQ-1]) > AVG([STOCK IN HAND])`;

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error("Query failed:", err);
    res.status(500).json({ error: "Error fetching raw material stock data" });
  }
});


////Admin Dashboard 23 nov
router.post("/signup", async (req, res) => {
  const { Name, Password, Auth, EmployeeID, Department } = req.body;

  // Validate all required fields !Name || !Email || !Mobile || 
  if (!Password ) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!EmployeeID ) {
    return res.status(400).json({ error: "EmployeeID is required" });
  }
  if (!Department ) {
    return res.status(400).json({ error: "Department is required" });
  }
  try {
    const pool = await poolPromise;

    // Check if the EmployeeID already exists
    const employeeIDCheck = await pool
      .request()
      .input("EmployeeID", sql.VarChar, EmployeeID)
      .query("SELECT * FROM [dbo].[Emp_Master] WHERE EmployeeID = @EmployeeID");

    if (employeeIDCheck.recordset.length > 0) {
      return res.status(400).json({ error: "EmployeeID already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert the user
    await pool
      .request()
      .input("Name", sql.VarChar, Name)
      // .input("Email", sql.VarChar, Email)
      // .input("Mobile", sql.NVarChar, Mobile)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("Auth", sql.VarChar, Auth)
      .input("EmployeeID", sql.VarChar, EmployeeID)
      .input("Department", sql.VarChar, Department) // Add Department input
      .query(`
        INSERT INTO [dbo].[Emp_Master] (Name, Password, Auth, EmployeeID, Department)
        VALUES (@Name, @Password, @Auth, @EmployeeID, @Department)
      `);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Login API

router.post("/login", async (req, res) => {
  const { identifier, Password } = req.body;

  if (!identifier || !Password) {
    return res.status(400).json({ error: "Please check your credentials" });
  }

  try {
    const pool = await poolPromise;

    // Query the database to find a user by Email or EmployeeID
    const user = await pool
      .request()
      .input("identifier", sql.NVarChar, identifier)
      .query(`
        SELECT 
        Name, Password, Auth, EmployeeID, Department
        FROM [dbo].[Emp_Master]
        WHERE EmployeeID = @identifier
      `);

    if (user.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid Employee ID or Password" });
    }

    const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Employee ID or Password" });
    }

    const currentTime = new Date().toISOString();

    const departmentHistory = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
      .input("CurrentTime", sql.DateTime, currentTime)
      .query(`
        SELECT 
          TemporaryDepartment 
        FROM [dbo].[DepartmentHistory]
        WHERE EmployeeID = @EmployeeID 
          AND FromTime <= @CurrentTime
          AND (ToTime IS NULL OR ToTime >= @CurrentTime)
        ORDER BY FromTime DESC
      `);

    let activeDepartment = user.recordset[0].Department;

    if (departmentHistory.recordset.length > 0) {
      activeDepartment = departmentHistory.recordset[0].TemporaryDepartment;
    }

    if (user.recordset[0].Auth === "User") {
      const loginTime = new Date().toISOString();
      await pool
        .request()
        .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
        .input("LoginTime", sql.DateTime, loginTime)
        .input("Department", sql.NVarChar, activeDepartment)
        .query(`
          INSERT INTO UserActivity (EmployeeID, LoginTime, Department)
          VALUES (@EmployeeID, @LoginTime, @Department)
        `);
    }

    // Handle Supervisor and SuperAdmin roles // 19 Dec 
    if (user.recordset[0].Auth === "Supervisor" || user.recordset[0].Auth === "SuperAdmin") {
      // console.log(`${user.recordset[0].Auth} logged in successfully`);
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        Name: user.recordset[0].Name,
        Auth: user.recordset[0].Auth,
        EmployeeID: user.recordset[0].EmployeeID,
        Department: activeDepartment,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/logout", async (req, res) => {
  const { EmployeeID, logoutTime } = req.body;

  if (!EmployeeID || !logoutTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pool = await poolPromise;

    // Update LogoutTime for the latest login entry
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("LogoutTime", sql.DateTime, logoutTime)
      .query(`
        UPDATE UserActivity
        SET LogoutTime = @LogoutTime
        WHERE EmployeeID = @EmployeeID
          AND LogoutTime IS NULL
      `);

    res.status(200).json({ message: "Logout time updated successfully" });
  } catch (err) {
    console.error("Error updating logout time:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




///26 nov

router.get("/AllUsers", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.query("SELECT * FROM [dbo].[Emp_Master]");
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get user by id
router.get("/users/:employeeID", async (req, res) => {
  const { employeeID  } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, employeeID)
      .query("SELECT * FROM [dbo].[Emp_Master] WHERE EmployeeID = @EmployeeID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching user by EmployeeID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

///update user
router.put("/users/:employeeID", async (req, res) => {
  const { employeeID } = req.params;
  const { Name, Auth, Department, Password, NewEmployeeID  } = req.body;

 
  if (!Name) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  if (!Department ) {
    return res.status(400).json({ error: "Department is required" });
  }
  if (!Auth) {
    return res.status(400).json({ error: "Auth is required" });
  }

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, employeeID)
      .query("SELECT * FROM [dbo].[Emp_Master] WHERE EmployeeID = @EmployeeID");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingUser = userCheck.recordset[0];

    // Password update logic
    let hashedPassword = existingUser.Password; // Default to existing password

    if (Password && Password.trim() !== "") {
      // Check if the new password matches the existing one
      const isSamePassword = await bcrypt.compare(Password, existingUser.Password);
      if (isSamePassword) {
        return res.status(400).json({ error: "New password cannot be the same as the old password." });
      }

      // Hash the new password
      hashedPassword = await bcrypt.hash(Password, 10);
    }

    // Update the user
    await pool
      .request()
      .input("Name", sql.NVarChar, Name)
      .input("Auth", sql.NVarChar, Auth)
      .input("Department", sql.NVarChar, Department)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("EmployeeID", sql.NVarChar, employeeID) // Match EmployeeID in WHERE clause
      .input("NewEmployeeID", sql.NVarChar, NewEmployeeID || employeeID) // Use existing if not provided
      .query(`
        UPDATE [dbo].[Emp_Master]
        SET Name = @Name, 
            Auth = @Auth, 
            Department = @Department,
            Password = @Password,
            EmployeeID = @NewEmployeeID
        WHERE EmployeeID = @EmployeeID
      `);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.delete("/users/:employeeID", async (req, res) => {
  const { employeeID } = req.params;

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, employeeID)
      .query("SELECT * FROM [dbo].[Emp_Master] WHERE EmployeeID = @EmployeeID");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, employeeID)
      .query("DELETE FROM [dbo].[Emp_Master] WHERE EmployeeID = @EmployeeID");

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//06 nov
router.get("/departments", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT DepartmentName FROM Departments");
    res.status(200).json(result.recordset.map((row) => row.DepartmentName));
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//end

///27 Nov
router.get("/presentEmployees", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT EmployeeID, Department, COUNT(*) AS PresentEmployees
      FROM [dbo].[UserActivity]
      WHERE CAST(LoginTime AS DATE) = CAST(GETDATE() AS DATE) AND LogoutTime IS NULL
      GROUP BY EmployeeID, Department
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching present employees:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/assignTemporaryDepartment", async (req, res) => {
  const { EmployeeID, TemporaryDepartment, AssignedBy } = req.body;

  if (!EmployeeID || !TemporaryDepartment || !AssignedBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pool = await poolPromise;

    // Check if the employee is present today and not logged out
    const employeeCheckResult = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .query(`
        SELECT * 
        FROM UserActivity
        WHERE EmployeeID = @EmployeeID 
          AND CAST(LoginTime AS DATE) = CAST(GETDATE() AS DATE)
          AND LogoutTime IS NULL
      `);

    // If the employee is not found or logged out, return an error
    if (employeeCheckResult.recordset.length === 0) {
      return res.status(400).json({
        error: "This employee is not present today or already logged out!",
      });
    }

    const fromTime = new Date().toISOString(); // Current time

    // Insert into DepartmentHistory table
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("TemporaryDepartment", sql.NVarChar, TemporaryDepartment)
      .input("FromTime", sql.DateTime, fromTime)
      .input("AssignedBy", sql.NVarChar, AssignedBy)
      .query(`
        INSERT INTO DepartmentHistory (EmployeeID, OriginalDepartment, TemporaryDepartment, FromTime, AssignedBy)
        SELECT EmployeeID, Department, @TemporaryDepartment, @FromTime, @AssignedBy
        FROM UserActivity
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    // Update the employee's current department in UserActivity
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("TemporaryDepartment", sql.NVarChar, TemporaryDepartment)
      .query(`
        UPDATE UserActivity
        SET Department = @TemporaryDepartment
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    res.status(200).json({ message: "Employee assigned to temporary department" });
  } catch (err) {
    console.error("Error assigning temporary department:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/restoreDepartment", async (req, res) => {
  const { EmployeeID } = req.body;

  if (!EmployeeID) {
    return res.status(400).json({ error: "EmployeeID is required" });
  }

  try {
    const pool = await poolPromise;
    const toTime = new Date().toISOString(); // Current time

    // Update the end time in DepartmentHistory
    const updateHistory = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("ToTime", sql.DateTime, toTime)
      .query(`
        UPDATE DepartmentHistory
        SET ToTime = @ToTime
        WHERE EmployeeID = @EmployeeID AND ToTime IS NULL
      `);

    if (updateHistory.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No active temporary assignment found for this employee." });
    }

    // Restore the original department in UserActivity
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .query(`
        UPDATE UserActivity
        SET Department = (
          SELECT TOP 1 OriginalDepartment
          FROM DepartmentHistory
          WHERE EmployeeID = @EmployeeID
          AND ToTime = (SELECT MAX(ToTime) FROM DepartmentHistory WHERE EmployeeID = @EmployeeID)
        )
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    res.status(200).json({ message: "Employee restored to original department" });
  } catch (err) {
    console.error("Error restoring department:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//// get Assigned department from DepartmentHistory
router.get("/temporaryDepartments", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to fetch employees with a temporary department where ToTime is NULL
    const result = await pool.request().query(`
      SELECT 
        EmployeeID,
        TemporaryDepartment,
        FromTime,
        AssignedBy
      FROM DepartmentHistory
      WHERE ToTime IS NULL
    `);

    // Return the result
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching temporary departments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


///////////// worker module 
// router.get("/departments/worker-requirements", async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request().query(`
//       SELECT 
//         DepartmentName,
//         LotQuantity,
//         RequiredResource,
//         AvailableResource,
//         (RequiredResource - AvailableResource) AS ToFill
//       FROM Departments
//     `);

//     res.status(200).json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching department worker requirements:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
// // Define Department Ratios (Fixed Lots per Worker for Each Department)





router.get("/departments/worker-requirements", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
     WITH DepartmentSummary AS (
          SELECT 
              st.[DEPARTMENT],
              SUM(ISNULL(st.[QUANTITY], 0)) AS TotalQuantity, -- Total Quantity for the department
              wh.[Quantity] AS QuantityPerMin, -- Quantity completed per minute
              wh.[Quantity Per Hour], -- Quantity completed per hour
              dr.[LotQuantityPerWorker], -- Worker ratio
              23000 AS StandardQuantity -- Standard benchmark quantity
          FROM [dbo].[StagingTable] st
          LEFT JOIN [dbo].[WorkingHours] wh
              ON st.[DEPARTMENT] = wh.[Departments]
          LEFT JOIN (
              VALUES
              ('FOAM CUTTING', 10000),
              ('GLUING', 6666),
              ('PRESSING', 10000),
              ('BELT CUTTING DEPT', 5000),
              ('SKRWING DEPARTMENT', 5000),
              ('PESTING', 2500),
              ('NOKE', 3333),
              ('COLOUR DEPARTMENT', 1666),
              ('DESIGN DEPARTMENT', 2222),
              ('LOOPI DEPARTMENT', 2857),
              ('PUCTURE DEPARTMENT', 2857),
              ('BUCKLE STITCHING', 5000),
              ('BUCKLE BURNING', 10000),
              ('BELT CHECKING & CLEANING', 5000),
              ('SCREW FITTING', 1666),
              ('PANNI PACKING', 2857),
              ('BOX FOLDING', 10000),
              ('BOX PACKING', 6666),
              ('CARTON MAKING', 10000),
              ('BELT STITCHING', 2857),
              ('PVC', 1666)
          ) AS dr([DepartmentName], [LotQuantityPerWorker])
              ON st.[DEPARTMENT] = dr.[DepartmentName]
          GROUP BY 
              st.[DEPARTMENT], 
              wh.[Quantity],
              wh.[Quantity Per Hour],
              dr.[LotQuantityPerWorker]
      )
      SELECT 
   ds.[DEPARTMENT],
  ds.[TotalQuantity], -- Total quantity from the staging table
  ds.[QuantityPerMin], -- Quantity completed per minute
   ds.[Quantity Per Hour], -- Quantity completed per hour
  ds.[LotQuantityPerWorker], -- Worker ratio
   CASE 
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 2
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 4
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 6
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 3
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 6
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 9
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 4
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 4
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 6
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 9
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 12
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 15
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 18
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 12
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 18
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 24
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 30
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 36
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 4
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 6
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 10
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 12
       ELSE CEILING(CAST(ds.[TotalQuantity] AS FLOAT) / ds.[LotQuantityPerWorker]) 
   END AS RequiredResource,-- Calculate resources dynamically with rounding up
          CASE 
              WHEN (ds.[TotalQuantity] - ds.[StandardQuantity]) > 0 
                  THEN CEILING((ds.[TotalQuantity] - ds.[StandardQuantity]) / ds.[QuantityPerMin]) -- Calculate extra time required if total quantity exceeds the standard
              ELSE 0
          END AS RequiredExtraTime,
          d.[AvailableResource], -- Available workers in the department
(CASE 
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 2
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 4
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 6
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 3
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 6
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 9
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 4
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 0 AND 35000 THEN 4
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 6
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 9
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 12
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 15
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 18
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 12
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 18
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 24
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 30
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 36
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 0 AND 23000 THEN 4
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 6
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 10
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 12
   ELSE CEILING(CAST(ds.[TotalQuantity] AS FLOAT) / ds.[LotQuantityPerWorker])
END - d.[AvailableResource]) AS ToFill-- Workers to fill
      FROM DepartmentSummary ds
      LEFT JOIN [dbo].[Departments] d
          ON ds.[DEPARTMENT] = d.[DepartmentName];
    `);

    // Return the result as JSON
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching department worker requirements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


const departmentRatios = {
  "FOAM CUTTING": 10000,
  "GLUING": 6666,
  "PRESSING": 10000,
  "BELT CUTTING DEPT": 5000,
  "SKRWING DEPARTMENT": 5000,
  "PESTING": 2500,
  "NOKE": 3333,
  "COLOUR DEPARTMENT": 1666,
  "DESIGN DEPARTMENT": 2222,
  "LOOPI DEPARTMENT": 2857,
  "PUCTURE DEPARTMENT": 2857,
  "BUCKLE STITCHING": 5000,
  "BUCKLE BURNING": 10000,
  "BELT CHECKING & CLEANING": 5000,
  "SCREW FITTING": 1666,
  "PANNI PACKING": 2857,
  "BOX FOLDING": 10000,
  "BOX PACKING": 6666,
  "CARTON MAKING": 10000,
  "BELT STITCHING": 2857,
  "PVC": 1666,
};
// Update /departments/update-resources Endpoint
router.post("/departments/update-resources", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to calculate present workers per department
    const presentWorkersQuery = `
      SELECT 
        Department,
        COUNT(EmployeeID) AS PresentWorkers
      FROM UserActivity
      WHERE CAST(LoginTime AS DATE) = CAST(GETDATE() AS DATE) AND LogoutTime IS NULL
      GROUP BY Department;
    `;
    const presentWorkers = await pool.request().query(presentWorkersQuery);

    // Update all departments' AvailableResource and RequiredResource dynamically
    const departments = Object.keys(departmentRatios);

    for (const department of departments) {
      const lotSize = 20000; // Default Lot Quantity
      const ratio = departmentRatios[department];
      const requiredWorkers = Math.ceil(lotSize / ratio);

      // Find available workers for the department
      const availableWorkers =
        presentWorkers.recordset.find((w) => w.Department === department)?.PresentWorkers || 0;

      await pool
        .request()
        .input("DepartmentName", sql.NVarChar, department)
        .input("LotQuantity", sql.Int, lotSize)
        .input("RequiredResource", sql.Int, requiredWorkers)
        .input("AvailableResource", sql.Int, availableWorkers)
        .query(`
          UPDATE Departments
          SET LotQuantity = @LotQuantity,
              RequiredResource = @RequiredResource,
              AvailableResource = @AvailableResource
          WHERE DepartmentName = @DepartmentName;
        `);
    }

    res.status(200).json({ message: "Resources updated successfully!" });
  } catch (error) {
    console.error("Error updating available resources:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // Update /departments/update-lot Endpoint
// router.put("/departments/update-lot", async (req, res) => {
//   const { DepartmentName, LotQuantity } = req.body;

//   if (!DepartmentName || !LotQuantity) {
//     return res.status(400).json({ error: "DepartmentName and LotQuantity are required." });
//   }

//   try {
//     const pool = await poolPromise;

//     // Get the ratio for the specified department
//     const ratio = departmentRatios[DepartmentName];
//     if (!ratio) {
//       return res.status(400).json({ error: `No ratio defined for department: ${DepartmentName}` });
//     }

//     const requiredWorkers = Math.ceil(LotQuantity / ratio);

//     // Update LotQuantity and RequiredResource
//     await pool
//       .request()
//       .input("LotQuantity", sql.Int, LotQuantity)
//       .input("RequiredResource", sql.Int, requiredWorkers)
//       .input("DepartmentName", sql.NVarChar, DepartmentName)
//       .query(`
//         UPDATE Departments
//         SET LotQuantity = @LotQuantity,
//             RequiredResource = @RequiredResource
//         WHERE DepartmentName = @DepartmentName;
//       `);

//     res.status(200).json({ message: "Lot quantity and required workers updated successfully." });
//   } catch (error) {
//     console.error("Error updating lot quantity:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

router.get("/departments/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("DepartmentName", sql.NVarChar, name)
      .query(`
        SELECT 
          DepartmentName,
          LotQuantity,
          RequiredResource,
          AvailableResource,
          (RequiredResource - AvailableResource) AS ToFill
        FROM Departments
        WHERE DepartmentName = @DepartmentName
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Department not found." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching department details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/departments/approve-extra-time", async (req, res) => {
  const { departmentName, extraTime } = req.body;

  if (!departmentName || !extraTime) {
    return res.status(400).json({ error: "Department name and extra time are required." });
  }

  try {
    const pool = await poolPromise;

    // Fetch QuantityPerMin for the department from WorkingHours
    const quantityPerMinResult = await pool
      .request()
      .input("DepartmentName", sql.NVarChar, departmentName)
      .query(`
        SELECT [Quantity] AS QuantityPerMin
        FROM [dbo].[WorkingHours]
        WHERE [Departments] = @DepartmentName
      `);

    if (quantityPerMinResult.recordset.length === 0) {
      return res.status(404).json({ error: "Department not found in WorkingHours." });
    }

    const quantityPerMin = quantityPerMinResult.recordset[0].QuantityPerMin;

    // Calculate the quantity to deduct for the approved extra time
    const quantityToDeduct = extraTime * quantityPerMin;

    // Update TotalQuantity in the StagingTable for the department
    const updateQuery = `
      UPDATE [dbo].[WIP]
      SET [QUANTITY] = [Wip_quantity] - @QuantityToDeduct
      WHERE [DEPARTMENT] = @DepartmentName
    `;
    const updateResult = await pool
      .request()
      .input("QuantityToDeduct", sql.Int, quantityToDeduct)
      .input("DepartmentName", sql.NVarChar, departmentName)
      .query(updateQuery);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No rows updated. Ensure department exists in StagingTable." });
    }

    res.status(200).json({
      message: `Approved extra time successfully! Deducted ${quantityToDeduct} from total quantity.`,
    });
  } catch (error) {
    console.error("Error approving extra time:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/departments/save-resources", async (req, res) => {
  try {
    const pool = await poolPromise;

    for (const record of req.body) {
      const {
        departmentName,
        availableResource,
        toFill,
        quantity,
        requiredExtraTime,
      } = record;

      // Ensure quantity is an integer
      const updatedQuantity =
        requiredExtraTime === 0 && quantity > 0 ? 0 : parseInt(quantity, 10);

      // Check if the record exists
      const checkRecordQuery = `
        SELECT COUNT(*) AS Count
        FROM [dbo].[WIP]
        WHERE [DEPARTMENT] = @DepartmentName;
      `;
      const recordExists = await pool
        .request()
        .input("DepartmentName", sql.NVarChar, departmentName)
        .query(checkRecordQuery);

      if (recordExists.recordset[0].Count > 0) {
        // Update existing record
        await pool
          .request()
          .input("DepartmentName", sql.NVarChar, departmentName)
          .input("Worker_in_Factory", sql.Int, availableResource)
          .input("Worker_to_fill", sql.Int, toFill)
          .input("Quantity", sql.Int, updatedQuantity) // Ensure Quantity is an integer
          .query(`
            UPDATE [dbo].[WIP]
            SET [Worker_in_Factory] = @Worker_in_Factory,
                [Worker_to_fill] = @Worker_to_fill,
                [Quantity] = @Quantity
            WHERE [DEPARTMENT] = @DepartmentName;
          `);
      } else {
        // Insert new record
        await pool
          .request()
          .input("DepartmentName", sql.NVarChar, departmentName)
          .input("Worker_in_Factory", sql.Int, availableResource)
          .input("Worker_to_fill", sql.Int, toFill)
          .input("Quantity", sql.Int, updatedQuantity) // Ensure Quantity is an integer
          .query(`
            INSERT INTO [dbo].[WIP] ([DEPARTMENT], [Worker_in_Factory], [Worker_to_fill], [Quantity])
            VALUES (@DepartmentName, @Worker_in_Factory, @Worker_to_fill, @Quantity);
          `);
      }
    }

    res.status(200).json({ message: "Data saved to WIP table successfully!" });
  } catch (error) {
    console.error("Error saving data to WIP table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});







// GET API to fetch all WIP data
router.get("/wip", async (req, res) => {
  try {
    const pool = await poolPromise; // Get database connection
    const query = `
      SELECT 
        [DEPARTMENT],
        [Quantity],
        [Worker_in_Factory],
        [Worker_to_fill],
        [WorkerStatus],
        [Wip_quantity],
        [Result]
      FROM [dbo].[WIP]
    `;

    const result = await pool.request().query(query); // Execute the query

    res.status(200).json({
      success: true,
      data: result.recordset, // Send all results as JSON
    });
  } catch (error) {
    console.error("Error fetching WIP data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching WIP data. Please try again.",
    });
  }
});

///// Ticketing API /////


// POST API to create a ticket
router.post("/tickets", async (req, res) => {
  const { Category, Subject, Brief_Description, Priority, EmployeeID } = req.body; // Extract EmployeeID from body

  try {
    const pool = await poolPromise;

    // Get Supervisor Name and Department
    const supervisor = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .query(`
        SELECT Name, Department 
        FROM [dbo].[Emp_Master] 
        WHERE EmployeeID = @EmployeeID
      `);

    if (supervisor.recordset.length === 0) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    const { Name, Department } = supervisor.recordset[0];

    // Insert the ticket
    await pool
      .request()
      .input("Category", sql.NVarChar, Category)
      .input("Subject", sql.NVarChar, Subject)
      .input("Brief_Description", sql.NVarChar, Brief_Description)
      .input("Supervisor_Name", sql.NVarChar, Name)
      .input("Priority", sql.NVarChar, Priority)
      .input("Status", sql.NVarChar, "Open") // Default to "Open" if not provided
      .input("RaiseDate", sql.DateTime, new Date())
      .query(`
        INSERT INTO [dbo].[TICKETS] 
        (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, RaiseDate)
        VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status, @RaiseDate)
      `);

    res.status(201).json({ message: "Ticket created successfully!" });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// router.post("/tickets", async (req, res) => {
//   const {
//     Category,
//     Subject,
//     Brief_Description,
//     Supervisor_Name,
//     Priority,
//   } = req.body;

//   const Status = "Open"; // Default status when a ticket is created

//   try {
//     const pool = await poolPromise; // Ensure the connection is established
//     const query = `
//       INSERT INTO TICKETS (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status)
//       VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status)
//     `;
//     await pool
//       .request()
//       .input("Category", Category)
//       .input("Subject", Subject)
//       .input("Brief_Description", Brief_Description)
//       .input("Supervisor_Name", Supervisor_Name)
//       .input("Priority", Priority)
//       .input("Status", Status)
//       .query(query);

//     return res.status(201).json({ message: "Ticket created successfully" });
//   } catch (error) {
//     console.error("Error inserting ticket:", error);
//     return res.status(500).json({ error: "Failed to create ticket" });
//   }
// });

// GET API to fetch all tickets ADMIN
router.get("/ticketsAdmin", async (req, res) => {
  try {
    const pool = await poolPromise; // Ensure the connection is established
    const query = `SELECT * FROM TICKETS`;
    const result = await pool.request().query(query);
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({ error: "Failed to fetch tickets" });
  }
});
router.get("/tickets", async (req, res) => {
  const { EmployeeID } = req.query; // Pass EmployeeID as a query parameter

  try {
    const pool = await poolPromise;

    // Fetch tickets only for the logged-in supervisor
    const tickets = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .query(`
        SELECT * 
        FROM [dbo].[TICKETS]
        WHERE Supervisor_Name IN (
          SELECT Name 
          FROM [dbo].[Emp_Master] 
          WHERE EmployeeID = @EmployeeID
        )
      `);

    res.status(200).json(tickets.recordset);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// PUT API to update a ticket
router.put("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const {
    Category,
    Subject,
    Brief_Description,
    Supervisor_Name,
    Priority,
    Status,
  } = req.body;

  try {
    const pool = await poolPromise;
    const query = `
      UPDATE TICKETS
      SET Category = @Category,
          Subject = @Subject,
          Brief_Description = @Brief_Description,
          Supervisor_Name = @Supervisor_Name,
          Priority = @Priority,
          Status = @Status
      WHERE ID = @ID
    `;

    const result = await pool
      .request()
      .input("ID", id)
      .input("Category", Category)
      .input("Subject", Subject)
      .input("Brief_Description", Brief_Description)
      .input("Supervisor_Name", Supervisor_Name)
      .input("Priority", Priority)
      .input("Status", Status)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return res.status(500).json({ error: "Failed to update ticket" });
  }
});


// PATCH API to partially update a ticket
router.patch("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const fields = req.body; // Fields to update dynamically

  try {
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    let setQuery = Object.keys(fields)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `UPDATE TICKETS SET ${setQuery} WHERE ID = @ID`;

    const pool = await poolPromise;
    const request = pool.request().input("ID", id);

    // Dynamically add inputs to the query
    Object.keys(fields).forEach((key) => {
      request.input(key, fields[key]);
    });

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error partially updating ticket:", error);
    return res.status(500).json({ error: "Failed to update ticket" });
  }
});


// DELETE API to delete a ticket
router.delete("/tickets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const query = `DELETE FROM TICKETS WHERE ID = @ID`;
    const result = await pool.request().input("ID", id).query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res.status(500).json({ error: "Failed to delete ticket" });
  }
});


// Confirm Ticket API: Move resolved ticket to Solved_Tickets table
router.post("/tickets/confirm/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch the ticket from the TICKETS table
    const ticket = await pool
      .request()
      .input("ID", sql.Int, id)
      .query(`
        SELECT 
          Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, ID, RaiseDate
        FROM [dbo].[TICKETS]
        WHERE ID = @ID
      `);

    if (ticket.recordset.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketData = ticket.recordset[0];

    // Ensure the ticket is Resolved before moving
    if (ticketData.Status !== "Resolved") {
      return res.status(400).json({ error: "Only resolved tickets can be confirmed" });
    }

    // Move the ticket to Solved_Tickets table
    await pool
      .request()
      .input("Category", sql.NVarChar, ticketData.Category)
      .input("Subject", sql.NVarChar, ticketData.Subject)
      .input("Brief_Description", sql.NVarChar, ticketData.Brief_Description)
      .input("Supervisor_Name", sql.NVarChar, ticketData.Supervisor_Name)
      .input("Priority", sql.NVarChar, ticketData.Priority)
      .input("Status", sql.NVarChar, ticketData.Status)
      .input("ID", sql.Int, ticketData.ID)
      .input("RaiseDate", sql.DateTime, ticketData.RaiseDate)
      .input("SolvedDate", sql.DateTime, new Date())
      .query(`
        INSERT INTO [dbo].[Solved_Tickets]
        (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, ID, RaiseDate, SolvedDate)
        VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status, @ID, @RaiseDate, @SolvedDate)
      `);

    // Delete the ticket from TICKETS table
    await pool
      .request()
      .input("ID", sql.Int, id)
      .query(`
        DELETE FROM [dbo].[TICKETS]
        WHERE ID = @ID
      `);

    res.status(200).json({ message: "Ticket confirmed and moved to solved tickets" });
  } catch (error) {
    console.error("Error confirming ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
