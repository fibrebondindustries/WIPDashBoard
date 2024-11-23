
// Function to fetch and display data for the specific JO NO
async function fetchStockDetails() {
    // Get the `joNo` from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const joNo = urlParams.get('joNo');

    if (!joNo) {
        document.getElementById("stock-details-body").innerHTML = "<tr><td colspan='7'>Invalid Job Order Number</td></tr>";
        return;
    }

    try {
        // Fetch data from the backend API for the specific JO NO
        const response = await fetch(`http://localhost:5050/api/stockData?joNo=${encodeURIComponent(joNo)}`);
        const data = await response.json();

        // Display data in the table
        displayStockDetails(data);
    } catch (error) {
        console.error("Error fetching stock details:", error);
    }
}


// Function to format date in DD/MM/YYYY
function formatDate(dateString) {
    // Check if the date is valid
    const dateParts = dateString.split('/');
    if (dateParts.length !== 3) {
        return "Invalid Date";
    }

    const [day, month, year] = dateParts.map(Number); // Split into day, month, year
    const parsedDate = new Date(year, month - 1, day); // Month is zero-based

    if (isNaN(parsedDate)) {
        return "Invalid Date"; // Return invalid if parsing fails
    }

    // Format date as DD/MM/YYYY
    const formattedDay = String(parsedDate.getDate()).padStart(2, '0');
    const formattedMonth = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const formattedYear = parsedDate.getFullYear();

    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

// Function to render stock details into the HTML table
function displayStockDetails(data) {
    const tableBody = document.getElementById("details-table-body");
    if (!tableBody) {
        console.error("Error: details-table-body not found in the DOM");
        return;
    }

    tableBody.innerHTML = ""; // Clear existing data

    data.forEach((row, index) => {
        const isShortage = row.isShortage; // Use the isShortage flag from the backend
        const shortageValue = parseFloat(row.shortage) || 0; // Ensure shortage is treated as a number

        const tr = document.createElement("tr");
        // if (isShortage) {
        //     tr.classList.add("table-danger"); // Add red background for rows with shortages
        // }
         // Apply color conditions
         if (isShortage) {
            tr.classList.add("table-danger"); // Add red background for rows with shortages
        } else if (shortageValue > 0) {
            tr.classList.add("table-warning"); // Add orange background for rows with shortage > 0
        }
        // Format the date using formatDate
        const formattedDate = row['JO DATE'] ? formatDate(row['JO DATE']) : "Invalid Date";

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row['JO NO']}</td>
            <td>${formattedDate}</td>
            <td>${row['PROCESS NAME']}</td>
            <td>${row['PRODUCT']}</td>
            <td>${row['CLR']}</td>
            <td>${row['ITEM NAME']}</td>
            <td>${row['RM ITEM DESCRIPTION']}</td> 
            <td>${row['SIZE']}</td>
            <td>${row['QUANTITY REQ-1']}</td>
            <td>${row['STOCK IN HAND']}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Run fetchStockDetails when the page loads
document.addEventListener("DOMContentLoaded", fetchStockDetails);

