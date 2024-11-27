// Load the data from the CSV file and parse it
fetch('aggregated_data.csv')
  .then(response => response.text())
  .then(data => {
    // Parse CSV into JSON
    const parsedData = parseCSV(data);

    // Populate slicer options dynamically
    populateSlicers(parsedData);

    // Filter and update the map and table based on selected slicers
    const industrySlicer = document.getElementById('industry-slicer');
    const nativitySlicer = document.getElementById('nativity-slicer');
    
    industrySlicer.addEventListener('change', () => updateMapAndTable());
    nativitySlicer.addEventListener('change', () => updateMapAndTable());

    // Initial render of map and table
    updateMapAndTable();

    // Function to parse CSV into JSON
    function parseCSV(csvText) {
      const rows = csvText.split('\n');
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        let obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index].trim();
        });
        return obj;
      });
      return data;
    }

    // Function to populate slicers with unique values from data
    function populateSlicers(data) {
      const industries = new Set();
      const nativities = new Set();
      
      data.forEach(row => {
        industries.add(row.IND);
        nativities.add(row.NATIVITY);
      });

      // Populate Industry slicer
      const industrySlicer = document.getElementById('industry-slicer');
      industries.forEach(ind => {
        const option = document.createElement('option');
        option.value = ind;
        option.textContent = ind;
        industrySlicer.appendChild(option);
      });

      // Populate Nativity slicer
      const nativitySlicer = document.getElementById('nativity-slicer');
      nativities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat;
        option.textContent = nat;
        nativitySlicer.appendChild(option);
      });
    }

    // Function to update map and table based on selected slicer values
    function updateMapAndTable() {
      const industrySelected = document.getElementById('industry-slicer').value;
      const nativitySelected = document.getElementById('nativity-slicer').value;

      // Filter data based on slicer selections
      let filteredData = parsedData.filter(row => {
        const industryMatch = industrySelected === 'All' || row.IND === industrySelected;
        const nativityMatch = nativitySelected === 'All' || row.NATIVITY === nativitySelected;
        return industryMatch && nativityMatch;
      });

      // Update map colors
      updateMapColors(filteredData);

      // Update table rows
      const tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
      tableBody.innerHTML = '';  // Clear previous rows

      filteredData.forEach(row => {
        const tr = document.createElement('tr');
        Object.keys(row).forEach(key => {
          const td = document.createElement('td');
          td.textContent = row[key] === 'null' ? 'N/A' : row[key];  // Handle nulls
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
    }

    // Function to update map path colors based on underemployment level
    function updateMapColors(filteredData) {
      const map = document.getElementById('map');
      const pathElements = map.querySelectorAll('path'); // Assuming your map uses <path> elements

      pathElements.forEach(path => {
        const id = path.getAttribute('id');
        const row = filteredData.find(d => d.ID === id);
        if (row) {
          const underemploymentLevel = parseFloat(row.UNDEREMPLOYMENT_LEVEL);
          let color;

          // Set color based on underemployment level
          if (underemploymentLevel < 0) {
            color = '#ffffff';  // White for values below 0
          } else if (underemploymentLevel > 2) {
            color = '#000000';  // Black for values above 2
          } else {
            // Gradient from white to black
            color = `rgb(${255 - Math.round(underemploymentLevel * 127.5)}, ${255 - Math.round(underemploymentLevel * 127.5)}, ${255})`; 
          }

          // Apply color to map path
          path.setAttribute('fill', color);
        }
      });
    }
  })
  .catch(error => console.error('Error loading CSV data:', error));