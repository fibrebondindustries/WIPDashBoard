let wasDisconnected = false; // Track previous connection status

// Function to check server health
async function checkServerHealth() {
    try {
        //  const response = await fetch('http://localhost:5050/api/health');
         const response = await fetch('http://localhost:5050/api/health');
        const health = await response.json();

        if (health.status === 'connected') {
            if (wasDisconnected) {
                // Refresh the page if it was previously disconnected and now reconnected
                location.reload();
            }
            wasDisconnected = false; // Reset disconnection tracker
        } else {
            displayErrorMessage("Database Connection Lost");
            wasDisconnected = true;
        }
    } catch (error) {
        // console.error("Error checking server health:", error);
        displayErrorMessage("Database Connection Lost");
        wasDisconnected = true;
    }
}

// Call this function periodically
setInterval(checkServerHealth, 5050); // Check every 5 seconds




// Fetch data from the backend
async function fetchData() {
    try {
        const url = 'http://localhost:5050/api/data';
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Database Connection Lost");
        }

        const data = await response.json();

        // Calculate the sum of QUANTITY for each department
        const departmentSums = data.reduce((acc, row) => {
            const dept = row['DEPARTMENT'] || 'Department Not Available';
            acc[dept] = (acc[dept] || 0) + (row['QUANTITY'] || 0);
            return acc;
        }, {});

        setupDepartmentFilter(departmentSums); // Update button colors
        displayData(data); // Display fetched data in the table
    } catch (error) {
        console.error("Error fetching data:", error);
        displayErrorMessage("Database Connection Lost");
    }
}


// Function to display error message on the frontend
function displayErrorMessage(message) {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ""; // Clear the existing table content

  const tr = document.createElement("tr");
  tr.innerHTML = `<td colspan="7" class="text-center text-danger font-weight-bold text-uppercase ">${message}</td>`;
  tableBody.appendChild(tr);
}


// Display data in the table

// Setup department filter buttons
function displayData(data) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // Clear existing data
  
    data.forEach(row => {
        const tr = document.createElement("tr");
  
        tr.innerHTML = `
            <td><a href="description.html?jobOrderNo=${encodeURIComponent(row['JOB ORDER NO'])}" >${row['JOB ORDER NO']}</a></td>
            <td>${new Date(row['JOB ORDER DATE']).toLocaleDateString()}</td>
            <td>${row['ITEM NAME']}</td>
            <td>${row['PROCESS NAME']}</td>
            <td>${row['PROCESS GROUP']}</td>
            <td>${row['QUANTITY']}</td>
            <td>${row['DEPARTMENT'] || '<span class="text-danger">Department Not Available</span>'} <!-- Display "Department Not Available" if null -->
        `;
  
        tableBody.appendChild(tr);
    });
  }
  
  // Setup department filter buttons

function setupDepartmentFilter(departmentSums) {
    const filterContainer = document.getElementById("filter-container");
    filterContainer.innerHTML = ""; // Clear any existing buttons

    Object.entries(departmentSums).forEach(([department, sum]) => {
        const button = document.createElement("button");
        button.className = "filter-btn btn btn-outline-secondary";
        button.innerText = department;

        // Add tooltip attribute
        button.setAttribute("data-bs-toggle", "tooltip"); // For Bootstrap tooltip
        button.setAttribute("data-bs-placement", "top"); // Position the tooltip above
        button.setAttribute("title", `Total Quantity: ${sum}`); // Tooltip text

        // Add color based on the sum of QUANTITY
        if (sum < 29000) {
            button.style.backgroundColor = '#ffc266'; // Orange
            button.style.color = 'black';
        } else if (sum > 34500) {
            button.style.backgroundColor = '#ff4d4d'; // Red
            button.style.color = 'black';
        } else {
            button.style.backgroundColor = 'green';
            button.style.color = 'black';
        }

        // Add onclick event to filter data by department
        button.onclick = () => {
            fetchFilteredData(department);
            setActiveButton(button);
        };

        filterContainer.appendChild(button);
    });

    // Initialize tooltips for buttons
    initializeTooltips();
}

// Function to initialize tooltips (using Bootstrap tooltips)
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl); // Bootstrap tooltip initialization
    });
}


// Fetch and display filtered data for a specific department
async function fetchFilteredData(department) {
    try {
        const url = department === 'Department Not Available'
            ? 'http://localhost:5050/api/data?department=null'
            : `http://localhost:5050/api/data?department=${encodeURIComponent(department)}`;
        const response = await fetch(url);
        const data = await response.json();
        displayData(data); // Update the table based on the filtered data
    } catch (error) {
        console.error("Error fetching filtered data:", error);
    }
}

// Set active button style
function setActiveButton(activeButton) {
  const buttons = document.querySelectorAll("#filter-container button");
  buttons.forEach(button => button.classList.remove("active"));
  activeButton.classList.add("active");
}


// Scroll Left function with smooth scroll behavior
function scrollFilterLeft() {
    const filterContainer = document.getElementById("filter-container");
    filterContainer.scrollBy({
        left: -200,
        behavior: 'smooth'
    });
}

// Scroll Right function with smooth scroll behavior
function scrollFilterRight() {
    const filterContainer = document.getElementById("filter-container");
    filterContainer.scrollBy({
        left: 200,
        behavior: 'smooth'
    });
}


////20Nov Code
async function fetchLastUpdatedDate() {
    try {
        // Fetch all data from the API
        const response = await fetch('http://localhost:5050/api/data');
        const data = await response.json();

        if (data && data.length > 0) {
            // Extract the most recent `Updated_Time`
            const lastUpdated = data.reduce((latest, current) => {
                // Compare the string representation of Updated_Time
                return current['Updated_Time'] > latest['Updated_Time'] ? current : latest;
            });

            // Use the Updated_Time value directly since it’s already formatted
            const formattedDate = lastUpdated['Updated_Time'];

            // Append the formatted date to the input box
            document.getElementById('updatedDate').value = formattedDate;
        } else {
            console.error("No data available to fetch the last updated time.");
            document.getElementById('updatedDate').value = "No data available";
        }
    } catch (error) {
        console.error("Error fetching last updated time:", error);
        document.getElementById('updatedDate').value = "Error fetching date";
    }
}








// Initialize page
async function init() {
    await fetchData(); // Fetch and display all data initially
    await fetchLastUpdatedDate(); // Fetch and display the last updated time
}



// Run initialization
init();

//Search Item name Function
function filterTable() {
    // Get the search input value and convert it to lowercase
    const searchValue = document.getElementById('search-input').value.toLowerCase();

    // Get all table rows
    const tableBody = document.getElementById('table-body');
    const rows = tableBody.getElementsByTagName('tr');

    // Loop through all rows and hide those that don't match the search query
    for (let row of rows) {
        const itemName = row.cells[2].textContent.toLowerCase(); // Assuming 'ITEM NAME (LOT ID)' is in the third column

        if (itemName.includes(searchValue)) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    }
}

function handleEnter(event) {
    // Check if the Enter key is pressed
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        filterTable(); // Call the filter function
    }
}

// Event listener for "View All" button
document.getElementById("viewAllButton").addEventListener("click", async function() {
    await fetchData(); // Fetch all data (no department filter)
});

