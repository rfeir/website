// Load the CSV data
d3.csv('aggregated_data.csv').then(data => {
    console.log("Loaded Data: ", data); // Log data for debugging

    // Prepare unique filters (IND and NATIVITY)
    const industries = Array.from(new Set(data.map(d => d.IND)));
    const nativities = Array.from(new Set(data.map(d => d.NATIVITY)));

    // Function to populate dropdown
    function populateDropdown(dropdown, options, defaultOptionValue) {
        options = [defaultOptionValue, ...options.filter(opt => opt !== defaultOptionValue)];
        options.sort((a, b) => a === defaultOptionValue ? -1 : a.localeCompare(b));
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            dropdown.appendChild(opt);
        });
        dropdown.value = defaultOptionValue;
    }

    // Populate dropdown filters
    populateDropdown(industryFilter, industries, 'All');
    populateDropdown(nativityFilter, nativities, 'All');

    // Render the initial map and table
    renderMap(data);
    renderTable(data);

    // Update map and table on filter change
    industryFilter.addEventListener('change', filterData);
    nativityFilter.addEventListener('change', filterData);

    function filterData() {
        const selectedIndustry = industryFilter.value;
        const selectedNativity = nativityFilter.value;

        // Filter data based on selected filters
        const filteredData = data.filter(d =>
            (selectedIndustry === 'All' || d.IND === selectedIndustry) &&
            (selectedNativity === 'All' || d.NATIVITY === selectedNativity)
        );

        renderMap(filteredData);
        renderTable(filteredData);
    }

    function renderMap(data) {
        // Create a color scale based on Underemployment Level
        const underemploymentExtent = d3.extent(data, d => +d['Underemployment Level']);
        const colorScale = d3.scaleLinear()
            .domain(underemploymentExtent)
            .range(['#ffffff', '#000000']);
    
        // Bind data and update paths for the map
        const paths = svg.selectAll('path')
            .data(data, d => d.ID); // Ensure we use 'ID' to match the paths in the map
    
        // Enter and update paths
        paths.join(
            enter => enter.append('path')
                .attr('id', d => d.ID)
                .attr('fill', d => colorScale(+d['Underemployment Level']) || '#ccc')
                .attr('stroke', 'none')
                .on('click', function (event, d) {
                    // Add click behavior to reduce opacity for unselected regions
                    svg.selectAll('path')
                        .style('opacity', p => p.ID === d.ID ? 1 : 0.5);
                }),
            update => update
                .attr('fill', d => colorScale(+d['Underemployment Level']) || '#ccc')
                .attr('stroke', 'none'),
            exit => exit.remove()
        );
    }
    
    // Function to render the table
    function renderTable(data) {
        dataTable.html(''); // Clear previous table rows
    
        data.forEach(d => {
            // Use 'N/A' or a default placeholder for missing data
            dataTable.append('tr')
                .html(`
                    <td>${d.ID || 'N/A'}</td>
                    <td>${d.State || 'N/A'}</td>
                    <td>${d.COUNTIES || 'N/A'}</td>
                    <td>${d['Underemployment Level'] || 'N/A'}</td>
                    <td>${d['Required Education Level'] || 'N/A'}</td>
                    <td>${d['Percent of Workforce'] || 'N/A'}</td>
                    <td>${d['Mean Wage'] || 'N/A'}</td>
                    <td>${d['Mean Other Income'] || 'N/A'}</td>
                    <td>${d['Mean Age'] || 'N/A'}</td>
                `);
        });
    }
    
}).catch(error => {
    console.error("Error loading the CSV: ", error); // Show any loading errors
});
