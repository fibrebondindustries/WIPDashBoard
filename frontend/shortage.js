// Function to fetch data from the API and populate the table
async function fetchShortageData() {
    try {
        // Fetch data from the API
        const response = await fetch('http://localhost:5050/api/RMshortage');
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
                <td colspan="5" class="text-center text-danger">
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

        tr.innerHTML = `
            <td>${index + 1}</td> <!-- Sr No -->
            <td>${row['ITEM NAME']}</td> <!-- Item Name -->
            <td>${row.req.toFixed(2)}</td> <!-- Required -->
            <td>${row.available.toFixed(2)}</td> <!-- Available -->
            <td>${row.shortage.toFixed(2)}</td> <!-- Shortage -->
       
        `;

        tableBody.appendChild(tr); // Append the row to the table body
    });
}

// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchShortageData);
