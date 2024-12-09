document.addEventListener('DOMContentLoaded', () => {
    const indSlicer = document.getElementById('ind-slicer');
    const nativitySlicer = document.getElementById('nativity-slicer');
    const resetFilters = document.getElementById('reset-filters');
    const table = document.getElementById('data-table');
    const tooltip = document.getElementById('tooltip');
    const svgContainer = document.getElementById('svg-container');

    let data = [];
    let paths = null;

    // Load Data and SVG
    fetch('aggregated_data.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            populateTable(data);
            populateSlicers(data);
        })
        .catch(err => console.error('Error loading data:', err));

    fetch('paths.svg')
        .then(response => response.text())
        .then(svg => {
            svgContainer.innerHTML = svg;
            paths = svgContainer.querySelectorAll('path');
        })
        .catch(err => console.error('Error loading SVG:', err));

    // Populate Table
    function populateTable(data) {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = data.map(row => `
            <tr>
                <td>${row.STATE || ''}</td>
                <td>${row.IND || ''}</td>
                <td>${row.NATIVITY || ''}</td>
                <td>${row.MEAN_WAGE || ''}</td>
                <td>${row.MEAN_OTHER_INCOME || ''}</td>
                <td>${row.MEAN_AGE || ''}</td>
                <td>${row.UNDEREMPLOYMENT_LEVEL || ''}</td>
                <td>${row.EDUCATION_LEVEL || ''}</td>
                <td>${row.REQUIRED_EDUCATION_LEVEL || ''}</td>
                <td>${row.NATIVITY_PERCENTAGE || ''}</td>
                <td>${row.ID || ''}</td>
                <td>${row.COUNTIES || ''}</td>
            </tr>
        `).join('');
    }

    // Populate Slicers
    function populateSlicers(data) {
        const industries = Array.from(new Set(data.map(item => item.IND))).sort();
        const nativities = Array.from(new Set(data.map(item => item.NATIVITY))).sort();

        populateSlicer(indSlicer, industries);
        populateSlicer(nativitySlicer, nativities);
    }

    function populateSlicer(slicer, options) {
        slicer.innerHTML = `<option value="">All</option>`;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            slicer.appendChild(opt);
        });
    }

    // Event Handlers
    resetFilters.addEventListener('click', () => {
        indSlicer.value = '';
        nativitySlicer.value = '';
        populateTable(data);
    });

    indSlicer.addEventListener('change', filterTable);
    nativitySlicer.addEventListener('change', filterTable);

    function filterTable() {
        const indValue = indSlicer.value;
        const nativityValue = nativitySlicer.value;

        const filteredData = data.filter(row => 
            (!indValue || row.IND === indValue) &&
            (!nativityValue || row.NATIVITY === nativityValue)
        );

        populateTable(filteredData);
    }
});