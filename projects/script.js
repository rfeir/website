document.addEventListener('DOMContentLoaded', () => {
    // Set defaults for map operations
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let isDragging = false;
    let draggingActive = false;
    let selectedRegion = null;

    // DOM Elements
    const tooltip = document.getElementById('tooltip');
    const svgContainer = document.getElementById('svg-container');
    const dataTable = document.getElementById('data-table');
    let paths = null;

    // Load SVG and JSON data
    Promise.all([
        fetch('paths.svg').then(res => res.text()).catch(err => console.error('Error loading paths.svg:', err)),
        fetch('aggregated_data.json').then(res => res.json()).catch(err => console.error('Error loading aggregated_data.json:', err))
    ]).then(([svgContent, data]) => {
        // Initialize SVG
        svgContainer.innerHTML = svgContent;
        paths = svgContainer.querySelectorAll('path');
        initMap();

        // Populate table and slicers
        populateTable(data);
        populateSlicers(data);
        filterTable(data);
    });

    // Initialize map interactions
    function initMap() {
        const svg = svgContainer.querySelector('svg');

        // Dragging
        svgContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = true;
            draggingActive = true;
            const startX = e.clientX - offsetX;
            const startY = e.clientY - offsetY;

            svgContainer.style.cursor = 'grabbing';
            const onMouseMove = (moveEvent) => {
                offsetX = moveEvent.clientX - startX;
                offsetY = moveEvent.clientY - startY;
                svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            };

            const onMouseUp = () => {
                isDragging = false;
                draggingActive = false;
                svgContainer.style.cursor = 'default';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // Zooming
        svgContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
            scale = Math.min(Math.max(scale + zoomFactor, 0.8), 10);
            svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        });

        // Path interactions
        paths.forEach(path => {
            path.addEventListener('mouseenter', (e) => {
                if (!draggingActive) showTooltip(e, path.id);
            });

            path.addEventListener('mouseleave', hideTooltip);
            path.addEventListener('mousemove', moveTooltip);
            path.addEventListener('click', (e) => {
                toggleRegionSelection(path.id);
                e.stopPropagation();
            });
        });

        svgContainer.addEventListener('click', deselectRegion);
    }

    // Tooltip Functions
    function showTooltip(event, regionId) {
        tooltip.textContent = `Region: ${regionId}`;
        tooltip.style.display = 'block';
        moveTooltip(event);
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    function moveTooltip(event) {
        requestAnimationFrame(() => {
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
        });
    }

    // Region Selection
    function toggleRegionSelection(regionId) {
        if (selectedRegion === regionId) {
            deselectRegion();
        } else {
            selectRegion(regionId);
        }
    }

    function selectRegion(regionId) {
        selectedRegion = regionId;
        highlightRegion(regionId);
        filterTableByRegion(regionId);
    }

    function deselectRegion() {
        selectedRegion = null;
        resetRegion();
        filterTable();
    }

    function highlightRegion(regionId) {
        paths.forEach(path => {
            path.style.opacity = path.id === regionId ? '1' : '0.2';
        });
    }

    function resetRegion() {
        paths.forEach(path => {
            path.style.opacity = '1';
        });
    }

    // Populate table with data
    function populateTable(data) {
        const tableBody = dataTable.querySelector('tbody');
        tableBody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.region = item.ID;
            row.innerHTML = `
                <td>${item.STATE || ""}</td>
                <td>${item.IND || ""}</td>
                <td>${item.NATIVITY || ""}</td>
                <td>${formatCurrency(item.MEAN_WAGE)}</td>
                <td>${formatCurrency(item.MEAN_OTHER_INCOME)}</td>
                <td>${formatNumber(item.MEAN_AGE, 1)}</td>
                <td>${formatNumber(item.UNDEREMPLOYMENT_LEVEL, 2)}</td>
                <td>${formatNumber(item.EDUCATION_LEVEL, 2)}</td>
                <td>${formatNumber(item.REQUIRED_EDUCATION_LEVEL, 2)}</td>
                <td>${formatPercentage(item.NATIVITY_PERCENTAGE)}</td>
                <td>${item.ID || ""}</td>
                <td>${item.COUNTIES || ""}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function formatCurrency(value) {
        return value != null && !isNaN(value)
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
            : "";
    }

    function formatNumber(value, decimals) {
        return value != null && !isNaN(value) ? value.toFixed(decimals) : "";
    }

    function formatPercentage(value) {
        return value != null && !isNaN(value) ? (value * 100).toFixed(1) + "%" : "";
    }

    // Populate slicers
    function populateSlicers(data) {
        const indSlicer = document.getElementById('ind-slicer');
        const nativitySlicer = document.getElementById('nativity-slicer');

        const indOptions = Array.from(new Set(data.map(item => item.IND)));
        const nativityOptions = Array.from(new Set(data.map(item => item.NATIVITY)));

        addOptionsToSlicer(indSlicer, indOptions);
        addOptionsToSlicer(nativitySlicer, nativityOptions);
    }

    function addOptionsToSlicer(slicer, options) {
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            slicer.appendChild(option);
        });
    }

    // Filter Table
    function filterTable(data) {
        const indValue = document.getElementById('ind-slicer').value;
        const nativityValue = document.getElementById('nativity-slicer').value;
        const rows = dataTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const matchesInd = !indValue || row.cells[1].textContent === indValue;
            const matchesNativity = !nativityValue || row.cells[2].textContent === nativityValue;
            const matchesRegion = !selectedRegion || row.dataset.region === selectedRegion;

            row.style.display = matchesInd && matchesNativity && matchesRegion ? '' : 'none';
        });
    }

    function filterTableByRegion(regionId) {
        const rows = dataTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.display = row.dataset.region === regionId ? '' : 'none';
        });
    }

    // Sorting Functionality
    const headers = dataTable.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        let ascending = true;

        header.addEventListener('click', () => {
            sortTableByColumn(index, ascending);
            ascending = !ascending;
        });
    });

    function sortTableByColumn(columnIndex, ascending) {
        const tableBody = dataTable.querySelector('tbody');
        const rows = Array.from(tableBody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            const cellA = a.cells[columnIndex]?.textContent.trim() || '';
            const cellB = b.cells[columnIndex]?.textContent.trim() || '';
            return ascending
                ? cellA.localeCompare(cellB, undefined, { numeric: true })
                : cellB.localeCompare(cellA, undefined, { numeric: true });
        });

        tableBody.innerHTML = '';
        rows.forEach(row => tableBody.appendChild(row));
    }
});
