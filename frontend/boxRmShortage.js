// Function to fetch data from the API and populate the table
async function fetchShortageData() {
    try {
        // Fetch data from the API
        const response = await fetch('http://localhost:5050/api/BOXRMshortage');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // Parse the JSON response
        displayShortageData(data); // Call the function to display data
    } catch (error) {
        console.error("Error fetching shortage data:", error);
        // Display an error message in the table
        const tableBody = document.getElementById("shortage-table-body");
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Failed to load shortage data. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Function to dynamically populate the table with shortage data
function displayShortageData(data) {
    const tableBody = document.getElementById("shortage-table-body");
    tableBody.innerHTML = ""; // Clear any existing rows

    data.forEach((row, index) => {
        const tr = document.createElement("tr"); // Create a new table row

        // // Ensure all values exist and avoid calling `toFixed()` on undefined or null values
          const reqValue = row.req ? row.req.toFixed(2) : "0.00"; 
            const availableValue = row.avail ? row.avail.toFixed(2) : "0.00";
            const shortageValue = row.shortage ? row.shortage.toFixed(2) : "0.00";

        tr.innerHTML = `
            <td>${index + 1}</td> <!-- Sr No -->
            <td>${row['ITEM NAME'] || "N/A"}</td> <!-- Item Name -->
            <td>${row['RM ITEM DESCRIPTION'] || "N/A"}</td> <!-- RM Item Description -->
            <td>${reqValue}</td> <!-- Required -->
            <td>${availableValue}</td> <!-- Available -->
            <td>${shortageValue}</td> <!-- Shortage -->
        `;  

        tableBody.appendChild(tr); // Append the row to the table body
    });
}


//Search Item name Function
function filterTable() {
    // Get the search input value and convert it to lowercase
    const searchValue = document.getElementById('search-input').value.toLowerCase();

    // Get all table rows
    const tableBody = document.getElementById('shortage-table-body');
    const rows = tableBody.getElementsByTagName('tr');

    // Loop through all rows and hide those that don't match the search query
    for (let row of rows) {
        const itemName = row.textContent.toLowerCase(); // Assuming 'ITEM NAME (LOT ID)' is in the third column

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

// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchShortageData);
