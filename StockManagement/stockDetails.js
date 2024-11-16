
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

// Function to render stock details into the HTML table
// function displayStockDetails(data) {
//     const tableBody = document.getElementById("details-table-body");
//     if (!tableBody) {
//         console.error("Error: details-table-body not found in the DOM");
//         return;
//     }
//     tableBody.innerHTML = ""; // Clear existing data  <td>${row['JO ITEMS DESCRIPTION']}</td>

//     data.forEach((row, index) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//             <td>${index + 1}</td>
//             <td>${row['JO NO']}</td>
//             <td>${new Date(row['JO DATE']).toLocaleDateString()}</td>
//             <td>${row['PROCESS NAME']}</td>
          
//             <td>${row['PRODUCT']}</td>
//             <td>${row['CLR']}</td>
        
   
//             <td>${row['ITEM NAME']}</td>
           
//             <td>${row['SIZE']}</td>
//             <td>${row['QUANTITY REQ-1']}</td>
//             <td>${row['STOCK IN HAND']}</td>
//         `;
//         tableBody.appendChild(tr);
//     });
// }

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

        const tr = document.createElement("tr");
        if (isShortage) {
            tr.classList.add("table-danger"); // Add red background for rows with shortages
        }

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row['JO NO']}</td>
            <td>${new Date(row['JO DATE']).toLocaleDateString()}</td>
            <td>${row['PROCESS NAME']}</td>
            <td>${row['PRODUCT']}</td>
            <td>${row['CLR']}</td>
            <td>${row['ITEM NAME']}</td>
            <td>${row['SIZE']}</td>
            <td>${row['QUANTITY REQ-1']}</td>
            <td>${row['STOCK IN HAND']}</td>
        `;
        tableBody.appendChild(tr);
    });
}



// Run fetchStockDetails when the page loads
document.addEventListener("DOMContentLoaded", fetchStockDetails);

