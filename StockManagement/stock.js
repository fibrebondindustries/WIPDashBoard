


// // Function to fetch data from the backend API and display it in the table
// async function fetchStockData() {
//     try {
//         const response = await fetch('http://localhost:5050/api/stockData'); // Fetching data
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         const data = await response.json();
//         processStockData(data); // Process and display the data
//     } catch (error) {
//         console.error("Error fetching stock data:", error);
//         const tableBody = document.getElementById("stock-table-body");
//         tableBody.innerHTML = `
//             <tr>
//                 <td colspan="5" class="text-center text-danger">
//                     Failed to load stock data. Please try again later.
//                 </td>
//             </tr>
//         `;
//     }
// }

// // Function to calculate the sum of Quantity_Shortage for each unique JO NO
// function processStockData(data) {
//     const aggregatedData = {}; // Object to store aggregated values by JO NO

//     // Iterate through data to calculate the sum
//     data.forEach((row) => {
//         const joNo = row['JO NO'];
//         const shortage = parseFloat(row['Quantity_Shortage']) || 0;

//         if (!aggregatedData[joNo]) {
//             aggregatedData[joNo] = {
//                 joNo: joNo,
//                 joDate: row['JO DATE'],
//                 quantityShortage: 0,
//                 status: row['STATUS'] || "Pending",
//             };
//         }
//         aggregatedData[joNo].quantityShortage += shortage;
//     });

//     // Convert aggregatedData object to an array and display it
//     displayStockData(Object.values(aggregatedData));
// }

// // Function to render aggregated data into the HTML table
// function displayStockData(data) {
//     const tableBody = document.getElementById("stock-table-body");
//     tableBody.innerHTML = ""; // Clear existing data

//     data.forEach((row, index) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//             <td>${index + 1}</td>
//             <td><a href="stockDetails.html?joNo=${encodeURIComponent(row.joNo)}">${row.joNo}</a></td>
//             <td>${new Date(row.joDate).toLocaleDateString()}</td>
//             <td>${row.quantityShortage.toFixed(2)}</td>
//             <td>${row.status}</td>
//         `;
//         tableBody.appendChild(tr);
//     });
// }

// // Call the fetch function when the page loads
// document.addEventListener("DOMContentLoaded", fetchStockData);


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

// Function to render aggregated data into the HTML table
// function displayStockData(data) {
//     const tableBody = document.getElementById("stock-table-body");
//     tableBody.innerHTML = ""; // Clear existing data

//     data.forEach((row, index) => {
//         const tr = document.createElement("tr");
//         const statusClass = row.quantityShortage > 0 ? "text-danger" : "text-success"; // Add color class

//         tr.innerHTML = `
//             <td>${index + 1}</td>
//             <td><a href="stockDetails.html?joNo=${encodeURIComponent(row.joNo)}">${row.joNo}</a></td>
//             <td>${new Date(row.joDate).toLocaleDateString()}</td>
//             <td>${row.quantityShortage.toFixed(2)}</td>
//             <td class="${statusClass}">
//                 ${row.quantityShortage > 0 ? "Shortage" : "Satisfyed"}
//             </td>
//         `;
//         tableBody.appendChild(tr);
//     });
// }


function displayStockData(data) {
    const tableBody = document.getElementById("stock-table-body");
    tableBody.innerHTML = ""; // Clear existing data

    data.forEach((row, index) => {
        const isShortage = row.quantityShortage > 0; // Determine if shortage exists
        const statusImage = isShortage
            ? "red.png" // Red image for shortage
            : "green.png"; // Green image for satisfied
        const statusText = isShortage ? "Shortage" : "Satisfied"; // Text for status

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="stockDetails.html?joNo=${encodeURIComponent(row.joNo)}">${row.joNo}</a></td>
            <td>${new Date(row.joDate).toLocaleDateString()}</td>
            <td>${row.quantityShortage.toFixed(2)}</td>
            <td class="d-flex align-items-center">
                <img src="Img/${statusImage}" alt="${statusText}" style="width: 20px; height: 20px; margin-right: 8px;" />
                <span class="${isShortage ? "text-danger" : "text-success"}">${statusText}</span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}


// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchStockData);
