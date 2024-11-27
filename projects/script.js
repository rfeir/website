// Select the elements for the dropdown filters and the SVG container
const industryFilter = document.getElementById('industry');
const nativityFilter = document.getElementById('nativity');
const svg = d3.select("#mapSVG");  // Select the SVG container
const dataTable = d3.select("#dataTable tbody");

// Load the CSV data
d3.csv('aggregated_data.csv').then(data => {
    console.log("Loaded Data: ", data);  // Log the data to inspect its structure

    // 1. Populate the filters dynamically
    const industries = new Set(data.map(d => d.IND));
    const nativities = new Set(data.map(d => d.NATIVITY));

    // Populate the industry filter
    industries.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        industryFilter.appendChild(option);
    });

    // Populate the nativity filter
    nativities.forEach(nativity => {
        const option = document.createElement('option');
        option.value = nativity;
        option.textContent = nativity;
        nativityFilter.appendChild(option);
    });

    // 2. Render the initial map and table with all data
    renderMap(data);
    renderTable(data);

    // 3. Filter data and update the map and table when user changes filters
    industryFilter.addEventListener('change', filterData);
    nativityFilter.addEventListener('change', filterData);

    function filterData() {
        const selectedIndustry = industryFilter.value;
        const selectedNativity = nativityFilter.value;

        // Filter the data based on selected values
        const filteredData = data.filter(d => {
            return (
                (selectedIndustry === '' || d.IND === selectedIndustry) &&
                (selectedNativity === '' || d.NATIVITY === selectedNativity)
            );
        });

        renderMap(filteredData);  // Update map with filtered data
        renderTable(filteredData); // Update table with filtered data
    }

    // Function to render map
    function renderMap(data) {
        // Remove previous map data
        svg.selectAll('path').style('fill', '#ccc').style('stroke', '#000');  // Reset styles

        svg.selectAll('path')  // Select all path elements in the SVG
            .data(data)  // Bind data to the SVG elements
            .join('path')  // Join the data to the path elements
            .attr('id', d => d.ID)  // Bind the ID from the CSV data to the path elements
            .attr('fill', '#ccc')  // Default fill color
            .attr('stroke', '#000')  // Default stroke color
            .on('click', function(event, d) {
                // Add a click event to filter the table or map based on the ID clicked
                console.log("Clicked on: ", d);
            });
    }

    // Function to render the table
    function renderTable(data) {
        dataTable.html('');  // Clear previous table rows

        data.forEach(d => {
            dataTable.append('tr')
                .html(`
                    <td>${d.IND}</td>
                    <td>${d.NATIVITY}</td>
                    <td>${d.additionalData}</td>  <!-- Replace 'additionalData' with real column name -->
                `);
        });
    }
}).catch(error => {
    console.error("Error loading the CSV: ", error);
});