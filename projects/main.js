document.addEventListener('DOMContentLoaded', () => {
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let isDragging = false;
    let draggingActive = false;
    let selectedRegion = null;

    const tooltip = document.getElementById('tooltip');
    const svgContainer = document.getElementById('svg-container');
    const dataTable = document.getElementById('data-table');
    let paths = null;

    fetch('paths.svg')
        .then(response => response.text())
        .then(svgContent => {
            svgContainer.innerHTML = svgContent;
            paths = svgContainer.querySelectorAll('path');
            initMap();
        })
        .catch(error => console.error('Error loading paths.svg:', error));

    fetch('aggregated_data.json')
        .then(response => response.json())
        .then(data => {
            populateTable(data);
            populateSlicers(data);
            filterTable(data);
        })
        .catch(error => console.error('Error loading aggregated_data.json:', error));

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

    function showTooltip(event, regionId) {
        tooltip.textContent = `Region: ${regionId}`;
        tooltip.style.display = 'block';
        moveTooltip(event);
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    function moveTooltip(event) {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
    }

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
        const paths = document.querySelectorAll('path');
        paths.forEach(path => {
            path.style.opacity = path.id === regionId ? '1' : '0.2';
        });
    }

    function resetRegion() {
        const paths = document.querySelectorAll('path');
        paths.forEach(path => {
            path.style.opacity = '1';
        });
    }

    // Populate table with data
    function populateTable(data) {
        const table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        table.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.region = item.ID;
            row.innerHTML = `
                <td>${item.STATE || ""}</td>
                <td>${item.IND || ""}</td>
                <td>${item.NATIVITY || ""}</td>
                <td>${item.MEAN_WAGE != null && !isNaN(Number(item.MEAN_WAGE)) 
                    ? new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD', 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                    }).format(Number(item.MEAN_WAGE)) 
                    : ""}</td>
                <td>${item.MEAN_OTHER_INCOME != null && !isNaN(Number(item.MEAN_OTHER_INCOME)) 
                    ? new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD', 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                    }).format(Number(item.MEAN_OTHER_INCOME)) 
                    : ""}</td>
                <td>${item.MEAN_AGE != null && !isNaN(item.MEAN_AGE) ? Number(item.MEAN_AGE).toFixed(1) : ""}</td>
                <td>${item.UNDEREMPLOYMENT_LEVEL != null && !isNaN(item.UNDEREMPLOYMENT_LEVEL) ? Number(item.UNDEREMPLOYMENT_LEVEL).toFixed(2) : ""}</td>
                <td>${item.EDUCATION_LEVEL != null && !isNaN(item.EDUCATION_LEVEL) ? Number(item.EDUCATION_LEVEL).toFixed(2) : ""}</td>
                <td>${item.REQUIRED_EDUCATION_LEVEL != null && !isNaN(item.REQUIRED_EDUCATION_LEVEL) ? Number(item.REQUIRED_EDUCATION_LEVEL).toFixed(2) : ""}</td>
                <td>${item.NATIVITY_PERCENTAGE != null && !isNaN(item.NATIVITY_PERCENTAGE) ? (Number(item.NATIVITY_PERCENTAGE) * 100).toFixed(1).replace(/\.0$/, '') + "%" : ""}</td>
                <td>${item.ID || ""}</td>
                <td>${item.COUNTIES || ""}</td>
            `;
            table.appendChild(row);
        });
    }

    // Populate slicers with options
    function populateSlicers(data) {
        const indSlicer = document.getElementById('ind-slicer');
        const nativitySlicer = document.getElementById('nativity-slicer');

        const indOptions = Array.from(new Set(data.map(item => item.IND)));
        const nativityOptions = Array.from(new Set(data.map(item => item.NATIVITY)));

        indOptions.forEach(ind => {
            if (ind !== 'Utilities') {
                const option = document.createElement('option');
                option.value = ind;
                option.textContent = ind;
                indSlicer.appendChild(option);
            }
        });

        nativityOptions.forEach(nativity => {
            if (nativity !== 'Domestic') {
                const option = document.createElement('option');
                option.value = nativity;
                option.textContent = nativity;
                nativitySlicer.appendChild(option);
            }
        });
    }

    // Filter table based on slicer selections
    function filterTable() {
        const indValue = document.getElementById('ind-slicer').value;
        const nativityValue = document.getElementById('nativity-slicer').value;
        const rows = document.querySelectorAll('#data-table tbody tr');

        rows.forEach(row => {
            const matchesInd = !indValue || row.cells[1].textContent === indValue;
            const matchesNativity = !nativityValue || row.cells[2].textContent === nativityValue;
            const matchesRegion = !selectedRegion || row.dataset.region === selectedRegion;

            if (matchesInd && matchesNativity && matchesRegion) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Update SVG path colors based on UNDEREMPLOYMENT_LEVEL using the new colorscale
    function updatePathColors(data) {
        const svg = document.querySelector('#svg-container svg'); // Get the SVG element
        const paths = svg.querySelectorAll('path'); // Select all path elements

        // Map the data to associate region IDs with UNDEREMPLOYMENT_LEVEL
        const underemploymentMap = data.reduce((acc, item) => {
            acc[item.ID] = item.UNDEREMPLOYMENT_LEVEL;
            return acc;
        }, {});

        // Loop over all the paths and update their color based on the data
        paths.forEach(path => {
            const regionId = path.id; // Get the ID of the current path (should match the data region ID)
            const underemploymentLevel = underemploymentMap[regionId];

            // Get the color for the level
            const color = getColorForUnderemployment(underemploymentLevel);

            // Apply the color
            path.style.fill = color;
        });
    }

    function getColorForUnderemployment(level) {
        if (level == null || isNaN(parseFloat(level))) {
            console.warn('Invalid level (null, undefined, or NaN):', level);
            return '#e9e9e9'; // Default color for missing or invalid data
        }
    
        const clampedLevel = Math.min(Math.max(level, 0), 2); // Clamp between 0 and 2
        const scaledValue = clampedLevel / 2; // Scale to 0–1
    
        for (let i = 0; i < colorscale.length - 1; i++) {
            const [start, startColor] = colorscale[i];
            const [end, endColor] = colorscale[i + 1];
            if (scaledValue >= start && scaledValue <= end) {
                const ratio = (scaledValue - start) / (end - start);
                return interpolateColor(startColor, endColor, ratio);
            }
        }
        return '#e9e9e9';
    }

    function interpolateColor(color1, color2, factor) {
        const c1 = parseInt(color1.slice(1), 16);
        const c2 = parseInt(color2.slice(1), 16);
    
        const r1 = (c1 >> 16) & 0xFF;
        const g1 = (c1 >> 8) & 0xFF;
        const b1 = c1 & 0xFF;
    
        const r2 = (c2 >> 16) & 0xFF;
        const g2 = (c2 >> 8) & 0xFF;
        const b2 = c2 & 0xFF;
    
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));
    
        return `rgb(${r}, ${g}, ${b})`;
    }
});