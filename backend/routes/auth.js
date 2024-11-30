const express = require("express");
const { poolPromise, sql } = require("../config/db");
const bcrypt = require("bcrypt");
const router = express.Router();
// const { sql, poolPromise } = require("../db");
// Create an API endpoint to retrieve data
router.get("/data", async (req, res) => {
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
    if (department === "null") {
      // If department is 'null', filter for rows where DEPARTMENT IS NULL
      query += " WHERE T1.DEPARTMENT IS NULL";
    } else if (department && jobOrderNo) {
      // If both department and jobOrderNo are provided, filter by both
      query +=
        " WHERE T1.DEPARTMENT = @department AND T1.[JOB ORDER NO] = @jobOrderNo";
      request.input("department", sql.NVarChar, department);
      request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
    } else if (department) {
      // If only department is provided, filter by department
      query += " WHERE T1.DEPARTMENT = @department";
      request.input("department", sql.NVarChar, department);
    } else if (jobOrderNo) {
      // If only jobOrderNo is provided, filter by jobOrderNo
      query += " WHERE T1.[JOB ORDER NO] = @jobOrderNo";
      request.input("jobOrderNo", sql.NVarChar, jobOrderNo);
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
// Signup API
// router.post("/signup", async (req, res) => {
//   const { Name, Email, Mobile, Password, Auth, EmployeeID } = req.body;

//   if (!Name || !Email || !Mobile || !Password || !Auth || !EmployeeID) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const pool = await poolPromise;

//     // Check if the email already exists
//     const emailCheck = await pool
//       .request()
//       .input("Email", sql.NVarChar, Email)
//       .query("SELECT * FROM [dbo].[Users] WHERE Email = @Email");

//     if (emailCheck.recordset.length > 0) {
//       return res.status(400).json({ error: "Email already registered" });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(Password, 10);

//     // Insert the user
//     await pool
//       .request()
//       .input("Name", sql.VarChar, Name)
//       .input("Email", sql.VarChar, Email)
//       .input("Mobile", sql.NVarChar, Mobile)
//       .input("Password", sql.NVarChar, hashedPassword)
//       .input("Auth", sql.VarChar, Auth)
//       .input("EmployeeID", sql.VarChar, EmployeeID).query(`
//                 INSERT INTO [dbo].[Users] (Name, Email, Mobile, Password, Auth, EmployeeID)
//                 VALUES (@Name, @Email, @Mobile, @Password, @Auth, @EmployeeID)
//             `);

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (err) {
//     console.error("Signup error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


router.post("/signup", async (req, res) => {
  const { Name, Email, Mobile, Password, Auth, EmployeeID, Department } = req.body;

  // Validate all required fields
  if (!Name || !Email || !Mobile || !Password || !Auth || !EmployeeID || !Department) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const pool = await poolPromise;

    // Check if the email already exists
    const emailCheck = await pool
      .request()
      .input("Email", sql.NVarChar, Email)
      .query("SELECT * FROM [dbo].[Users] WHERE Email = @Email");

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if the EmployeeID already exists
    const employeeIDCheck = await pool
      .request()
      .input("EmployeeID", sql.VarChar, EmployeeID)
      .query("SELECT * FROM [dbo].[Users] WHERE EmployeeID = @EmployeeID");

    if (employeeIDCheck.recordset.length > 0) {
      return res.status(400).json({ error: "EmployeeID already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Insert the user
    await pool
      .request()
      .input("Name", sql.VarChar, Name)
      .input("Email", sql.VarChar, Email)
      .input("Mobile", sql.NVarChar, Mobile)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("Auth", sql.VarChar, Auth)
      .input("EmployeeID", sql.VarChar, EmployeeID)
      .input("Department", sql.VarChar, Department) // Add Department input
      .query(`
        INSERT INTO [dbo].[Users] (Name, Email, Mobile, Password, Auth, EmployeeID, Department)
        VALUES (@Name, @Email, @Mobile, @Password, @Auth, @EmployeeID, @Department)
      `);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Login API
// router.post("/login", async (req, res) => {
//   const { identifier, Password } = req.body;

//   if (!identifier || !Password) {
//     return res.status(400).json({ error: "Please check your credentials" });
//   }

//   try {
//     const pool = await poolPromise;

//     // Query the database to find a user by Email or EmployeeID
//     const user = await pool
//       .request()
//       .input("identifier", sql.NVarChar, identifier)
//       .query(`
//                 SELECT id, Name, Email, Mobile, Password, Auth, EmployeeID, Department
//                 FROM [dbo].[Users]
//                 WHERE Email = @identifier OR EmployeeID = @identifier
//             `);

//     // Check if the user exists
//     if (user.recordset.length === 0) {
//       return res
//         .status(401)
//         .json({ error: "Invalid Email/Employee ID or Password" });
//     }

//     // Compare the password using bcrypt
//     const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

//     if (!isMatch) {
//       return res
//         .status(401)
//         .json({ error: "Invalid Email/Employee ID or Password" });
//     }

//     // Insert login time into UserActivity table only if Auth = 'User'
//     if (user.recordset[0].Auth === "User") {
//       const loginTime = new Date().toISOString(); // Use UTC time for database
//       await pool
//         .request()
//         .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
//         .input("LoginTime", sql.DateTime, loginTime)
//         .input("Department", sql.NVarChar, user.recordset[0].Department || null) // Optional department
//         .query(`
//           INSERT INTO UserActivity (EmployeeID, LoginTime, Department)
//           VALUES (@EmployeeID, @LoginTime, @Department)
//         `);
//     }

//     // Return the user details with appropriate redirection
//     res.status(200).json({
//       message: "Login successful",
//       user: {
//         id: user.recordset[0].id,
//         Name: user.recordset[0].Name,
//         Email: user.recordset[0].Email,
//         Mobile: user.recordset[0].Mobile,
//         Auth: user.recordset[0].Auth,
//         EmployeeID: user.recordset[0].EmployeeID,
//         Department: user.recordset[0].Department,
//       },
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// router.post("/login", async (req, res) => {
//   const { identifier, Password } = req.body;

//   if (!identifier || !Password) {
//     return res.status(400).json({ error: "Please check your credentials" });
//   }

//   try {
//     const pool = await poolPromise;

//     // Query the database to find a user by Email or EmployeeID
//     const user = await pool
//       .request()
//       .input("identifier", sql.NVarChar, identifier)
//       .query(`
//         SELECT 
//           id, Name, Email, Mobile, Password, Auth, EmployeeID, Department
//         FROM [dbo].[Users]
//         WHERE Email = @identifier OR EmployeeID = @identifier
//       `);

//     // Check if the user exists
//     if (user.recordset.length === 0) {
//       return res
//         .status(401)
//         .json({ error: "Invalid Email/Employee ID or Password" });
//     }

//     // Compare the password using bcrypt
//     const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

//     if (!isMatch) {
//       return res
//         .status(401)
//         .json({ error: "Invalid Email/Employee ID or Password" });
//     }

//     // Check for active temporary department in the DepartmentHistory table
//     const currentTime = new Date().toISOString();
//     const departmentHistory = await pool
//       .request()
//       .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
//       .input("CurrentTime", sql.DateTime, currentTime)
//       .query(`
//         SELECT 
//           TemporaryDepartment 
//         FROM [dbo].[DepartmentHistory]
//         WHERE EmployeeID = @EmployeeID 
//           AND FromTime <= @CurrentTime
//           AND (ToTime IS NULL OR ToTime >= @CurrentTime)
//         ORDER BY FromTime DESC
//       `);

//     let activeDepartment = user.recordset[0].Department; // Default to permanent department

//     if (departmentHistory.recordset.length > 0) {
//       activeDepartment = departmentHistory.recordset[0].TemporaryDepartment; // Use temporary department if active
//     }

//     // Insert login time into UserActivity table only if Auth = 'User'
//     if (user.recordset[0].Auth === "User") {
//       const loginTime = new Date().toISOString(); // Use UTC time for database
//       await pool
//         .request()
//         .input("EmployeeID", sql.NVarChar, user.recordset[0].EmployeeID)
//         .input("LoginTime", sql.DateTime, loginTime)
//         .input("Department", sql.NVarChar, activeDepartment) // Use active department
//         .query(`
//           INSERT INTO UserActivity (EmployeeID, LoginTime, Department)
//           VALUES (@EmployeeID, @LoginTime, @Department)
//         `);
//     }

//     // Return the user details with the department set appropriately
//     res.status(200).json({
//       message: "Login successful",
//       user: {
//         id: user.recordset[0].id,
//         Name: user.recordset[0].Name,
//         Email: user.recordset[0].Email,
//         Mobile: user.recordset[0].Mobile,
//         Auth: user.recordset[0].Auth,
//         EmployeeID: user.recordset[0].EmployeeID,
//         Department: activeDepartment, // Return the active department
//       },
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

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
          id, Name, Email, Mobile, Password, Auth, EmployeeID, Department
        FROM [dbo].[Users]
        WHERE Email = @identifier OR EmployeeID = @identifier
      `);

    if (user.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid Email/Employee ID or Password" });
    }

    const isMatch = await bcrypt.compare(Password, user.recordset[0].Password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Email/Employee ID or Password" });
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

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.recordset[0].id,
        Name: user.recordset[0].Name,
        Email: user.recordset[0].Email,
        Mobile: user.recordset[0].Mobile,
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

// Utility function to convert IST to UTC
// function convertISTToUTC(istTime) {
//   const istDate = new Date(istTime);
//   const offsetIST = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
//   return new Date(istDate.getTime() - offsetIST).toISOString().slice(0, 19).replace("T", " ");
// }

// function convertISTToUTC(istTime) {
//     const istDate = new Date(istTime);
//     const offsetIST = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
//     return new Date(istDate.getTime() - offsetIST).toISOString().slice(0, 19).replace('T', ' ');
// }


///26 nov

router.get("/AllUsers", async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.query("SELECT * FROM [dbo].[Users]");
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get user by id
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("UserID", sql.Int, id)
      .query("SELECT * FROM [dbo].[Users] WHERE ID = @UserID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

///update user
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { Name, Email, Mobile, Auth, EmployeeID, Department } = req.body;

  // Validate required fields
  if (!Name || !Email || !Mobile || !Auth || !EmployeeID || !Department) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("UserID", sql.Int, id)
      .query("SELECT * FROM [dbo].[Users] WHERE ID = @UserID");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user
    await pool
      .request()
      .input("UserID", sql.Int, id)
      .input("Name", sql.VarChar, Name)
      .input("Email", sql.VarChar, Email)
      .input("Mobile", sql.NVarChar, Mobile)
      .input("Auth", sql.VarChar, Auth)
      .input("EmployeeID", sql.VarChar, EmployeeID)
      .input("Department", sql.VarChar, Department)
      .query(`
        UPDATE [dbo].[Users]
        SET Name = @Name, Email = @Email, Mobile = @Mobile,
            Auth = @Auth, EmployeeID = @EmployeeID, Department = @Department
        WHERE ID = @UserID
      `);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /users/:id
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("UserID", sql.Int, id)
      .query("SELECT * FROM [dbo].[Users] WHERE ID = @UserID");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await pool
      .request()
      .input("UserID", sql.Int, id)
      .query("DELETE FROM [dbo].[Users] WHERE ID = @UserID");

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


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
router.get("/departments/worker-requirements", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        DepartmentName,
        LotQuantity,
        RequiredResource,
        AvailableResource,
        (RequiredResource - AvailableResource) AS ToFill
      FROM Departments
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching department worker requirements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


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

//     // Update all departments' AvailableResource to 0 as a default
//     await pool.request().query(`
//       UPDATE Departments
//       SET AvailableResource = 0;
//     `);

//     // Loop through departments with present workers and update AvailableResource
//     for (const worker of presentWorkers.recordset) {
//       await pool
//         .request()
//         .input("PresentWorkers", sql.Int, worker.PresentWorkers)
//         .input("Department", sql.NVarChar, worker.Department)
//         .query(`
//           UPDATE Departments
//           SET AvailableResource = @PresentWorkers
//           WHERE DepartmentName = @Department;
//         `);
//     }

//     res.status(200).json({ message: "Available resources updated successfully." });
//   } catch (error) {
//     console.error("Error updating available resources:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });


// router.put("/departments/update-lot", async (req, res) => {
//   const { DepartmentName, LotQuantity } = req.body;

//   if (!DepartmentName || !LotQuantity) {
//     return res.status(400).json({ error: "DepartmentName and LotQuantity are required." });
//   }

//   try {
//     const pool = await poolPromise;

//     // Define a rule for workers per lot
//     const workersPerLot = 4000; // Example: 1 worker required for every 4000 units

//     const requiredWorkers = Math.ceil(LotQuantity / workersPerLot);

//     // Update LotQuantity and RequiredResource
//     await pool.request()
//       .input("LotQuantity", sql.Int, LotQuantity)
//       .input("RequiredResource", sql.Int, requiredWorkers)
//       .input("DepartmentName", sql.NVarChar, DepartmentName)
//       .query(`
//         UPDATE Departments
//         SET LotQuantity = @LotQuantity,
//             RequiredResource = @RequiredResource
//         WHERE DepartmentName = @DepartmentName
//       `);

//     res.status(200).json({ message: "Lot quantity and required workers updated successfully." });
//   } catch (error) {
//     console.error("Error updating lot quantity:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// Define Department Ratios (Fixed Lots per Worker for Each Department)
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

// Update /departments/update-lot Endpoint
router.put("/departments/update-lot", async (req, res) => {
  const { DepartmentName, LotQuantity } = req.body;

  if (!DepartmentName || !LotQuantity) {
    return res.status(400).json({ error: "DepartmentName and LotQuantity are required." });
  }

  try {
    const pool = await poolPromise;

    // Get the ratio for the specified department
    const ratio = departmentRatios[DepartmentName];
    if (!ratio) {
      return res.status(400).json({ error: `No ratio defined for department: ${DepartmentName}` });
    }

    const requiredWorkers = Math.ceil(LotQuantity / ratio);

    // Update LotQuantity and RequiredResource
    await pool
      .request()
      .input("LotQuantity", sql.Int, LotQuantity)
      .input("RequiredResource", sql.Int, requiredWorkers)
      .input("DepartmentName", sql.NVarChar, DepartmentName)
      .query(`
        UPDATE Departments
        SET LotQuantity = @LotQuantity,
            RequiredResource = @RequiredResource
        WHERE DepartmentName = @DepartmentName;
      `);

    res.status(200).json({ message: "Lot quantity and required workers updated successfully." });
  } catch (error) {
    console.error("Error updating lot quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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



module.exports = router;
