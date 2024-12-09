<script>
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
            requestAnimationFrame(() => {
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            });
        }

        function toggleRegionSelection(regionId) {
            selectedRegion = selectedRegion === regionId ? null : regionId;
            if (selectedRegion) {
                highlightRegion(regionId);
                filterTableByRegion(regionId);
            } else {
                resetRegion();
                filterTable();
            }
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
                    <td>${formatCurrency(item.MEAN_WAGE)}</td>
                    <td>${formatCurrency(item.MEAN_OTHER_INCOME)}</td>
                    <td>${formatNumber(item.MEAN_AGE)}</td>
                    <td>${formatNumber(item.UNDEREMPLOYMENT_LEVEL)}</td>
                    <td>${formatNumber(item.EDUCATION_LEVEL)}</td>
                    <td>${formatNumber(item.REQUIRED_EDUCATION_LEVEL)}</td>
                    <td>${formatPercentage(item.NATIVITY_PERCENTAGE)}</td>
                    <td>${item.ID || ""}</td>
                    <td>${item.COUNTIES || ""}</td>
                `;
                table.appendChild(row);
            });
        }

        function formatCurrency(value) {
            return value != null && !isNaN(Number(value))
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value))
                : "";
        }

        function formatNumber(value) {
            return value != null && !isNaN(value) ? Number(value).toFixed(2) : "";
        }

        function formatPercentage(value) {
            return value != null && !isNaN(value) ? (Number(value) * 100).toFixed(1).replace(/\.0$/, '') + "%" : "";
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

                row.style.display = (matchesInd && matchesNativity && matchesRegion) ? '' : 'none';
            });
        }

        // Filter table based on region selection
        function filterTableByRegion(regionId) {
            const rows = document.querySelectorAll('#data-table tbody tr');
            rows.forEach(row => {
                row.style.display = row.dataset.region === regionId ? '' : 'none';
            });
        }

        // Sorting functionality
        function sortTableByColumn(columnIndex, isNumeric) {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.rows);

            rows.sort((a, b) => {
                const cellA = a.cells[columnIndex].textContent.trim() || null;
                const cellB = b.cells[columnIndex].textContent.trim() || null;

                let valA = isNumeric ? parseFloat(cellA) : cellA;
                let valB = isNumeric ? parseFloat(cellB) : cellB;

                if (isNumeric) {
                    valA = isNaN(valA) ? -Infinity : valA; 
                    valB = isNaN(valB) ? -Infinity : valB;
                } else {
                    valA = valA || ''; 
                    valB = valB || '';
                }

                return valA > valB ? 1 : valA < valB ? -1 : 0;
            });

            rows.forEach(row => tbody.appendChild(row));
        }

        const headers = dataTable.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                const isNumeric = !isNaN(parseFloat(dataTable.querySelector('tbody tr').cells[index]?.textContent || ''));
                sortTableByColumn(index, isNumeric);
            });
        });

    });
</script>