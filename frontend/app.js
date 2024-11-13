let wasDisconnected = false; // Track previous connection status

// Function to check server health
async function checkServerHealth() {
    try {
         const response = await fetch('http://localhost:5000/api/health');
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
setInterval(checkServerHealth, 5000); // Check every 5 seconds




// Fetch data from the backend
async function fetchData(department = null) {
  try {
      let url = 'http://localhost:5000/api/data';
      if (department) {
          url += `?department=${encodeURIComponent(department)}`;
      }

      const response = await fetch(url);

      // Check if the response is not OK
      if (!response.ok) {
        throw new Error("Database Connection Lost"); // Manually throw an error
    }

      const data = await response.json();
      displayData(data); // Display fetched data in the table
       // Set active card styling when a department is selected
        if (department) {
            const cards = document.querySelectorAll(".card");
            cards.forEach(card => {
                if (card.textContent.trim() === department.trim()) {
                    card.classList.add("active");
                } else {
                    card.classList.remove("active");
                }
            });
        }
  } catch (error) {
      console.error("Error fetching data:", error);
      displayErrorMessage("Database Connection Lost"); // Display error on the frontend
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
          <td>${row['DEPARTMENT']}</td>
      `;

      tableBody.appendChild(tr);
  });
}

// Setup department filter buttons
function setupDepartmentFilter(departments) {
  const filterContainer = document.getElementById("filter-container");
  filterContainer.innerHTML = ""; // Clear any existing buttons

  departments.forEach(department => {
      const button = document.createElement("button");
      button.className = "filter-btn btn btn-outline-secondary "; // Custom class for styling
      button.innerText = department;
      button.onclick = () => {
          fetchData(department);
          setActiveButton(button);
      };
      filterContainer.appendChild(button);
  });
}

// Set active button style
function setActiveButton(activeButton) {
  const buttons = document.querySelectorAll("#filter-container button");
  buttons.forEach(button => button.classList.remove("active"));
  activeButton.classList.add("active");
}

// // Scroll Left function
// function scrollLeft() {
//   const filterContainer = document.getElementById("filter-container");
//   const scrollAmount = 200;
//   filterContainer.scrollBy({
//       left: -scrollAmount,
//       behavior: 'smooth'
//   });
// }
// Scroll Left function with new name
function scrollFilterLeft() {
  const filterContainer = document.getElementById("filter-container");
  const scrollAmount = 200;
  filterContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
  });
}

// // Scroll Right function
// function scrollRight() {
//   const filterContainer = document.getElementById("filter-container");
//   const scrollAmount = 200;
//   filterContainer.scrollBy({
//     left: scrollAmount,
//       behavior: 'smooth'
//   });
// }
// Scroll Right function with new name
function scrollFilterRight() {
  const filterContainer = document.getElementById("filter-container");
  const scrollAmount = 200;
  filterContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
  });
}
// Initialize page
async function init() {
  await fetchData(); // Fetch and display all data initially

  // Generate department buttons dynamically based on available data
  const allData = await (await fetch('http://localhost:5000/api/data')).json();
  const uniqueDepartments = [...new Set(allData.map(row => row.DEPARTMENT))];
  setupDepartmentFilter(uniqueDepartments);
}

// Run initialization
init();
