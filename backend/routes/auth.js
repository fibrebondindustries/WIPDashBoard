const express = require("express");
const { poolPromise, sql } = require("../config/db");
const bcrypt = require("bcrypt");
const router = express.Router();

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
        T1.[Sequance],
        T1.[RawMaterial],
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
    query += " ORDER BY T1.[Sequance] ASC"; // Order by sequence

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

////Admin Dashboard 23 nov // yogesh
router.post("/signup", async (req, res) => {
  const { Name, Password, Auth, EmployeeID, Department } = req.body;

  // Validate all required fields !Name || !Email || !Mobile ||
  if (!Password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!EmployeeID) {
    return res.status(400).json({ error: "EmployeeID is required" });
  }
  if (!Department) {
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
      .input("identifier", sql.NVarChar, identifier).query(`
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
      .input("CurrentTime", sql.DateTime, currentTime).query(`
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

    // if (user.recordset[0].Auth === "User") {
    //   const loginTime = new Date().toISOString();
    //   await pool
    //     .request()
    //     .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
    //     .input("LoginTime", sql.DateTime, loginTime)
    //     .input("Department", sql.NVarChar, activeDepartment)
    //     .query(`
    //       INSERT INTO UserActivity (EmployeeID, LoginTime, Department)
    //       VALUES (@EmployeeID, @LoginTime, @Department)
    //     `);
    // }

    // Handle Supervisor and SuperAdmin roles // 19 Dec
    if (
      user.recordset[0].Auth === "Supervisor" ||
      user.recordset[0].Auth === "SuperAdmin"
    ) {
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

////Marke Attendance
router.post("/mark-in", async (req, res) => {
  const { EmployeeID, Department } = req.body;

  if (!EmployeeID || !Department) {
    return res
      .status(400)
      .json({ error: "EmployeeID and Department are required" });
  }

  try {
    const pool = await poolPromise;

    const loginTime = new Date().toISOString();
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("LoginTime", sql.DateTime, loginTime)
      .input("Department", sql.NVarChar, Department).query(`
        INSERT INTO UserActivity (EmployeeID, LoginTime, Department)
        VALUES (@EmployeeID, @LoginTime, @Department)
      `);

    res.status(200).json({
      message: "User marked IN successfully",
      EmployeeID,
      LoginTime: loginTime,
    });
  } catch (err) {
    console.error("Error marking user IN:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// router.post("/logout", async (req, res) => {
//   const { EmployeeID, logoutTime } = req.body;

//   if (!EmployeeID || !logoutTime) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const pool = await poolPromise;

//     // Set logoutTime to current IST time in ISO format
//     const logoutTime = new Date().toISOString();

//     // Update LogoutTime for the latest login entry
//     await pool
//       .request()
//       .input("EmployeeID", sql.NVarChar, EmployeeID)
//       .input("LogoutTime", sql.DateTime, logoutTime)
//       .query(`
//         UPDATE UserActivity
//         SET LogoutTime = @LogoutTime
//         WHERE EmployeeID = @EmployeeID
//           AND LogoutTime IS NULL
//       `);

//     res.status(200).json({ message: "Logout time updated successfully" });
//   } catch (err) {
//     console.error("Error updating logout time:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

///26 nov

router.post("/logout", async (req, res) => {
  const { EmployeeID } = req.body;

  if (!EmployeeID) {
    return res.status(400).json({ error: "EmployeeID is required" });
  }

  try {
    const pool = await poolPromise;

    // Set logoutTime to current IST time in ISO format
    const logoutTime = new Date().toISOString();

    // Check if there is an active session for the EmployeeID
    const activeSessionResult = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID).query(`
        SELECT TOP 1 ID
        FROM UserActivity
        WHERE EmployeeID = @EmployeeID
          AND LogoutTime IS NULL
        ORDER BY LoginTime DESC
      `);

    if (activeSessionResult.recordset.length === 0) {
      return res.status(404).json({
        error: "No active session found for the given Employee ID",
      });
    }

    // Update LogoutTime for the active session
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("LogoutTime", sql.DateTime, logoutTime).query(`
        UPDATE UserActivity
        SET LogoutTime = @LogoutTime
        WHERE EmployeeID = @EmployeeID
          AND LogoutTime IS NULL
      `);

    res.status(200).json({
      message: "User marked OUT successfully",
      EmployeeID,
      LogoutTime: logoutTime,
    });
  } catch (err) {
    console.error("Error marking user OUT:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
  const { employeeID } = req.params;

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

///update user // modified on 07 jan 2025 // yogesh
router.put("/users/:employeeID", async (req, res) => {
  const { employeeID } = req.params;
  const { Name, Auth, Department, Password, NewEmployeeID, OldPassword } =
    req.body;

  if (!Name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (!Department) {
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
      if (!OldPassword || OldPassword.trim() === "") {
        /// new condition added on 07 jan 2025 // yogesh
        return res
          .status(400)
          .json({ error: "Old password is required to update the password." });
      }
      // Check if the old password matches the existing password /// new condition added on 07 jan 2025 // yogesh
      const isOldPasswordMatch = await bcrypt.compare(
        OldPassword,
        existingUser.Password
      );
      if (!isOldPasswordMatch) {
        return res.status(400).json({ error: "Old password is incorrect." });
      }
      // Check if the new password matches the existing one
      const isSamePassword = await bcrypt.compare(
        Password,
        existingUser.Password
      );
      if (isSamePassword) {
        return res.status(400).json({
          error: "New password cannot be the same as the old password.",
        });
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
///update user

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

//06 nov // yogesh
router.get("/departments", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT DepartmentName FROM Departments");
    res.status(200).json(result.recordset.map((row) => row.DepartmentName));
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//end

///27 Nov // yogesh
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
      .input("EmployeeID", sql.NVarChar, EmployeeID).query(`
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
      .input("AssignedBy", sql.NVarChar, AssignedBy).query(`
        INSERT INTO DepartmentHistory (EmployeeID, OriginalDepartment, TemporaryDepartment, FromTime, AssignedBy)
        SELECT EmployeeID, Department, @TemporaryDepartment, @FromTime, @AssignedBy
        FROM UserActivity
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    // Update the employee's current department in UserActivity
    await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID)
      .input("TemporaryDepartment", sql.NVarChar, TemporaryDepartment).query(`
        UPDATE UserActivity
        SET Department = @TemporaryDepartment
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    res
      .status(200)
      .json({ message: "Employee assigned to temporary department" });
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
      .input("ToTime", sql.DateTime, toTime).query(`
        UPDATE DepartmentHistory
        SET ToTime = @ToTime
        WHERE EmployeeID = @EmployeeID AND ToTime IS NULL
      `);

    if (updateHistory.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "No active temporary assignment found for this employee.",
      });
    }

    // Restore the original department in UserActivity
    await pool.request().input("EmployeeID", sql.NVarChar, EmployeeID).query(`
        UPDATE UserActivity
        SET Department = (
          SELECT TOP 1 OriginalDepartment
          FROM DepartmentHistory
          WHERE EmployeeID = @EmployeeID
          AND ToTime = (SELECT MAX(ToTime) FROM DepartmentHistory WHERE EmployeeID = @EmployeeID)
        )
        WHERE EmployeeID = @EmployeeID AND LogoutTime IS NULL
      `);

    res
      .status(200)
      .json({ message: "Employee restored to original department" });
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
              ('PUCTURE DEPARTMENT', 10000), ---2857  old value
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
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 2
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 4
       WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 6
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 3
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 6
       WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 9
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 4
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
       WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 4
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
       WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 6
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 9
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 12
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 15
       WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 18
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 12
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 18
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 24
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 30
       WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 36
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] = 0 THEN 0
       WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 4
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
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 2
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 4
   WHEN ds.[DEPARTMENT] = 'FOAM CUTTING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 6
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 3
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 6
   WHEN ds.[DEPARTMENT] = 'GLUING' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 9
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 4
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
   WHEN ds.[DEPARTMENT] = 'BELT CUTTING DEPT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 1 AND 35000 THEN 4
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 8
   WHEN ds.[DEPARTMENT] = 'SKRWING DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 71000 THEN 12
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 6
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 9
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 12
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 15
   WHEN ds.[DEPARTMENT] = 'NOKE' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 18
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 12
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 23000 AND 35000 THEN 18
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 35000 AND 47000 THEN 24
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 47000 AND 59000 THEN 30
   WHEN ds.[DEPARTMENT] = 'COLOUR DEPARTMENT' AND ds.[TotalQuantity] BETWEEN 59000 AND 71000 THEN 36
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] = 0 THEN 0
   WHEN ds.[DEPARTMENT] = 'BELT CHECKING & CLEANING' AND ds.[TotalQuantity] BETWEEN 1 AND 23000 THEN 4
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

// const departmentRatios = {
//   "FOAM CUTTING": 10000,
//   "GLUING": 6666,
//   "PRESSING": 10000,
//   "BELT CUTTING DEPT": 5000,
//   "SKRWING DEPARTMENT": 5000,
//   "PESTING": 2500,
//   "NOKE": 3333,
//   "COLOUR DEPARTMENT": 1666,
//   "DESIGN DEPARTMENT": 2222,
//   "LOOPI DEPARTMENT": 2857,
//   "PUCTURE DEPARTMENT": 2857,
//   "BUCKLE STITCHING": 5000,
//   "BUCKLE BURNING": 10000,
//   "BELT CHECKING & CLEANING": 5000,
//   "SCREW FITTING": 1666,
//   "PANNI PACKING": 2857,
//   "BOX FOLDING": 10000,
//   "BOX PACKING": 6666,
//   "CARTON MAKING": 10000,
//   "BELT STITCHING": 2857,
//   "PVC": 1666,
// };

// // Update /departments/update-resources Endpoint
// // router.post("/departments/update-resources", async (req, res) => {
// //   try {
// //     const pool = await poolPromise;

// //     // Query to calculate present workers per department
// //     const presentWorkersQuery = `
// //       SELECT
// //         Department,
// //         COUNT(EmployeeID) AS PresentWorkers
// //       FROM UserActivity
// //       WHERE CAST(LoginTime AS DATE) = CAST(GETDATE() AS DATE) AND LogoutTime IS NULL
// //       GROUP BY Department;
// //     `;
// //     const presentWorkers = await pool.request().query(presentWorkersQuery);

// //     // Update all departments' AvailableResource and RequiredResource dynamically
// //     const departments = Object.keys(departmentRatios);

// //     for (const department of departments) {
// //       const lotSize = 20000; // Default Lot Quantity
// //       const ratio = departmentRatios[department];
// //       const requiredWorkers = Math.ceil(lotSize / ratio);

// //       // Find available workers for the department
// //       const availableWorkers =
// //         presentWorkers.recordset.find((w) => w.Department === department)?.PresentWorkers || 0;

// //       await pool
// //         .request()
// //         .input("DepartmentName", sql.NVarChar, department)
// //         .input("LotQuantity", sql.Int, lotSize)
// //         .input("RequiredResource", sql.Int, requiredWorkers)
// //         .input("AvailableResource", sql.Int, availableWorkers)
// //         .query(`
// //           UPDATE Departments
// //           SET LotQuantity = @LotQuantity,
// //               RequiredResource = @RequiredResource,
// //               AvailableResource = @AvailableResource
// //           WHERE DepartmentName = @DepartmentName;
// //         `);
// //     }

// //     res.status(200).json({ message: "Resources updated successfully!" });
// //   } catch (error) {
// //     console.error("Error updating available resources:", error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // });

// // Update /departments/update-lot Endpoint /// not in use

// router.post("/departments/update-resources", async (req, res) => {
//   try {
//     const pool = await poolPromise;

//     // Query to calculate present workers per department
//     const presentWorkersQuery = `
//       SELECT
//         Department,
//         COUNT(EmployeeID) AS PresentWorkers
//       FROM UserActivity
//       WHERE CAST(LoginTime AS DATE) = CAST(GETDATE() AS DATE) AND LogoutTime IS NULL
//       GROUP BY Department;
//     `;
//     const presentWorkers = await pool.request().query(presentWorkersQuery);

//     // Query to fetch current department data for calculations
//     const departmentDataQuery = `
//       SELECT
//         DepartmentName,
//         AvailableResource
//       FROM Departments;
//     `;
//     const departmentData = await pool.request().query(departmentDataQuery);

//     // Update each department's available resource dynamically
//     for (const dept of departmentData.recordset) {
//       const departmentName = dept.DepartmentName;

//       // Get the number of present workers for the department
//       const availableWorkers =
//         presentWorkers.recordset.find((w) => w.Department === departmentName)?.PresentWorkers || 0;

//       // Update the Departments table
//       await pool
//         .request()
//         .input("DepartmentName", sql.NVarChar, departmentName)
//         .input("AvailableResource", sql.Int, availableWorkers)
//         .query(`
//           UPDATE Departments
//           SET AvailableResource = @AvailableResource
//           WHERE DepartmentName = @DepartmentName;
//         `);
//     }

//     res.status(200).json({ message: "Resources updated successfully!" });
//   } catch (error) {
//     console.error("Error updating available resources:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

/// new code
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

    // Query to fetch current department data for calculations
    const departmentDataQuery = `
      SELECT 
        DepartmentName, 
        AvailableResource 
      FROM Departments;
    `;
    const departmentData = await pool.request().query(departmentDataQuery);

    // Loop through each department to update both tables
    for (const dept of departmentData.recordset) {
      const departmentName = dept.DepartmentName;

      // Get the number of present workers for the department
      const availableWorkers =
        presentWorkers.recordset.find((w) => w.Department === departmentName)
          ?.PresentWorkers || 0;

      // Update the Departments table
      await pool
        .request()
        .input("DepartmentName", sql.NVarChar, departmentName)
        .input("AvailableResource", sql.Int, availableWorkers).query(`
          UPDATE Departments
          SET AvailableResource = @AvailableResource
          WHERE DepartmentName = @DepartmentName;
        `);

      // Update the WIP table
      await pool
        .request()
        .input("Department", sql.NVarChar, departmentName)
        .input("Worker_in_Factory", sql.Int, availableWorkers).query(`
          UPDATE WIP
          SET Worker_in_Factory = @Worker_in_Factory
          WHERE Department = @Department;
        `);
    }

    // Execute the stored procedure to calculate and update the 'ToFill' column in WIP
    await pool.request().query(`EXEC UpdateWIPTest`);

    res
      .status(200)
      .json({ message: "Resources updated successfully in both tables!" });
  } catch (error) {
    console.error("Error updating resources:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/departments/update-lot", async (req, res) => {
  const { DepartmentName, LotQuantity } = req.body;

  if (!DepartmentName || !LotQuantity) {
    return res
      .status(400)
      .json({ error: "DepartmentName and LotQuantity are required." });
  }

  try {
    const pool = await poolPromise;

    // Get the ratio for the specified department
    const ratio = departmentRatios[DepartmentName];
    if (!ratio) {
      return res
        .status(400)
        .json({ error: `No ratio defined for department: ${DepartmentName}` });
    }

    const requiredWorkers = Math.ceil(LotQuantity / ratio);

    // Update LotQuantity and RequiredResource
    await pool
      .request()
      .input("LotQuantity", sql.Int, LotQuantity)
      .input("RequiredResource", sql.Int, requiredWorkers)
      .input("DepartmentName", sql.NVarChar, DepartmentName).query(`
        UPDATE Departments
        SET LotQuantity = @LotQuantity,
            RequiredResource = @RequiredResource
        WHERE DepartmentName = @DepartmentName;
      `);

    res.status(200).json({
      message: "Lot quantity and required workers updated successfully.",
    });
  } catch (error) {
    console.error("Error updating lot quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/departments/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("DepartmentName", sql.NVarChar, name).query(`
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
    return res
      .status(400)
      .json({ error: "Department name and extra time are required." });
  }

  try {
    const pool = await poolPromise;

    // Fetch QuantityPerMin for the department from WorkingHours
    const quantityPerMinResult = await pool
      .request()
      .input("DepartmentName", sql.NVarChar, departmentName).query(`
        SELECT [Quantity] AS QuantityPerMin
        FROM [dbo].[WorkingHours]
        WHERE [Departments] = @DepartmentName
      `);

    if (quantityPerMinResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "Department not found in WorkingHours." });
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
      return res.status(404).json({
        error: "No rows updated. Ensure department exists in StagingTable.",
      });
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
  const {
    Category,
    Subject,
    Brief_Description,
    Priority,
    EmployeeID,
    Responsible,
  } = req.body; // Extract EmployeeID from body

  try {
    const pool = await poolPromise;

    // Get Supervisor Name and Department
    const supervisor = await pool
      .request()
      .input("EmployeeID", sql.NVarChar, EmployeeID).query(`
        SELECT Name, Department 
        FROM [dbo].[Emp_Master] 
        WHERE EmployeeID = @EmployeeID
      `);

    if (supervisor.recordset.length === 0) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    const { Name, Department } = supervisor.recordset[0];

    // Use formatted time in your query
    const RaiseDateIST = formatDateTime(new Date()); // Current time in IST
    // Insert the ticket
    await pool
      .request()
      .input("Category", sql.NVarChar, Category)
      .input("Subject", sql.NVarChar, Subject)
      .input("Brief_Description", sql.NVarChar, Brief_Description)
      .input("Supervisor_Name", sql.NVarChar, Name)
      .input("Priority", sql.NVarChar, Priority)
      .input("Status", sql.NVarChar, "Open") // Default to "Open" if not provided
      .input("RaiseDate", sql.NVarChar, RaiseDateIST)
      .input("Responsible", sql.NVarChar, Responsible).query(`
        INSERT INTO [dbo].[TICKETS] 
        (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, RaiseDate, Responsible)
        VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status, @RaiseDate, @Responsible)
      `);

    res.status(201).json({ message: "Ticket created successfully!" });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
      .input("EmployeeID", sql.NVarChar, EmployeeID).query(`
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

// PATCH API to partially update a ticket // modificate on 08 jan 2025, store sovle date and confirm time // yogesh
// router.patch("/tickets/:id", async (req, res) => {
//   const { id } = req.params;
//   const fields = req.body; // Fields to update dynamically

//   try {
//     if (Object.keys(fields).length === 0) {
//       return res.status(400).json({ message: "No fields to update" });
//     }

//     // Check if the status is being updated to 'Resolved'
//     const IsResolved =
//       fields.Status && fields.Status.toLowerCase() === "resolved";
//     if (IsResolved) {
//       fields.SolvedDate = formatDateTime(new Date()); // Set SolvedDate to current time in IST
//     }
//     let setQuery = Object.keys(fields)
//       .map((key) => `${key} = @${key}`)
//       .join(", ");

//     const query = `UPDATE TICKETS SET ${setQuery} WHERE ID = @ID`;

//     const pool = await poolPromise;
//     const request = pool.request().input("ID", id);

//     // Dynamically add inputs to the query
//     Object.keys(fields).forEach((key) => {
//       request.input(key, fields[key]);
//     });

//     const result = await request.query(query);

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }

//     return res.status(200).json({ message: "Ticket updated successfully" });
//   } catch (error) {
//     console.error("Error partially updating ticket:", error);
//     return res.status(500).json({ error: "Failed to update ticket" });
//   }
// });

// changes occures in patch api on 13 fab 2025
// PATCH API to partially update a ticket // Modified on 13 Feb 2025
router.patch("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const fields = req.body; // Fields to update dynamically

  try {
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const pool = await poolPromise;

    // Fetch the existing ticket details before updating
    const existingTicket = await pool.request().input("ID", id).query(`
        SELECT * FROM [dbo].[TICKETS] WHERE ID = @ID
    `);

    if (existingTicket.recordset.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketData = existingTicket.recordset[0];

    // Check if the status is being updated to 'Resolved'
    const isResolved =
      fields.Status && fields.Status.toLowerCase() === "resolved";
    if (isResolved) {
      fields.SolvedDate = formatDateTime(new Date()); // Set SolvedDate to current time in IST
      // fields.ConfirmTime = formatDateTime(new Date()); // Store confirmation time
    }

    // Update the existing ticket
    let setQuery = Object.keys(fields)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const updateQuery = `UPDATE [dbo].[TICKETS] SET ${setQuery} WHERE ID = @ID`;

    const request = pool.request().input("ID", id);

    // Dynamically add inputs to the query
    Object.keys(fields).forEach((key) => {
      request.input(key, fields[key]);
    });

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // If ticket is resolved, move it to Solved_Tickets table and delete from TICKETS
    if (isResolved) {
      await pool
        .request()
        .input("Category", sql.NVarChar, ticketData.Category)
        .input("Subject", sql.NVarChar, ticketData.Subject)
        .input("Brief_Description", sql.NVarChar, ticketData.Brief_Description)
        .input("Supervisor_Name", sql.NVarChar, ticketData.Supervisor_Name)
        .input("Priority", sql.NVarChar, ticketData.Priority)
        .input("Status", sql.NVarChar, "Resolved")
        .input("ID", sql.Int, ticketData.ID)
        .input("RaiseDate", sql.NVarChar, ticketData.RaiseDate)
        .input("SolvedDate", sql.NVarChar, fields.SolvedDate)
        .input("Responsible", sql.NVarChar, ticketData.Responsible).query(`
          INSERT INTO [dbo].[Solved_Tickets]
          (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, ID, RaiseDate, SolvedDate, Responsible)
          VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status, @ID, @RaiseDate, @SolvedDate, @Responsible)
        `);

      // Delete from TICKETS table after moving to Solved_Tickets
      // await pool.request().input("ID", id).query(`
      //     DELETE FROM [dbo].[TICKETS] WHERE ID = @ID
      // `);
    }

    return res.status(200).json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error updating ticket:", error);
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

// // Confirm Ticket API: Move resolved ticket to Solved_Tickets table
// router.post("/tickets/confirm/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const pool = await poolPromise;

//     // Fetch the ticket from the TICKETS table
//     const ticket = await pool.request().input("ID", sql.Int, id).query(`
//         SELECT
//         Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, ID, RaiseDate, SolvedDate, Responsible
//         FROM [dbo].[TICKETS]
//         WHERE ID = @ID
//       `);

//     if (ticket.recordset.length === 0) {
//       return res.status(404).json({ error: "Ticket not found" });
//     }

//     const ticketData = ticket.recordset[0];

//     // Ensure the ticket is Resolved before moving  // yogesh
//     if (ticketData.Status !== "Resolved") {
//       return res
//         .status(400)
//         .json({ error: "Only resolved tickets can be confirmed" });
//     }

//     // Format RaiseDate and SolvedDate to IST
//     const confirmTimeIST = formatDateTime(new Date());
//     // const raiseDateIST = formatDateTime(new Date(ticketData.RaiseDate));

//     // Move the ticket to Solved_Tickets table
//     await pool
//       .request()
//       .input("Category", sql.NVarChar, ticketData.Category)
//       .input("Subject", sql.NVarChar, ticketData.Subject)
//       .input("Brief_Description", sql.NVarChar, ticketData.Brief_Description)
//       .input("Supervisor_Name", sql.NVarChar, ticketData.Supervisor_Name)
//       .input("Priority", sql.NVarChar, ticketData.Priority)
//       .input("Status", sql.NVarChar, ticketData.Status)
//       .input("ID", sql.Int, ticketData.ID)
//       .input("RaiseDate", sql.NVarChar, ticketData.RaiseDate)
//       .input("SolvedDate", sql.NVarChar, ticketData.SolvedDate)
//       .input("ConfirmTime", sql.NVarChar, confirmTimeIST)
//       .input("Responsible", sql.NVarChar, ticketData.Responsible)
//       .query(`
//         INSERT INTO [dbo].[Solved_Tickets]
//         (Category, Subject, Brief_Description, Supervisor_Name, Priority, Status, ID, RaiseDate, SolvedDate, ConfirmTime, Responsible)
//         VALUES (@Category, @Subject, @Brief_Description, @Supervisor_Name, @Priority, @Status, @ID, @RaiseDate, @SolvedDate, @ConfirmTime, @Responsible)
//       `);

//     // Delete the ticket from TICKETS table
//     await pool.request().input("ID", sql.Int, id).query(`
//         DELETE FROM [dbo].[TICKETS]
//         WHERE ID = @ID
//       `);

//     res
//       .status(200)
//       .json({ message: "Ticket confirmed and moved to solved tickets" });
//   } catch (error) {
//     console.error("Error confirming ticket:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

/// new api for WIP Dashboard Design table in model

//changes on 13 fab 2025
// Confirm Ticket API: Update ConfirmTime in Solved_Tickets and delete from TICKETS
router.post("/tickets/confirm/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    // Fetch the ticket from the TICKETS table
    const ticket = await pool.request().input("ID", sql.Int, id).query(`
        SELECT ID, Status
        FROM [dbo].[TICKETS]
        WHERE ID = @ID
    `);

    if (ticket.recordset.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticketData = ticket.recordset[0];

    // Ensure the ticket is Resolved before confirming
    if (ticketData.Status !== "Resolved") {
      return res
        .status(400)
        .json({ error: "Only resolved tickets can be confirmed" });
    }

    // Format ConfirmTime to IST
    const confirmTimeIST = formatDateTime(new Date());

    // Update ConfirmTime in Solved_Tickets table
    const updateQuery = `
        UPDATE [dbo].[Solved_Tickets]
        SET ConfirmTime = @ConfirmTime
        WHERE ID = @ID
    `;

    const updateResult = await pool
      .request()
      .input("ConfirmTime", sql.NVarChar, confirmTimeIST)
      .input("ID", sql.Int, ticketData.ID)
      .query(updateQuery);

    if (updateResult.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "Ticket not found in Solved_Tickets" });
    }

    // Delete the ticket from TICKETS table
    await pool.request().input("ID", sql.Int, id).query(`
        DELETE FROM [dbo].[TICKETS]
        WHERE ID = @ID
    `);

    res
      .status(200)
      .json({
        message:
          "Ticket confirmed, ConfirmTime updated, and ticket deleted from TICKETS",
      });
  } catch (error) {
    console.error("Error confirming ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/matched-data", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
          ST.[JOB ORDER NO], 
          ST.[DEPARTMENT], 
          D.[REXINE NAME], 
          D.[BLACK], 
          D.[BROWN], 
          D.[TAN], 
          D.[LOT ID]
      FROM 
          [dbo].[StagingTable] ST
      INNER JOIN 
          [dbo].[Design] D
      ON 
          ST.[ITEM NAME] = D.[LOT ID]
    `);

    res.status(200).json(result.recordset); // Return the matched data
  } catch (error) {
    console.error("Error fetching matched data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST API for Worker Allocation
router.post("/worker-allocation", async (req, res) => {
  const { From_Dep, Worker_Name, To_Department } = req.body;

  if (!From_Dep || !Worker_Name || !To_Department) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("From_Dep", From_Dep)
      .input("Worker_Name", Worker_Name)
      .input("To_Department", To_Department).query(`
        INSERT INTO [dbo].[WorkerAllocation] ([From_Dep], [Worker_Name], [To_Department])
        VALUES (@From_Dep, @Worker_Name, @To_Department)
      `);

    res.status(201).json({ message: "Worker allocation added successfully" });
  } catch (error) {
    console.error("Error inserting worker allocation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE API for Worker Allocation
router.delete("/worker-allocation/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("ID", id).query(`
        DELETE FROM [dbo].[WorkerAllocation]
        WHERE [ID] = @ID
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Worker allocation not found" });
    }

    res.status(200).json({ message: "Worker allocation deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker allocation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET API for Worker Allocation
router.get("/worker-allocation", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT [ID], [From_Dep], [Worker_Name], [To_Department]
      FROM [dbo].[WorkerAllocation]
      ORDER BY [ID] ASC
    `);

    res.status(200).json(result.recordset); // Return all records
  } catch (error) {
    console.error("Error fetching worker allocations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to format date-time in IST
const formatDateTime = (date) => {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // Force IST timezone
  };

  const formattedDate = date.toLocaleDateString("en-GB", options); // DD/MM/YYYY
  const formattedTime = date.toLocaleTimeString("en-IN", timeOptions); // hh:mm AM/PM

  return `${formattedDate} : ${formattedTime}`;
};

// API to handle automatic insertion
router.post("/auto-insert-first-process", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Fetch rows where FirstProcess = 'yes' from StagingTable
    const stagingData = await pool.request().query(`
        SELECT 
          [Supervisor],
          [Updated_Time] AS NewProcessTime,
          [ITEM NAME] AS LOT_ID,
          [PROCESS NAME] AS ProcessName
        FROM [dbo].[StagingTable]
        WHERE [FirstProcess] = 'yes'
      `);

    const rowsToInsert = stagingData.recordset;

    for (const row of rowsToInsert) {
      // Check if the row already exists in ConfirmTime
      const existingRow = await pool
        .request()
        .input("LotId", sql.NVarChar, row.LOT_ID).query(`
          SELECT COUNT(*) AS RowCount
          FROM [dbo].[ConfirmTime]
          WHERE [LOT_ID] = @LotId
        `);

      if (existingRow.recordset[0].RowCount === 0) {
        // Insert into ConfirmTime if not already present
        await pool
          .request()
          .input("SupervisorName", sql.NVarChar, row.Supervisor)
          .input("NewProcessTime", sql.NVarChar, row.NewProcessTime)
          .input("LotId", sql.NVarChar, row.LOT_ID)
          .input("ProcessName", sql.NVarChar, row.ProcessName).query(`
            INSERT INTO [dbo].[ConfirmTime] (
              [SupervisorName], [NewProcessTime], [LOT_ID], [Process_Name]
            )
            VALUES (
              @SupervisorName, @NewProcessTime, @LotId, @ProcessName
            )
          `);
      }
    }

    res
      .status(200)
      .json({ message: "Automatic insertion completed successfully." });
  } catch (error) {
    console.error("Error in auto-insert-first-process API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // API to get the count of rows with FirstProcess = 'yes' in StagingTable // Yogesh 28 Dec 2024
// router.get("/first-process-count", async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .query(`
//         SELECT
//           [SupervisorName] AS Supervisor,
//           [Process_Name] AS [PROCESS NAME],
//           [LOT_ID] AS [ITEM NAME],
//           [NewProcessTime] AS Updated_Time,
//           [ConfirmTime],
//           [CompletedTime],
//           [QUANTITY]
//         FROM [dbo].[ConfirmTime]
//         WHERE [CompletedTime] IS NULL
//       `);

//     // Send the result as a response
//     res.status(200).json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching process data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// API to get the count of rows with FirstProcess = 'yes' in StagingTable // Yogesh 28 Dec 2024
router.get("/first-process-count", async (req, res) => {
  const supervisorName = req.query.supervisorName; // Get SupervisorName from query parameters
  try {
    const pool = await poolPromise;
    const request = pool.request(); // Initialize request object

    // Base query
    let query = `
      SELECT 
        [SupervisorName] AS Supervisor,
        [ID],
        [Process_Name] AS [PROCESS NAME],
        [LOT_ID] AS [ITEM NAME],
        [NewProcessTime] AS Updated_Time,
        [ConfirmTime],
        [CompletedTime],
        [QUANTITY]
      FROM [dbo].[ConfirmTime]
      WHERE [CompletedTime] IS NULL
    `;

    // Add condition if SupervisorName is provided
    if (supervisorName) {
      query += " AND [SupervisorName] = @SupervisorName";
      request.input("SupervisorName", sql.NVarChar, supervisorName);
    }

    // Execute the query
    const result = await request.query(query);

    // Send the result as a response
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching process data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to handle done button click
router.post("/completedTime-process", async (req, res) => {
  const { ID, CompletedTime, ConfirmBy, ConfirmTime } = req.body; // Get data from request body

  if (!ID) {
    return res.status(400).json({
      error: "ID is required",
    });
  }

  try {
    const pool = await poolPromise;

    // Use ConfirmTime from frontend if provided; fallback to server time in IST
    const completedTime = CompletedTime || formatDateTime(new Date());
    const confirmTime = ConfirmTime || formatDateTime(new Date());

    // Update ConfirmTime for the given LOT_ID
    await pool
      .request()
      .input("CompletedTime", sql.NVarChar, completedTime)
      .input("ID", sql.Int, ID)
      .input("ConfirmBy", sql.NVarChar, ConfirmBy)
      .input("ConfirmTime", sql.NVarChar, confirmTime).query(`
        UPDATE [dbo].[ConfirmTime]
        SET [CompletedTime] = @CompletedTime,
        [ConfirmBy] = @ConfirmBy,
         [ConfirmTime] = @ConfirmTime
        WHERE [ID] = @ID
      `);
    //  // Update the Updated_Time in StagingTable
    //  const lotIdQuery = `
    //  SELECT [LOT_ID] FROM [dbo].[ConfirmTime] WHERE [ID] = @ID
    // `;
    // const lotIdResult = await pool.request().input("ID", sql.Int, ID).query(lotIdQuery);
    // const lotId = lotIdResult.recordset[0]?.LOT_ID;
    // if (lotId) {
    //     await pool
    //       .request()
    //       .input("Updated_Time", sql.NVarChar, completedTime) // Update to current IST-confirmed time
    //       .input("ItemName", sql.NVarChar, lotId)
    //       .query(`
    //         UPDATE [dbo].[StagingTable]
    //         SET [Updated_Time] = @Updated_Time
    //         WHERE [ITEM NAME] = @ItemName
    //       `);
    // }
    res.status(200).json({
      message: "Completed updated successfully.",
    });
  } catch (error) {
    console.error("Error in CompletedTime-process API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to handle confirm button click
router.post("/confirm-process", async (req, res) => {
  const { ID, ConfirmTime, ConfirmBy } = req.body;

  if (!ID) {
    return res.status(400).json({
      error: "ID is required",
    });
  }

  try {
    const pool = await poolPromise;

    // Use ConfirmTime from frontend if provided; fallback to server time in IST
    const confirmTime = ConfirmTime || formatDateTime(new Date());

    // Update ConfirmTime for the given LOT_ID
    await pool
      .request()
      .input("ConfirmTime", sql.NVarChar, confirmTime)
      .input("ID", sql.Int, ID)
      .input("ConfirmBy", sql.NVarChar, ConfirmBy).query(`
        UPDATE [dbo].[ConfirmTime]
        SET [ConfirmTime] = @ConfirmTime,
         [ConfirmBy] = @ConfirmBy
        WHERE [ID] = @ID
      `);
    res.status(200).json({
      message: "ConfirmTime updated successfully.",
    });
  } catch (error) {
    console.error("Error in confirm-process API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to get delayed processes
router.get("/delayed-processes", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to fetch delayed processes
    const result = await pool.request().query(`
        SELECT 
          [SupervisorName],
          [ID],
          [LOT_ID] AS [ITEM NAME],
          [Process_Name] AS [PROCESS NAME],
          [NewProcessTime],
          [ConfirmTime],
          [CompletedTime],
          [ConfirmDelay],
          [ProcessIncomplete],
          [Quantity]
        FROM [dbo].[ConfirmTime]
        WHERE  [ProcessIncomplete] = 'Yes' OR [ConfirmDelay] = 'Yes'
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching delayed processes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/delayed-24hr-processes", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT 
          [SupervisorName],
          [ID],
          [LOT_ID] AS [ITEM NAME],
          [Process_Name] AS [PROCESS NAME],
          [NewProcessTime],
          [ConfirmTime],
          [CompletedTime],
          [Pending24],
          [Quantity]
        FROM [dbo].[ConfirmTime]
        WHERE [Pending24] = 'Yes' AND [CompletedTime] IS NULL
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching 24hr delayed processes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/All-processes", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to fetch delayed processes
    const result = await pool.request().query(`
        SELECT 
          [SupervisorName],
          [LOT_ID] AS [ITEM NAME],
          [Process_Name] AS [PROCESS NAME],
          [NewProcessTime],
          [ConfirmTime],
           [CompletedTime],
          [ProcessDelay],
          [Quantity]
        FROM [dbo].[ConfirmTime]        
      `);

    // Add filtering for SupervisorName
    if (supervisorName) {
      query += " WHERE [SupervisorName] = @SupervisorName";
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching delayed processes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch recent user activity // yogesh
router.get("/user-activity/recent", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to detect changes in LoginTime, LogoutTime, or Department for active employees /// Changes in Query // yogesh 01 jan 2025
    const result = await pool.request().query(`  
        SELECT COUNT(*) AS ChangeCount
        FROM [dbo].[UserActivity] UA
        INNER JOIN [dbo].[Emp_Master] EM ON UA.EmployeeID = EM.EmployeeID
        WHERE 
          (
            UA.LoginTime > DATEADD(MILLISECOND, -2000, GETDATE()) 
            OR UA.LogoutTime > DATEADD(MILLISECOND, -2000, GETDATE())
          )
          OR (
            UA.LogoutTime IS NULL -- Only check active users
            AND UA.Department <> EM.[Department] -- Detect department change
          );
    `);
    // Respond with activity detection status
    res
      .status(200)
      .json({ activityDetected: result.recordset[0].ChangeCount > 0 });
  } catch (error) {
    console.error("Error fetching recent user activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//// Fetch all user activity
router.get("/user-activity", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id, EmployeeID, LoginTime, LogoutTime, Department
      FROM [dbo].[UserActivity]
      ORDER BY LoginTime DESC
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New POST API: Add a new remark // 8 Jan 2025 // yogesh
router.post("/remarks", async (req, res) => {
  const {
    SupervisorName,
    Department,
    DetailedIssue,
    Parameters,
    LOT_ID,
    ProcessName,
  } = req.body;

  try {
    if (
      !SupervisorName ||
      !Department ||
      !DetailedIssue ||
      !Parameters ||
      !ProcessName
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const RemarkDate = formatDateTime(new Date()); // Set the current date for RemarkDate

    const query = `
      INSERT INTO [dbo].[Remarks] (SupervisorName, Department, DetailedIssue, RemarkDate, Parameters, LOT_ID, ProcessName)
      VALUES (@SupervisorName, @Department, @DetailedIssue, @RemarkDate, @Parameters, @LOT_ID, @ProcessName)
    `;

    const pool = await poolPromise;
    await pool
      .request()
      .input("SupervisorName", sql.NVarChar, SupervisorName)
      .input("Department", sql.NVarChar, Department)
      .input("DetailedIssue", sql.NVarChar, DetailedIssue)
      .input("RemarkDate", sql.NVarChar, RemarkDate)
      .input("Parameters", sql.NVarChar, Parameters)
      .input("ProcessName", sql.NVarChar, ProcessName)
      .input("LOT_ID", sql.NVarChar, LOT_ID)
      .query(query);

    res.status(201).json({ message: "Remark added successfully" });
  } catch (error) {
    console.error("Error adding remark:", error);
    res.status(500).json({ error: "Failed to add remark" });
  }
});

// PUT API: Update an existing remark
router.put("/remarks/:id", async (req, res) => {
  const { id } = req.params;
  const {
    SupervisorName,
    Department,
    DetailedIssue,
    Parameters,
    LOT_ID,
    ProcessName,
  } = req.body;

  try {
    if (
      !SupervisorName ||
      !Department ||
      !DetailedIssue ||
      !Parameters ||
      !ProcessName
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const UpdatedDate = formatDateTime(new Date()); // Update the RemarkDate to current date

    const query = `
      UPDATE [dbo].[Remarks]
      SET SupervisorName = @SupervisorName,
          Department = @Department,
          DetailedIssue = @DetailedIssue,
          LOT_ID = @LOT_ID,
          ProcessName = @ProcessName,
          Parameters = @Parameters,
          UpdatedDate = @UpdatedDate
      WHERE ID = @ID
    `;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .input("SupervisorName", sql.NVarChar, SupervisorName)
      .input("Department", sql.NVarChar, Department)
      .input("DetailedIssue", sql.NVarChar, DetailedIssue)
      .input("ProcessName", sql.NVarChar, ProcessName)
      .input("Parameters", sql.NVarChar, Parameters)
      .input("UpdatedDate", sql.NVarChar, UpdatedDate)
      .input("LOT_ID", sql.NVarChar, LOT_ID)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Remark not found" });
    }

    res.status(200).json({ message: "Remark updated successfully" });
  } catch (error) {
    console.error("Error updating remark:", error);
    res.status(500).json({ error: "Failed to update remark" });
  }
});

// DELETE API: Delete a remark
router.delete("/remarks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
     UPDATE [dbo].[Remarks]
     SET IsDeleted = 'Yes' 
     WHERE ID = @ID
    `;

    const pool = await poolPromise;
    const result = await pool.request().input("ID", sql.Int, id).query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Remark not found" });
    }

    res.status(200).json({ message: "Remark deleted successfully" });
  } catch (error) {
    console.error("Error deleting remark:", error);
    res.status(500).json({ error: "Failed to delete remark" });
  }
});

// GET API: Fetch all remarks
router.get("/remarks", async (req, res) => {
  try {
    const query = `
      SELECT 
        ID, SupervisorName, Department, ProcessName, Parameters, RemarkDate, DetailedIssue, LOT_ID
      FROM [dbo].[Remarks] WHERE IsDeleted = 'No'
    `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No remarks found" });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching remarks:", error);
    res.status(500).json({ error: "Failed to fetch remarks" });
  }
});

// New Api for Supervisor Performance // 17 Jan 2025 // yogesh
router.get("/performance", async (req, res) => {
  try {
    const query = `
    SELECT  [SupervisorName],[Score],[Performance]
    FROM [dbo].[SupervisorPerformance]
  `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
});

router.get("/AllSupervisorName", async (req, res) => {
  try {
    const query = `
      SELECT [Name] as SupervisorName FROM [dbo].[Emp_Master] WHERE [Auth] = 'Supervisor'
      `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching SupervisorName:", error);
    res.status(500).json({ error: "Failed to fetch SupervisorName" });
  }
});

/// New Api for NOKE RAW MATERIAL  // 28 Jan 2025 // yogesh
// GET API: Fetch all records from the table
router.get("/noke-inventory", async (req, res) => {
  try {
    const query = `
      SELECT [ID], [LOT_ID], [DATE], [SUPERVISOR], [LOCATION], [STATUS]
      FROM [dbo].[noke_inventory]
    `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found in inventory." });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching inventory records:", error);
    res.status(500).json({ error: "Failed to fetch inventory records." });
  }
});

// POST API: Add a new record to the table
router.post("/noke-inventory", async (req, res) => {
  const { LOT_ID, supervisor, LOCATION, status } = req.body;

  if (!LOT_ID || !supervisor || !LOCATION || !status) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const query = `
      INSERT INTO [dbo].[noke_inventory] ([LOT_ID], [SUPERVISOR], [LOCATION], [STATUS])
      VALUES (@LOT_ID, @supervisor, @LOCATION, @status)
    `;
    const pool = await poolPromise;
    await pool
      .request()
      .input("LOT_ID", sql.NVarChar, LOT_ID)
      .input("supervisor", sql.NVarChar, supervisor)
      .input("LOCATION", sql.NVarChar, LOCATION)
      .input("status", sql.NVarChar, status)
      .query(query);

    res
      .status(201)
      .json({ message: "Record added successfully to inventory." });
  } catch (error) {
    console.error("Error adding record to inventory:", error);
    res.status(500).json({ error: "Failed to add record to inventory." });
  }
});

// POST API: Add a new record to the table
// router.post("/noke-inventory", async (req, res) => {
//   const { LOT_ID, supervisor, LOCATION, status } = req.body;

//   if (!LOT_ID || !supervisor || !LOCATION || !status) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   try {
//     const pool = await poolPromise;

//     // Check if LOT_ID already exists
//     const checkQuery = `
//       SELECT COUNT(*) AS count
//       FROM [dbo].[noke_inventory]
//       WHERE [LOT_ID] = @LOT_ID
//     `;

//     const checkResult = await pool
//       .request()
//       .input("LOT_ID", sql.NVarChar, LOT_ID)
//       .query(checkQuery);

//     if (checkResult.recordset[0].count > 0) {
//       return res.status(400).json({ error: "This LOT ID is already issued." });
//     }

//     // If LOT_ID is unique, proceed with the insert
//     const insertQuery = `
//       INSERT INTO [dbo].[noke_inventory] ([LOT_ID], [SUPERVISOR], [LOCATION], [STATUS])
//       VALUES (@LOT_ID, @supervisor, @LOCATION, @status)
//     `;

//     await pool
//       .request()
//       .input("LOT_ID", sql.NVarChar, LOT_ID)
//       .input("supervisor", sql.NVarChar, supervisor)
//       .input("LOCATION", sql.NVarChar, LOCATION)
//       .input("status", sql.NVarChar, status)
//       .query(insertQuery);

//     res
//       .status(201)
//       .json({ message: "Record added successfully to inventory." });
//   } catch (error) {
//     console.error("Error adding record to inventory:", error);
//     res.status(500).json({ error: "Failed to add record to inventory." });
//   }
// });

// PATCH API: Update a specific record in the table
router.patch("/noke-inventory/:id", async (req, res) => {
  const { id } = req.params;
  const { STATUS } = req.body; // Destructure STATUS from the request body

  if (!id || !STATUS) {
    return res.status(400).json({ error: "ID and STATUS are required" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("STATUS", sql.NVarChar, STATUS).query(`
        UPDATE [dbo].[noke_inventory]
        SET [STATUS] = @STATUS
        WHERE [ID] = @ID
      `);

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE API: Delete a specific record from the table
router.delete("/noke-inventory/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  try {
    const pool = await poolPromise;
    const query = `
      DELETE FROM [dbo].[noke_inventory]
      WHERE [ID] = @ID
    `;

    const result = await pool.request().input("ID", sql.Int, id).query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/noke-data", async (req, res) => {
  try {
    const query = `
        select [JOB ORDER NO], [JOB ORDER DATE], [ITEM NAME], [PROCESS NAME], [PROCESS GROUP], 
         [QUANTITY], [DEPARTMENT]  FROM [dbo].[StagingTable] where DEPARTMENT = 'NOKE'
       `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found in inventory." });
    }
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching inventory records:", error);
    res.status(500).json({ error: "Failed to fetch inventory records." });
  }
});

// //// New API for Belt loading unloading  // 29 Jan 2025
// router.get("/order-dispatch", async (req, res) => {
//   try {
//     const query = `
//       SELECT [JOB ORDER NO]
//             ,[DATE]
//             ,[JOB ORDER DATE]
//             ,[PROCESS GROUP]
//             ,[PROCESS NAME]
//             ,[ITEM NAME]
//             ,[QUANTITY]
//             ,[DEPARTMENT]
//             ,[STATUS]
//             ,[ID]
//       FROM [dbo].[belt_loading_unloading] where [ITEM NAME] is not null
//     `;
//     const pool = await poolPromise;
//     const result = await pool.request().query(query);
//     res.status(200).json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching order dispatch records:", error);
//     res.status(500).json({ error: "Failed to fetch order dispatch records." });
//   }
// });

// // PATCH API: Update a specific record
// router.patch("/order-dispatch/:id", async (req, res) => {
//   const { id } = req.params;
//   const { STATUS } = req.body; // Only taking status to update

//   if (!id) {
//     return res.status(400).json({ error: "ID is required" });
//   }

//   try {
//     const query = `
//       UPDATE [dbo].[belt_loading_unloading]
//       SET [STATUS] = @STATUS
//       WHERE [ID] = @ID
//     `;

//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .input("ID", sql.Int, id)
//       .input("STATUS", sql.NVarChar, STATUS)
//       .query(query);

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({ error: "Record not found." });
//     }

//     res.status(200).json({ message: "Status updated successfully." });
//   } catch (error) {
//     console.error("Error updating status:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // DELETE API: Delete a specific record
// router.delete("/order-dispatch/:id", async (req, res) =>{
//   const { id } = req.params;

//   if (!id) {
//     return res.status(400).json({ error: "ID is required" });
//   }
//   try {
//     const query = `
//     DELETE FROM [dbo].[belt_loading_unloading]
//     WHERE [ID] = @ID
//     `;
//     const pool = await poolPromise;
//     const result = await pool.request().input("ID", sql.Int, id).query(query);

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({ error: "Record not found." });
//     }

//     res.status(200).json({ message: "Record deleted successfully." });
//   } catch (error) {
//     console.error("Error deleting record:", error);
//     res.status(500).json({ error: "Failed to delete record." });
//   }
// });

// // POST API: Add a new record
// router.post("/order-dispatch", async (req, res) => {
//   const {
//     JOB_ORDER_NO,
//     JOB_ORDER_DATE,
//     PROCESS_GROUP,
//     PROCESS_NAME,
//     ITEM_NAME,
//     QUANTITY,
//     DEPARTMENT,
//     // STATUS
//   } = req.body;

//   // Check if all required fields are provided
//   if (!JOB_ORDER_NO  || !JOB_ORDER_DATE || !PROCESS_GROUP || !PROCESS_NAME || !ITEM_NAME || !QUANTITY || !DEPARTMENT) {
//     return res.status(400).json({ error: "All fields are required." });
//   }

//   try {
//     const query = `
//       INSERT INTO [dbo].[belt_loading_unloading]
//       ([JOB ORDER NO], [JOB ORDER DATE], [PROCESS GROUP], [PROCESS NAME], [ITEM NAME], [QUANTITY], [DEPARTMENT])
//       VALUES (@JOB_ORDER_NO, @JOB_ORDER_DATE, @PROCESS_GROUP, @PROCESS_NAME, @ITEM_NAME, @QUANTITY, @DEPARTMENT)
//     `;
//     const pool = await poolPromise;
//     await pool
//       .request()
//       .input("JOB_ORDER_NO", sql.NVarChar, JOB_ORDER_NO)
//       .input("JOB_ORDER_DATE", sql.NVarChar, JOB_ORDER_DATE)
//       .input("PROCESS_GROUP", sql.NVarChar, PROCESS_GROUP)
//       .input("PROCESS_NAME", sql.NVarChar, PROCESS_NAME)
//       .input("ITEM_NAME", sql.NVarChar, ITEM_NAME)
//       .input("QUANTITY", sql.Int, QUANTITY)
//       .input("DEPARTMENT", sql.NVarChar, DEPARTMENT)
//       // .input("STATUS", sql.NVarChar, STATUS)
//       .query(query);

//     res.status(201).json({ message: "Record added successfully." });
//   } catch (error) {
//     console.error("Error adding record:", error);
//     res.status(500).json({ error: "Failed to add record." });
//   }
// });

// router.get("/dispatch-Notification", async (req, res) => {
//   try {
//     const query = `
//       select *  FROM [dbo].[belt_loading_unloading] where [STATUS] = 'Ready to Dispatch'
//     `;
//     const pool = await poolPromise;
//     const result = await pool.request().query(query);
//     res.status(200).json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching order dispatch records:", error);
//     res.status(500).json({ error: "Failed to fetch order dispatch records." });
//   }
// });

// 📌 GET: Fetch all records from srpReport
router.get("/srpReport", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT [ID]
        ,[LOT ID]
        ,[GRN NO.]
        ,[RECEIVED DATE]
        ,[TOTAL QUANTITY]
        ,[STATUS]
        ,[admin_REMARK]
        ,[user_REMARK]  
        ,[delete_yes_no]  FROM [dbo].[srpReport] WHERE [delete_yes_no] = 'No' order by [RECEIVED DATE] DESC`);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching srpReport data:", error);
    res.status(500).json({ error: "Failed to fetch data." });
  }
});

// 📌 POST: Add a new record to srpReport
router.post("/srpReport", async (req, res) => {
  try {
    const { LOT_ID, GRN_NO, RECEIVED_DATE, TOTAL_QUANTITY } = req.body;

    const pool = await poolPromise;
    await // .input("STATUS", sql.VarChar, STATUS)
    pool
      .request()
      .input("LOT_ID", sql.VarChar, LOT_ID)
      .input("GRN_NO", sql.VarChar, GRN_NO)
      .input("RECEIVED_DATE", sql.Date, RECEIVED_DATE)
      .input("TOTAL_QUANTITY", sql.Int, TOTAL_QUANTITY).query(`
        INSERT INTO [dbo].[srpReport] ([LOT ID], [GRN NO.], [RECEIVED DATE], [TOTAL QUANTITY])
        VALUES (@LOT_ID, @GRN_NO, @RECEIVED_DATE, @TOTAL_QUANTITY)
      `);

    res.status(201).json({ message: "Record added successfully" });
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).json({ error: "Failed to add record." });
  }
});

// 📌 PATCH: Update record status
router.patch("/srpReport/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { STATUS } = req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("STATUS", sql.VarChar, STATUS).query(`
        UPDATE [dbo].[srpReport] 
        SET [STATUS] = @STATUS
        WHERE ID = @ID
      `);

    res.status(200).json({ message: "Record updated successfully" });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record." });
  }
});

// 📌 DELETE: Soft delete (marks delete_yes_no as 1)
router.delete("/srpReport/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;
    await pool.request().input("ID", sql.Int, id).query(`
        UPDATE [dbo].[srpReport] 
        SET delete_yes_no = 'Yes'
        WHERE ID = @ID
      `);

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record." });
  }
});

router.get("/dispatch-Notification", async (req, res) => {
  try {
    const query = `
  	select [ID]
        ,[LOT ID]
		    ,[GRN NO.]
		    ,[RECEIVED DATE]
        ,[TOTAL QUANTITY]
        ,[STATUS]
        ,[delete_yes_no]
        ,[admin_REMARK]
        ,[user_REMARK]  
		FROM [dbo].[srpReport] where [STATUS] = 'READY TO DISPATCH' and delete_yes_no ='No'
    `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching order dispatch records:", error);
    res.status(500).json({ error: "Failed to fetch order dispatch records." });
  }
});

////// FOR ADD REMAR
router.patch("/srpReport/remark_admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_REMARK } = req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("admin_REMARK", sql.NVarChar, admin_REMARK)
      .query(
        `UPDATE [dbo].[srpReport] SET [admin_REMARK] = @admin_REMARK WHERE ID = @ID`
      );

    res.status(200).json({ message: "Remark updated successfully" });
  } catch (error) {
    console.error("Error updating remark:", error);
    res.status(500).json({ error: "Failed to update remark." });
  }
});

router.patch("/srpReport/remark_user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_REMARK } = req.body;

    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("user_REMARK", sql.NVarChar, user_REMARK)
      .query(
        `UPDATE [dbo].[srpReport] SET [user_REMARK] = @user_REMARK WHERE ID = @ID`
      );

    res.status(200).json({ message: "Remark updated successfully" });
  } catch (error) {
    console.error("Error updating remark:", error);
    res.status(500).json({ error: "Failed to update remark." });
  }
});

//New API's for loopi checking 11 fab 25
router.get("/loopiChecking_Notify", async (req, res) => {
  try {
    const query = `
  	  select [JOB ORDER NO]
      ,[JOB ORDER DATE]
      ,[PROCESS GROUP]
      ,[PROCESS NAME]
      ,[ITEM NAME]
      ,[QUANTITY]
      ,[JO QUANTITY]
      ,[JO QUANTITY PRODUCED]
      ,[DEPARTMENT]
	    ,[Supervisor]
       FROM [dbo].[StagingTable] where [PROCESS NAME] = 'LOOPI CHECKING' 
     `;
    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching order dispatch records:", error);
    res.status(500).json({ error: "Failed to fetch order dispatch records." });
  }
});

// **GET API - Fetch all records**
router.get("/loopi-checking", async (req, res) => {
  try {
    const { supervisor } = req.query;

    let query = `
      SELECT [ID], [Previous_Supervisor], [Current_Supervisor], [Quantity], 
             [Hours], [Lot_ID], [Process_name] 
      FROM [dbo].[Loopi_Checking]
    `;

    if (supervisor) {
      query += ` WHERE [Current_Supervisor] = @supervisor`;
    }

    const pool = await poolPromise;
    const request = pool.request();
    if (supervisor) {
      request.input("supervisor", supervisor);
    }

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records." });
  }
});

// router.get("/loopi-checking", async (req, res) => {
//   try {
//     const query = `
//       SELECT [ID], [Previous_Supervisor], [Current_Supervisor], [Quantity],
//              [Hours], [Lot_ID], [Process_name]
//       FROM [dbo].[Loopi_Checking]
//     `;

//     const pool = await poolPromise;
//     const result = await pool.request().query(query);
//     res.status(200).json(result.recordset);
//   } catch (error) {
//     console.error("Error fetching records:", error);
//     res.status(500).json({ error: "Failed to fetch records." });
//   }
// });

// **POST API - Insert new record**
router.post("/loopi-checking", async (req, res) => {
  try {
    const {
      Previous_Supervisor,
      Current_Supervisor,
      Quantity,
      Hours,
      Lot_ID,
      Process_name,
    } = req.body;

    if (
      !Current_Supervisor ||
      !Quantity ||
      !Hours ||
      !Lot_ID ||
      !Process_name
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const query = `
      INSERT INTO [dbo].[Loopi_Checking] ([Previous_Supervisor], [Current_Supervisor], 
        [Quantity], [Hours], [Lot_ID], [Process_name])
      VALUES (@Previous_Supervisor, @Current_Supervisor, @Quantity, @Hours, @Lot_ID, @Process_name)
    `;

    const pool = await poolPromise;
    await pool
      .request()
      .input("Previous_Supervisor", Previous_Supervisor)
      .input("Current_Supervisor", Current_Supervisor)
      .input("Quantity", Quantity)
      .input("Hours", Hours)
      .input("Lot_ID", Lot_ID)
      .input("Process_name", Process_name)
      .query(query);

    res.status(201).json({ message: "Record inserted successfully." });
  } catch (error) {
    console.error("Error inserting record:", error);
    res.status(500).json({ error: "Failed to insert record." });
  }
});

// // **PUT API - Update a record by ID**
// router.put("/loopi-checking/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { Previous_Supervisor, Current_Supervisor, Quantity, Hours, Lot_ID, Process_name } = req.body;

//     if (!id) {
//       return res.status(400).json({ error: "ID is required." });
//     }

//     const query = `
//       UPDATE [dbo].[Loopi_Checking]
//       SET Previous_Supervisor = @Previous_Supervisor,
//           Current_Supervisor = @Current_Supervisor,
//           Quantity = @Quantity,
//           Hours = @Hours,
//           Lot_ID = @Lot_ID,
//           Process_name = @Process_name
//       WHERE ID = @id
//     `;

//     const pool = await poolPromise;
//     const result = await pool.request()
//       .input("id", id)
//       .input("Previous_Supervisor", Previous_Supervisor)
//       .input("Current_Supervisor", Current_Supervisor)
//       .input("Quantity", Quantity)
//       .input("Hours", Hours)
//       .input("Lot_ID", Lot_ID)
//       .input("Process_name", Process_name)
//       .query(query);

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({ error: "Record not found." });
//     }

//     res.status(200).json({ message: "Record updated successfully." });
//   } catch (error) {
//     console.error("Error updating record:", error);
//     res.status(500).json({ error: "Failed to update record." });
//   }
// });

// **PUT API - Update a record by ID with Supervisor Auto-Swap**
router.put("/loopi-checking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Current_Supervisor, Quantity, Hours, Lot_ID, Process_name } =
      req.body;

    if (!id || !Current_Supervisor) {
      return res
        .status(400)
        .json({ error: "ID and Current_Supervisor are required." });
    }

    const pool = await poolPromise;

    // Fetch the existing record
    const existingQuery = `SELECT [Previous_Supervisor], [Current_Supervisor] FROM [dbo].[Loopi_Checking] WHERE ID = @id`;
    const existingResult = await pool
      .request()
      .input("id", id)
      .query(existingQuery);

    if (existingResult.recordset.length === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    const previousSupervisor = existingResult.recordset[0].Current_Supervisor; // Move Current to Previous

    // Update the record with swapped supervisors
    const updateQuery = `
      UPDATE [dbo].[Loopi_Checking]
      SET Previous_Supervisor = @previousSupervisor, 
          Current_Supervisor = @Current_Supervisor,
          Quantity = @Quantity,
          Hours = @Hours,
          Lot_ID = @Lot_ID,
          Process_name = @Process_name
      WHERE ID = @id
    `;

    const result = await pool
      .request()
      .input("id", id)
      .input("previousSupervisor", previousSupervisor) // Set old Current_Supervisor as Previous
      .input("Current_Supervisor", Current_Supervisor) // Set new Supervisor as Current
      .input("Quantity", Quantity)
      .input("Hours", Hours)
      .input("Lot_ID", Lot_ID)
      .input("Process_name", Process_name)
      .query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res
      .status(200)
      .json({ message: "Record updated successfully with supervisor swap." });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record." });
  }
});

// **DELETE API - Delete a record by ID**
router.delete("/loopi-checking/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required." });
    }

    const query = `DELETE FROM [dbo].[Loopi_Checking] WHERE ID = @id`;

    const pool = await poolPromise;
    const result = await pool.request().input("id", id).query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res.status(200).json({ message: "Record deleted successfully." });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record." });
  }
});

/// Sales flow API // 13 Fab 2025
// **GET API - Fetch all records**
router.get("/sales-flow", async (req, res) => {
  try {
    const query = `
      SELECT [LOT ID], [SRP NO], [RECEIVED TIME], [QUANTITY], [ID], [Confirm Time], [Invoice_Number], [ScanStatus], [isDeleted], [Remarks]
      FROM [dbo].[SalesFlow] WHERE isDeleted = 'No'
    `;

    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching SalesFlow records:", error);
    res.status(500).json({ error: "Failed to fetch SalesFlow records." });
  }
});

// **POST API - Insert a new record**
router.post("/sales-flow", async (req, res) => {
  try {
    const { LOT_ID, SRP_NO, QUANTITY, Remarks } = req.body;

    if (!LOT_ID || !SRP_NO || !QUANTITY) {
      return res.status(400).json({ error: "All fields required." });
    }

    const receivedTimeIST = formatDateTime(new Date());

    const query = `
      INSERT INTO [dbo].[SalesFlow] ([LOT ID], [SRP NO], [RECEIVED TIME], [QUANTITY], [Remarks])
      VALUES (@LOT_ID, @SRP_NO, @RECEIVED_TIME, @QUANTITY, @Remarks)
    `;

    const pool = await poolPromise;
    await pool
      .request()
      .input("LOT_ID", sql.NVarChar, LOT_ID)
      .input("SRP_NO", sql.NVarChar, SRP_NO)
      .input("RECEIVED_TIME", sql.NVarChar, receivedTimeIST)
      .input("QUANTITY", sql.Int, QUANTITY)
      .input("Remarks", sql.NVarChar, Remarks)
      //.input("Confirm_Time", sql.NVarChar, confirmTimeIST)

      .query(query);

    res.status(201).json({ message: "Record inserted successfully." });
  } catch (error) {
    console.error("Error inserting record into SalesFlow:", error);
    res.status(500).json({ error: "Failed to insert record into SalesFlow." });
  }
});

// PATCH API - Confirm a SalesFlow Record (Update Confirm Time by ID)
router.patch("/sales-flow/confirm/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ error: "ID is required for confirmation update." });
    }

    // Format current time in IST
    const confirmTimeIST = formatDateTime(new Date());

    // Update Confirm Time
    const query = `
      UPDATE [dbo].[SalesFlow]
      SET [Confirm Time] = @Confirm_Time
      WHERE [ID] = @id
    `;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("Confirm_Time", sql.VarChar, confirmTimeIST)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res.status(200).json({ message: "Confirm Time updated successfully." });
  } catch (error) {
    console.error("Error updating Confirm Time:", error);
    res.status(500).json({ error: "Failed to update Confirm Time." });
  }
});

// **PUT API - Update a record by ID**
router.put("/sales-flow/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { LOT_ID, SRP_NO, RECEIVED_TIME, QUANTITY, Invoice_Number, Remarks } =
      req.body;

    if (!id) {
      return res
        .status(400)
        .json({ error: "ID is required for updating a record." });
    }

    const query = `
      UPDATE [dbo].[SalesFlow]
      SET [LOT ID] = @LOT_ID,
          [SRP NO] = @SRP_NO,
          [RECEIVED TIME] = @RECEIVED_TIME,
          [QUANTITY] = @QUANTITY,      
          [Invoice_Number] = @Invoice_Number,
          [Remarks] = @Remarks
      WHERE [ID] = @id
    `;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("LOT_ID", sql.NVarChar, LOT_ID)
      .input("SRP_NO", sql.NVarChar, SRP_NO)
      .input("RECEIVED_TIME", sql.NVarChar, RECEIVED_TIME)
      .input("QUANTITY", sql.Int, QUANTITY)
      .input("Invoice_Number", sql.NVarChar, Invoice_Number)
      .input("Remarks", sql.NVarChar, Remarks)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res.status(200).json({ message: "Record updated successfully." });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record." });
  }
});

// **DELETE API - Delete a record by ID**
router.delete("/sales-flow/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ error: "ID is required for deleting a record." });
    }

    const query = `UPDATE [dbo].[SalesFlow] SET isDeleted = 'Yes' WHERE ID = @id`;
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.Int, id).query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res.status(200).json({ message: "Record deleted successfully." });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record." });
  }
});

// PATCH API: Update Invoice Number & Timestamp
router.patch("/sales-flow/invoice/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Invoice_Number } = req.body;

    // if (!id || !Invoice_Number) {
    //   return res.status(400).json({ error: "Invoice Number and ID are required." });
    // }

    const invoiceTimeIST = formatDateTime(new Date()); // Get current time in IST

    const query = `
      UPDATE [dbo].[SalesFlow]
      SET [Invoice_Number] = @Invoice_Number,
          [InvoiceNumber_time] = @InvoiceNumber_time
      WHERE [ID] = @id
    `;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("Invoice_Number", sql.NVarChar, Invoice_Number)
      .input("InvoiceNumber_time", sql.NVarChar, invoiceTimeIST)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Record not found." });
    }

    res
      .status(200)
      .json({
        message: "Invoice Number updated successfully!",
        InvoiceNumber_time: invoiceTimeIST,
      });
  } catch (error) {
    console.error("Error updating Invoice Number:", error);
    res.status(500).json({ error: "Failed to update Invoice Number." });
  }
});

router.patch("/sales-flow/scan-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ScanStatus } = req.body;

    if (!id || !ScanStatus) {
      return res.status(400).json({ error: "ID and ScanStatus are required." });
    }

    let ReadyForScan_Time = null;
    let Scanned_Time = null;

    if (ScanStatus === "Ready for Scan") {
      ReadyForScan_Time = formatDateTime(new Date()); // Store timestamp in IST format
    }

    if (ScanStatus === "Scanned") {
      Scanned_Time = formatDateTime(new Date()); // Store timestamp in IST format
    }

    const query = `
      UPDATE [dbo].[SalesFlow]
      SET ScanStatus = @ScanStatus, 
          ReadyForScan_Time = COALESCE(@ReadyForScan_Time, ReadyForScan_Time),
          Scanned_Time = COALESCE(@Scanned_Time, Scanned_Time)
      WHERE ID = @id
    `;

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("ScanStatus", sql.NVarChar, ScanStatus)
      .input("ReadyForScan_Time", sql.NVarChar, ReadyForScan_Time) // Store as string in DD/MM/YYYY : HH:MM AM/PM
      .input("Scanned_Time", sql.NVarChar, Scanned_Time) // Store Scanned time
      .query(query);

    res.status(200).json({ message: "Scan Status updated successfully." });
  } catch (error) {
    console.error("Error updating Scan Status:", error);
    res.status(500).json({ error: "Failed to update Scan Status." });
  }
});

// router.patch("/sales-flow/invoice-status/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { InvoiceStatus } = req.body;

//     if (!id || !InvoiceStatus) {
//       return res.status(400).json({ error: "ID and InvoiceStatus are required." });
//     }

//     let ReadyForInvoice_Time = null;
//     if (InvoiceStatus === "Create Invoice") {
//       ReadyForInvoice_Time = formatDateTime(new Date()); // Store timestamp in IST format
//     }

//     const query = `
//       UPDATE [dbo].[SalesFlow]
//       SET InvoiceStatus = @InvoiceStatus,
//           ReadyForInvoice_Time = COALESCE(@ReadyForInvoice_Time, ReadyForInvoice_Time)
//       WHERE ID = @id
//     `;

//     const pool = await poolPromise;
//     await pool.request()
//       .input("id", sql.Int, id)
//       .input("InvoiceStatus", sql.NVarChar, InvoiceStatus)
//       .input("ReadyForInvoice_Time", sql.NVarChar, ReadyForInvoice_Time) // Store as string in DD/MM/YYYY : HH:MM AM/PM
//       .query(query);

//     res.status(200).json({ message: "Invoice Status updated successfully." });
//   } catch (error) {
//     console.error("Error updating Invoice Status:", error);
//     res.status(500).json({ error: "Failed to update Invoice Status." });
//   }
// });

// **GET API - Nofitication for new record or invoice status **
router.get("/sales-flow-Notification", async (req, res) => {
  try {
    const query = `
      SELECT [LOT ID], [SRP NO], [RECEIVED TIME], [QUANTITY], [ID], [Confirm Time], [Invoice_Number], [ScanStatus], [isDeleted], [Remarks]
     FROM [dbo].[SalesFlow] where [Confirm Time] is null or Invoice_Number is null and isDeleted = 'No'
    `;

    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching SalesFlow records:", error);
    res.status(500).json({ error: "Failed to fetch SalesFlow records." });
  }
});

// **GET API -scan Nofitication **
router.get("/sales-flow-ScanNotification", async (req, res) => {
  try {
    const query = `
       SELECT [LOT ID], [SRP NO], [RECEIVED TIME], [QUANTITY], [ID], [Confirm Time], [Invoice_Number], [ScanStatus], [isDeleted] [Remarks]
     FROM [dbo].[SalesFlow] where [ScanStatus] = 'Ready for Scan' AND isDeleted = 'No'
    `;

    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching SalesFlow records:", error);
    res.status(500).json({ error: "Failed to fetch SalesFlow records." });
  }
});

// **GET API -scan Details for table**
router.get("/sales-flow-Scan", async (req, res) => {
  try {
    const query = `
       SELECT [LOT ID], [SRP NO], [RECEIVED TIME], [QUANTITY], [ID], [Confirm Time], [Invoice_Number], [ScanStatus],[isDeleted], [Remarks]
     FROM [dbo].[SalesFlow] where ([ScanStatus] = 'Ready for Scan' or [ScanStatus] = 'Scanned' ) AND isDeleted = 'No'
    `;

    const pool = await poolPromise;
    const result = await pool.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching SalesFlow records:", error);
    res.status(500).json({ error: "Failed to fetch SalesFlow records." });
  }
});
module.exports = router;
