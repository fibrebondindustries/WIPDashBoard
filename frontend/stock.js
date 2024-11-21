
// Function to fetch data from the backend API and display it in the table
async function fetchStockData() {
    try {
        const response = await fetch('http://localhost:5050/api/stockData'); // Fetching data
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        processStockData(data); // Process and display the data
    } catch (error) {
        console.error("Error fetching stock data:", error);
        const tableBody = document.getElementById("stock-table-body");
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Failed to load stock data. Please try again later.
                </td>
            </tr>
        `;
    }
}

// Function to calculate the sum of Quantity_Shortage for each unique JO NO
function processStockData(data) {
    const aggregatedData = {}; // Object to store aggregated values by JO NO

    // Iterate through data to calculate the sum
    data.forEach((row) => {
        const joNo = row['JO NO'];
        const shortage = parseFloat(row['Quantity_Shortage']) || 0;

        if (!aggregatedData[joNo]) {
            aggregatedData[joNo] = {
                joNo: joNo,
                joDate: row['JO DATE'],
                quantityShortage: 0,
                status: row['STATUS'] ,
            };
        }
        aggregatedData[joNo].quantityShortage += shortage;
    });

    // Convert aggregatedData object to an array and display it
    displayStockData(Object.values(aggregatedData));
}


function formatDate(dateString) {
    // Split the date string into [day, month, year]
    const [day, month, year] = dateString.split('/').map(Number);

    // Create a new Date object using the correct order
    const parsedDate = new Date(year, month - 1, day); // Month is zero-based

    // Check if the parsed date is valid
    if (isNaN(parsedDate)) {
        return "Invalid Date";
    }

    // Format the date as DD/MM/YYYY
    const formattedDay = String(parsedDate.getDate()).padStart(2, '0'); // Ensure 2 digits
    const formattedMonth = String(parsedDate.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
    const formattedYear = parsedDate.getFullYear();

    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}




// Function to render aggregated data into the HTML table
function displayStockData(data) {
    const tableBody = document.getElementById("stock-table-body");
    tableBody.innerHTML = ""; // Clear existing data

    data.forEach((row, index) => {
        // Define the conditions for color and status
        let statusImage, statusText, statusClass;

        if (row.quantityShortage !== 0) {
            // Condition 1: Quantity_Shortage != 0
            statusImage = "red.png"; // Red image
            statusText = "Shortage";
            statusClass = "text-danger";
        } else if (row.quantityShortage === 0 && row.shortage !== 0) {
            // Condition 2: Quantity_Shortage = 0 AND shortage != 0
            statusImage = "orange.png"; // Orange image
            statusText = "Potential Shortage";
            statusClass = "text-warning";
        } else if (row.quantityShortage === 0 && row.shortage === 0) {
            // Condition 3: Quantity_Shortage = 0 AND shortage = 0
            statusImage = "green.png"; // Green image
            statusText = "Satisfied";
            statusClass = "text-success";
        }
        // Use the formatDate function to handle the JO DATE
        const formattedDate = row.joDate ? formatDate(row.joDate) : "Invalid Date";

        // Create table row dynamically
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="stockDetails.html?joNo=${encodeURIComponent(row.joNo)}">${row.joNo}</a></td>
            <td>${formattedDate}</td>
            <td>${row.quantityShortage.toFixed(2)}</td>
            <td class="d-flex align-items-center">
                <img src="./assets/Img/${statusImage}" alt="${statusText}" style="width: 20px; height: 20px; margin-right: 8px;" />
                <span class="${statusClass}">${statusText}</span>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
}

// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchStockData);
