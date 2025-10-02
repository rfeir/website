// Version 6

document.addEventListener('DOMContentLoaded', () => {
    // Setting some defaults to help with operations
    let offsetX = 0;
    let offsetY = 0;let scale = 1;
    let isDragging = false;let draggingActive = false;
    let selectedRegion = null;
    let selectedRegions = new Set(); // Store selected region IDs

    // Sending to HTML
    const tooltip = document.getElementById('tooltip');
    const svgContainer = document.getElementById('svg-container');
    let paths = null;

    // Load map paths and dataframe
    fetch('pumas.svg')
        .then(response => response.text())
        .then(svgContent => {
            svgContainer.innerHTML = svgContent;
            paths = svgContainer.querySelectorAll('path');
            initMap();
        });
    fetch('aggregated_data_3.json')
        .then(response => response.json())
        .then(data => {
            populateTable(data);
            populateSlicers(data);
            filterTable(); // Apply filter on initial load
        });

    // Initialize map functionality
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

        // Zooming functionality for the SVG container
        svgContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const MIN_SCALE = 1; const MAX_SCALE = 15; // Min and Max zoom level
            // Mouse position within the container
            const rect = svgContainer.getBoundingClientRect();const mouseX = e.clientX - rect.left;const mouseY = e.clientY - rect.top;
            // Calculate zoom direction and factor
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; const newScale = Math.min(Math.max(scale * zoomFactor, MIN_SCALE), MAX_SCALE);
            // Adjust offsets to zoom relative to the mouse pointer
            const scaleRatio = newScale / scale;  offsetX = mouseX - scaleRatio * (mouseX - offsetX);  offsetY = mouseY - scaleRatio * (mouseY - offsetY);
            // Update scale and apply transformation
            scale = newScale; applyTransform(svg);
        });
        function applyTransform(svg) {
            svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            svg.style.transformOrigin = '0 0'; // Ensure zoom origin is at the top-left
        }

        // Path interaction (hover, click, etc.)
        paths.forEach(path => {
            path.addEventListener('mouseenter', (e) => {
                if (!draggingActive) showTooltip(e, path.id);
            });
            path.addEventListener('mouseleave', hideTooltip);
            path.addEventListener('mousemove', moveTooltip);
            path.addEventListener('click', (e) => {
                handleMapRegionClick(e, path.id);
                e.stopPropagation();
            });
        });

        // Handle clicks outside valid regions
        svgContainer.addEventListener('click', (e) => {
            const clickedElement = e.target;
            // Check if the click is outside a valid path
            if (!clickedElement.closest('path')) {
                deselectAllRegions(); // Reset everything when clicking outside a region
            }
        });
    }
    // Tooltip functions
    function showTooltip(event, regionId) {
        tooltip.innerHTML = `Region: ${regionId}<br><span style="font-size: 0.9em; color: #666;">Hold Shift + click to explore</span>`;
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
    
    // Map region click handling
    function handleMapRegionClick(event, regionId) {
        // Shift+Click → open URL link in new tab
        if (event.shiftKey) {
            // Find the row for this region
            const matchingRow = Array.from(document.querySelectorAll('#data-table tbody tr'))
                .find(row => row.dataset.region === regionId);

            if (matchingRow) {
                const url = matchingRow.dataset.url; // We stored this in populateTable
                if (url) {
                    window.open(url, '_blank');
                }
            }
            return; // Do not continue with selection if Shift-clicked
        }

        // Ctrl/Cmd → multi-select regions
        const isMultiSelect = event.ctrlKey || event.metaKey;

        if (isMultiSelect) {
            if (selectedRegions.has(regionId)) {
                selectedRegions.delete(regionId); // Deselect region
            } else {
                selectedRegions.add(regionId); // Add region
            }
        } else {
            if (selectedRegions.has(regionId)) {
                selectedRegions.clear(); // Deselect all regions
            } else {
                selectedRegions.clear(); // Clear previous selections
                selectedRegions.add(regionId); // Add selected region
            }
        }

        highlightSelectedRegions(); // Update map highlights
        filterTableByRegion(regionId);
    }
    
    function highlightSelectedRegions() {
        const paths = document.querySelectorAll('path');
        const selectedRegionIds = new Set(selectedRegions);
    
        paths.forEach(path => {
            const isSelected = selectedRegionIds.has(path.id);
            path.style.opacity = isSelected || selectedRegionIds.size === 0 ? '1' : '0.3';
        });
    }
    
    function updateRowSelectionFromRegions() {
        const rows = document.querySelectorAll('#data-table tbody tr');
        if (selectedRegions.size > 0) {
            // Highlight selected rows and dim unselected rows
            rows.forEach(row => {
                row.style.opacity = selectedRegions.has(row.dataset.region) ? '1' : '0.3';
            });
        } else {
            // Reset all rows to full opacity if nothing is selected
            rows.forEach(row => {
                row.style.opacity = '1';
            });
        }
    }
    function deselectAllRegions() {
        selectedRegions.clear(); // Clear all selections
        highlightSelectedRegions(); // Reset map highlights
        filterTableByRegion(); // Reset table to show all rows
    }
    // Adding an event listener for clicking on the rows
    function addRowClickListeners() {
        const rows = document.querySelectorAll('#data-table tbody tr');
        rows.forEach(row => {
            row.addEventListener('click', function (event) {
                const regionId = this.dataset.region;
                const isMultiSelect = event.ctrlKey || event.metaKey;
                    if (isMultiSelect) {
                    // Multi-select logic: toggle region in selection
                    if (selectedRegions.has(regionId)) {
                        selectedRegions.delete(regionId);
                    } else {
                        selectedRegions.add(regionId);
                    }
                } else {
                    // Single-select logic: deselect if already selected
                    if (selectedRegions.has(regionId)) {
                        selectedRegions.clear(); // Clear all selections
                    } else {
                        selectedRegions.clear(); // Clear previous selections
                        selectedRegions.add(regionId); // Select this region
                    }
                }
                // Update both map and rows after changes
                highlightSelectedRegions();
                updateRowSelectionFromRegions();
            });
        });
    }
    function resetAllRowsAndRegions() {
        const rows = document.querySelectorAll('#data-table tbody tr');
        rows.forEach(row => {
            row.style.opacity = '1'; // Reset row opacity
        });

        const paths = document.querySelectorAll('path');
        paths.forEach(path => {
            path.style.opacity = '1'; // Reset map region opacity
        });
    }
    // Populate table with data
    function populateTable(data) {
        const table = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        table.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.dataset.region = item.ID;
            row.dataset.index = index; // Add the hidden index here
	    row.dataset.url = item.URL || "";
            row.innerHTML = `
                <td>${item.STATE || ""}</td>
                <td>${item.IND || ""}</td>
                <td>${item.NATIVITY || ""}</td>
                <td data-value="${item.MEAN_WAGE}">
                    ${item.MEAN_WAGE != null && !isNaN(Number(item.MEAN_WAGE)) 
                        ? new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD', 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                        }).format(Number(item.MEAN_WAGE)) 
                        : ""}
                </td>                        
                <td data-value="${item.MEAN_OTHER_INCOME}">
                    ${item.MEAN_OTHER_INCOME != null && !isNaN(Number(item.MEAN_OTHER_INCOME)) 
                        ? new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD', 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                        }).format(Number(item.MEAN_OTHER_INCOME)) 
                        : ""}
                </td>
                <td data-value="${item.MEAN_AGE}">
                    ${item.MEAN_AGE != null && !isNaN(item.MEAN_AGE) ? Number(item.MEAN_AGE).toFixed(1) : ""}
                </td>
                <td data-value="${item.UNDEREMPLOYMENT_LEVEL}">
                    ${item.UNDEREMPLOYMENT_LEVEL != null && !isNaN(item.UNDEREMPLOYMENT_LEVEL) ? Number(item.UNDEREMPLOYMENT_LEVEL).toFixed(2) : ""}
                </td>
                <td data-value="${item.EDUCATION_LEVEL}">
                    ${item.EDUCATION_LEVEL != null && !isNaN(item.EDUCATION_LEVEL) ? Number(item.EDUCATION_LEVEL).toFixed(2) : ""}
                </td>
                <td data-value="${item.REQUIRED_EDUCATION_LEVEL}">
                    ${item.REQUIRED_EDUCATION_LEVEL != null && !isNaN(item.REQUIRED_EDUCATION_LEVEL) ? Number(item.REQUIRED_EDUCATION_LEVEL).toFixed(2) : ""}
                </td>
                <td data-value="${item.NATIVITY_PERCENTAGE}">
                    ${item.NATIVITY_PERCENTAGE != null && !isNaN(item.NATIVITY_PERCENTAGE) ? (Number(item.NATIVITY_PERCENTAGE) * 100).toFixed(1).replace(/\.0$/, '') + "%" : ""}
                </td>
                <td>${item.ID || ""}</td>
                <td>${item.COUNTIES || ""}</td>
            `;
            table.appendChild(row);
        });
        addRowClickListeners();
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
    // Apply alternating row colors
    function applyRowColors(filteredData) {
        const rows = document.querySelectorAll('#data-table tbody tr');
        let visibleRowIndex = 0; // Track the visible row index for alternating colors

        rows.forEach(row => {
            if (row.style.display !== 'none') { // Check if the row is visible
                if (visibleRowIndex % 2 === 0) {
                    row.style.backgroundColor = "rgb(235, 235, 235)"; // Light color for even rows
                } else {
                    row.style.backgroundColor = "rgb(255, 255, 255)"; // White for odd rows
                }
                visibleRowIndex++; // Increment only for visible rows
            } else {
                row.style.backgroundColor = ''; // Reset hidden rows' background
            }
        });
    }
    // Filter table by region selection
    function filterTableByRegion() {
        const indValue = document.getElementById('ind-slicer').value;
        const nativityValue = document.getElementById('nativity-slicer').value;
        const rows = document.querySelectorAll('#data-table tbody tr');
        const selectedRegionIds = new Set(selectedRegions);
    
        rows.forEach(row => {
            const rowRegion = row.dataset.region;
            const matchesInd = !indValue || row.cells[1].textContent === indValue;
            const matchesNativity = !nativityValue || row.cells[2].textContent === nativityValue;
            const isVisible = selectedRegionIds.size === 0 || selectedRegionIds.has(rowRegion);
    
            row.style.display = (isVisible && matchesInd && matchesNativity) ? '' : 'none';
        });
    
        applyRowColors(); // Reapply alternating row colors
    }
    // Define the custom colorscale
    const colorscale = [
        [0 / 11, "#fde725"],
        [1 / 11, "#c2df23"],
        [2 / 11, "#86d549"],
        [3 / 11, "#52c569"],
        [4 / 11, "#2ab07f"],
        [5 / 11, "#1e9b8a"],
        [6 / 11, "#25858e"],
        [7 / 11, "#2d708e"],
        [8 / 11, "#38588c"],
        [9 / 11, "#433e85"],
        [10 / 11, "#482173"],
        [11 / 11, "#440154"],
    ];

    // Create colors between predefined colorscale
    function interpolateColor(color1, color2, factor) {
        const c1 = parseInt(color1.slice(1), 16);const c2 = parseInt(color2.slice(1), 16);const r1 = (c1 >> 16) & 0xFF;const g1 = (c1 >> 8) & 0xFF;const b1 = c1 & 0xFF;const r2 = (c2 >> 16) & 0xFF;const g2 = (c2 >> 8) & 0xFF;const b2 = c2 & 0xFF;const r = Math.round(r1 + factor * (r2 - r1));const g = Math.round(g1 + factor * (g2 - g1));const b = Math.round(b1 + factor * (b2 - b1));
    return `rgb(${r}, ${g}, ${b})`;
    }

    // Update SVG path colors based on UNDEREMPLOYMENT_LEVEL using the new colorscale
    function updatePathColors(data) {
        paths.forEach(path => {
            const regionId = path.id;
            const underemploymentLevel = data.find(item => item.ID === regionId)?.UNDEREMPLOYMENT_LEVEL || null;
            const color = getColorForUnderemployment(underemploymentLevel);
            path.style.fill = color;
        });
    }

    // Set color on map for underemployment.
    function getColorForUnderemployment(level) {
        // Handle explicitly invalid values (null, undefined, NaN, or empty strings)
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
        // Fallback (should not be reached in normal cases)
        console.error('Unexpected scaleValue:', scaleValue);
        return '#e9e9e9';
    }
    
    // Update map color on table filter
    function filterTable() {
        const indValue = document.getElementById('ind-slicer').value;
        const nativityValue = document.getElementById('nativity-slicer').value;
        const rows = document.querySelectorAll('#data-table tbody tr');

        // Filter table rows based on slicer selection
        const filteredData = [];
        rows.forEach(row => {
            const matchesInd = !indValue || row.cells[1].textContent === indValue;
            const matchesNativity = !nativityValue || row.cells[2].textContent === nativityValue;
            const matchesRegion = !selectedRegion || row.dataset.region === selectedRegion;

            if (matchesInd && matchesNativity && matchesRegion) {
                row.style.display = ''; // Show row
                const regionId = row.dataset.region;
                filteredData.push({ ID: regionId, UNDEREMPLOYMENT_LEVEL: row.cells[6].textContent });
            } else {
                row.style.display = 'none'; // Hide row
            }
        });

        // Update map and alternating table shades with filtered data
        updatePathColors(filteredData);
        applyRowColors(filteredData);
    }

    document.getElementById('ind-slicer').addEventListener('change', filterTable);
    document.getElementById('nativity-slicer').addEventListener('change', filterTable);

    const table = document.getElementById('data-table');
    const headers = table.querySelectorAll('th');

    // Sorting function for table columns
    function sortTableByColumn(columnIndex, ascending = true) {
        const tbody = document.querySelector('#data-table tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((rowA, rowB) => {
            const valueA = rowA.cells[columnIndex]?.textContent.trim() || null;
            const valueB = rowB.cells[columnIndex]?.textContent.trim() || null;

            const parsedA = parseValue(valueA);
            const parsedB = parseValue(valueB);

            if (parsedA === parsedB) return 0;
            return (parsedA > parsedB ? 1 : -1) * (ascending ? 1 : -1);
        });

        rows.forEach((row, index) => {
            row.dataset.index = index; // Update index attribute
            tbody.appendChild(row);
        });

        applyRowColors(); // Reapply colors after sorting
    }

    // Helper function to parse values based on format
    function parseValue(value) {
        if (value === null || value === '') {
            return -Infinity;
        }

        if (/^\$\d|,\d/.test(value)) {
            return parseRawNumericValue(value);
        }

        if (/%$/.test(value)) {
            return parseFloat(value.replace('%', '')) / 100;
        }

        const rawNumber = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(rawNumber) ? value : rawNumber;
    }

    // Helper function to parse raw numeric value (currency or raw numbers)
    function parseRawNumericValue(value) {
        return parseFloat(value.replace(/[^\d.-]/g, ''));
    }
    
    // Add click listeners to headers for sorting
    document.querySelectorAll('#data-table th').forEach((header, index) => {
        let ascending = true;

        header.addEventListener('click', () => {
            sortTableByColumn(index, ascending);
            ascending = !ascending;
            updateSortIcons(header, ascending);
        });
    });

    // Function to update sort icons in the headers
    function updateSortIcons(activeHeader, ascending) {
        document.querySelectorAll('#data-table th .sort-icon').forEach(icon => {
            icon.textContent = '';
        });

        const sortIcon = activeHeader.querySelector('.sort-icon');
        if (sortIcon) {
            sortIcon.textContent = ascending ? '▼' : '▲';
        }
    }
});
