// ---------- STATE MAPPING ----------
const stateMap = {
  "1":"01","01":"01","al":"01","AL":"01","alabama":"01","Alabama":"01",
  "2":"02","02":"02","ak":"02","AK":"02","alaska":"02","Alaska":"02",
  "4":"04","04":"04","az":"04","AZ":"04","arizona":"04","Arizona":"04",
  "5":"05","05":"05","ar":"05","AR":"05","arkansas":"05","Arkansas":"05",
  "6":"06","06":"06","ca":"06","CA":"06","california":"06","California":"06",
  "8":"08","08":"08","co":"08","CO":"08","colorado":"08","Colorado":"08",
  "9":"09","09":"09","ct":"09","CT":"09","connecticut":"09","Connecticut":"09",
  "10":"10","de":"10","DE":"10","delaware":"10","Delaware":"10",
  "11":"11","dc":"11","DC":"11","District of Columbia":"11",
  "12":"12","fl":"12","FL":"12","florida":"12","Florida":"12",
  "13":"13","ga":"13","GA":"13","georgia":"13","Georgia":"13",
  "15":"15","hi":"15","HI":"15","hawaii":"15","Hawaii":"15",
  "16":"16","id":"16","ID":"16","idaho":"16","Idaho":"16",
  "17":"17","il":"17","IL":"17","illinois":"17","Illinois":"17",
  "18":"18","in":"18","IN":"18","indiana":"18","Indiana":"18",
  "19":"19","ia":"19","IA":"19","iowa":"19","Iowa":"19",
  "20":"20","ks":"20","KS":"20","kansas":"20","Kansas":"20",
  "21":"21","ky":"21","KY":"21","kentucky":"21","Kentucky":"21",
  "22":"22","la":"22","LA":"22","louisiana":"22","Louisiana":"22",
  "23":"23","me":"23","ME":"23","maine":"23","Maine":"23",
  "24":"24","md":"24","MD":"24","maryland":"24","Maryland":"24",
  "25":"25","ma":"25","MA":"25","massachusetts":"25","Massachusetts":"25",
  "26":"26","mi":"26","MI":"26","michigan":"26","Michigan":"26",
  "27":"27","mn":"27","MN":"27","minnesota":"27","Minnesota":"27",
  "28":"28","ms":"28","MS":"28","mississippi":"28","Mississippi":"28",
  "29":"29","mo":"29","MO":"29","missouri":"29","Missouri":"29",
  "30":"30","mt":"30","MT":"30","montana":"30","Montana":"30",
  "31":"31","ne":"31","NE":"31","nebraska":"31","Nebraska":"31",
  "32":"32","nv":"32","NV":"32","nevada":"32","Nevada":"32",
  "33":"33","nh":"33","NH":"33","new hampshire":"33","New Hampshire":"33",
  "34":"34","nj":"34","NJ":"34","new jersey":"34","New Jersey":"34",
  "35":"35","nm":"35","NM":"35","new mexico":"35","New Mexico":"35",
  "36":"36","ny":"36","NY":"36","new york":"36","New York":"36",
  "37":"37","nc":"37","NC":"37","north carolina":"37","North Carolina":"37",
  "38":"38","nd":"38","ND":"38","north dakota":"38","North Dakota":"38",
  "39":"39","oh":"39","OH":"39","ohio":"39","Ohio":"39",
  "40":"40","ok":"40","OK":"40","oklahoma":"40","Oklahoma":"40",
  "41":"41","or":"41","OR":"41","oregon":"41","Oregon":"41",
  "42":"42","pa":"42","PA":"42","pennsylvania":"42","Pennsylvania":"42",
  "44":"44","ri":"44","RI":"44","rhode island":"44","Rhode Island":"44",
  "45":"45","sc":"45","SC":"45","south carolina":"45","South Carolina":"45",
  "46":"46","sd":"46","SD":"46","south dakota":"46","South Dakota":"46",
  "47":"47","tn":"47","TN":"47","tennessee":"47","Tennessee":"47",
  "48":"48","tx":"48","TX":"48","texas":"48","Texas":"48",
  "49":"49","ut":"49","UT":"49","utah":"49","Utah":"49",
  "50":"50","vt":"50","VT":"50","vermont":"50","Vermont":"50",
  "51":"51","va":"51","VA":"51","virginia":"51","Virginia":"51",
  "53":"53","wa":"53","WA":"53","washington":"53","Washington":"53",
  "54":"54","wv":"54","WV":"54","west virginia":"54","West Virginia":"54",
  "55":"55","wi":"55","WI":"55","wisconsin":"55","Wisconsin":"55",
  "56":"56","wy":"56","WY":"56","wyoming":"56","Wyoming":"56"
};

const stateAbbrevMap = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY"
};

// ---------- PREBUILT SCALES ----------
const PREBUILT_SCALES = {
  ndsuEmrld: [
    "#E8F5F1",
    "#BFE3D6",
    "#7FC6AD",
    "#3E9E80",
    "#0A5640"
  ],
  viridis: [
    "#440154","#3b528b","#21918c","#5ec962","#fde725"
  ],
  cividis: [
    "#00204c","#424086","#7c7b78","#bcbf59","#ffffe0"
  ]
};

let CURRENT_SCALE = [];
let CURRENT_MIN = null;
let CURRENT_MAX = null;

// ---------- HELPERS ----------
function parseCSV(text) {
  const rows = text.trim().split("\n").map(r => r.split(","));
  const header = rows.shift();
  const colState = header.findIndex(h => h.toLowerCase().includes("state"));
  const colVal = 1;
  return rows.map(r => ({ state: r[colState].trim(), value: parseFloat(r[colVal]) }));
}

function interpolateColor(c1, c2, t) {
  const a = c1.match(/\w\w/g).map(x => parseInt(x,16));
  const b = c2.match(/\w\w/g).map(x => parseInt(x,16));
  const c = a.map((x,i)=>Math.round(x+(b[i]-x)*t));
  return `#${c.map(x=>x.toString(16).padStart(2,"0")).join("")}`;
}

function interpolateMultiStop(colors, t) {
  const n = colors.length - 1;
  const scaled = t * n;
  const index = Math.floor(scaled);
  const localT = scaled - index;
  if (index >= n) return colors[n];
  return interpolateColor(colors[index], colors[index + 1], localT);
}

// ---------- MAIN ----------
document.getElementById("updateMap").addEventListener("click", () => {

  const fileInput = document.getElementById("csvFile");
  if (!fileInput.files.length) return alert("Please select a data file.");

  const file = fileInput.files[0];
  const reader = new FileReader();
  const ext = file.name.split(".").pop().toLowerCase();

  reader.onload = (e) => {

    let dataText = "";

    if (ext === "xlsx" || ext === "xls") {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      dataText = json.map(row => row.join(",")).join("\n");
    } else {
      dataText = e.target.result;
    }

    const data = parseCSV(dataText).filter(d => !isNaN(d.value));
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const svgDoc = document.getElementById("usMap").contentDocument;
    if (!svgDoc) return alert("SVG not loaded yet.");

    const scaleMode = document.getElementById("scaleMode").value;
    let activeScale;

    if (scaleMode === "prebuilt") {
      activeScale = PREBUILT_SCALES[
        document.getElementById("prebuiltScale").value
      ];
    } else {
      activeScale = [
        document.getElementById("lowColor").value,
        document.getElementById("highColor").value
      ];
    }

    CURRENT_SCALE = activeScale;
    CURRENT_MIN = min;
    CURRENT_MAX = max;
    
    data.forEach(d => {
      const id = stateMap[d.state];
      const el = id && svgDoc.getElementById(id);
      if (el) {
        const t = (d.value - min) / (max - min || 1);
        el.style.fill = interpolateMultiStop(activeScale, t);
        el.dataset.value = d.value;
      }
    });

    // ---------- LEGEND ----------
    const legend = document.createElement("div");
    legend.className = "legend";
    legend.style.background =
      `linear-gradient(to right, ${activeScale.join(",")})`;

    const minLabel = document.createElement("div");
    minLabel.className = "legend-label";
    minLabel.style.left = "0";
    minLabel.textContent = min.toFixed(2);

    const maxLabel = document.createElement("div");
    maxLabel.className = "legend-label";
    maxLabel.style.right = "0";
    maxLabel.textContent = max.toFixed(2);

    legend.appendChild(minLabel);
    legend.appendChild(maxLabel);

    const container = document.getElementById("legendContainer");
    container.innerHTML = "";
    container.appendChild(legend);

    plotStateLabels(data);

    // Auto-apply border after update
    document.getElementById("applyBorder").click();
  };

  if (ext === "xlsx" || ext === "xls")
    reader.readAsBinaryString(file);
  else
    reader.readAsText(file);
});

// ---------- BORDER STROKE ----------
document.getElementById("applyBorder").addEventListener("click", () => {

  const svgDoc = document.getElementById("usMap").contentDocument;
  if (!svgDoc) return alert("SVG not loaded yet.");

  const widthPt =
    parseFloat(document.getElementById("borderWidth").value) || 0;

  const borderColor =
    document.getElementById("borderColor")?.value || "#000000";

  svgDoc.querySelectorAll("path[id]").forEach(path => {
    if (/^[0-9]{2}$/.test(path.id)) {
      path.style.strokeWidth = `${widthPt}pt`;
      path.style.stroke = borderColor;
      path.style.vectorEffect = "non-scaling-stroke";
    }
  });
});

// ---------- TEXT LABEL PLOTTING ----------

function formatValue(val) {
  const format = document.getElementById("valueFormat")?.value || "number";
  const decimals = parseInt(document.getElementById("decimalPlaces")?.value || 2);

  if (val === "" || val === null || isNaN(val)) return "";

  switch (format) {

    case "integer":
      return Math.round(val);

    case "percent":
      return (val * 100).toFixed(decimals) + "%";

    case "currency":
      return "$" + Number(val).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

    case "none":
      return "";

    default:
      return Number(val).toFixed(decimals);
  }
}

function plotStateLabels(data) {

  const svgDoc = document.getElementById("usMap").contentDocument;
  if (!svgDoc) return alert("SVG not loaded yet.");

  const font = document.getElementById("fontSelect")?.value || "sans-serif";
  const baseSize = parseFloat(document.getElementById("fontSize")?.value || 10);

  const bottomRight = ["VT"];
  const leftAlign = ["NH","MA","RI","CT","NJ","DE","MD","DC"];

  svgDoc.querySelectorAll(".state-label").forEach(el => el.remove());

  data.forEach(d => {

    const id = stateMap[d.state];
    if (!id) return;

    const abbrev = stateAbbrevMap[id] || id;
    const point = svgDoc.getElementById(id + "p");
    if (!point) return;

    const cx = parseFloat(point.getAttribute("cx"));
    const cy = parseFloat(point.getAttribute("cy"));
    const val = formatValue(d.value);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("state-label");

    const lineSpacing = baseSize * 1;

    // LEFT-ALIGNED STATES
    if (leftAlign.includes(abbrev)) {

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      text.setAttribute("font-family", font);
      text.setAttribute("font-size", baseSize);
      text.setAttribute("text-anchor", "start");
      text.setAttribute("alignment-baseline", "middle");

      text.setAttribute("x", cx + baseSize * 0.5);
      text.setAttribute("y", cy);

      text.textContent = `${abbrev}  ${val}`;
      group.appendChild(text);
    }

    // VERMONT SPECIAL CASE
    else if (bottomRight.includes(abbrev)) {

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      text.setAttribute("font-family", font);
      text.setAttribute("font-size", baseSize);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("alignment-baseline", "bottom");

      text.setAttribute("x", cx - baseSize * 0.2);
      text.setAttribute("y", cy - baseSize * 0.2);

      text.textContent = `${abbrev}  ${val}`;
      group.appendChild(text);
    }

    // DEFAULT TWO-LINE CENTER
    else {

      const text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");

      [text1, text2].forEach(t => {
        t.setAttribute("font-family", font);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("alignment-baseline", "middle");
      });

      text1.setAttribute("x", cx);
      text2.setAttribute("x", cx);

      text1.setAttribute("y", cy - lineSpacing / 2);
      text2.setAttribute("y", cy + lineSpacing / 2);

      text1.setAttribute("font-size", baseSize);
      text2.setAttribute("font-size", baseSize - 0.5);

      text1.textContent = abbrev;
      text2.textContent = val;

      group.appendChild(text1);
      group.appendChild(text2);
    }

    svgDoc.documentElement.appendChild(group);
  });
}

function appendLegendToSVG(svgEl) {

  if (!CURRENT_SCALE.length) return;

  const legendWidth = 240;
  const legendHeight = 20;
  const legendX = 30;
  const legendY = 30;

  const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  legendGroup.setAttribute("id", "exportLegend");

  // ---- Gradient Definition ----
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");

  linearGradient.setAttribute("id", "legendGradient");
  linearGradient.setAttribute("x1", "0%");
  linearGradient.setAttribute("x2", "100%");
  linearGradient.setAttribute("y1", "0%");
  linearGradient.setAttribute("y2", "0%");

  CURRENT_SCALE.forEach((color, i) => {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", `${(i/(CURRENT_SCALE.length-1))*100}%`);
    stop.setAttribute("stop-color", color);
    linearGradient.appendChild(stop);
  });

  defs.appendChild(linearGradient);
  svgEl.appendChild(defs);

  // ---- Gradient Rectangle ----
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", legendX);
  rect.setAttribute("y", legendY);
  rect.setAttribute("width", legendWidth);
  rect.setAttribute("height", legendHeight);
  rect.setAttribute("fill", "url(#legendGradient)");
  rect.setAttribute("stroke", "#000");
  rect.setAttribute("stroke-width", "0.5");

  legendGroup.appendChild(rect);

  // ---- Min Label ----
  const minText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  minText.setAttribute("x", legendX);
  minText.setAttribute("y", legendY + legendHeight + 15);
  minText.setAttribute("font-size", "12");
  minText.setAttribute("text-anchor", "start");
  minText.textContent = CURRENT_MIN.toFixed(2);

  legendGroup.appendChild(minText);

  // ---- Max Label ----
  const maxText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  maxText.setAttribute("x", legendX + legendWidth);
  maxText.setAttribute("y", legendY + legendHeight + 15);
  maxText.setAttribute("font-size", "12");
  maxText.setAttribute("text-anchor", "end");
  maxText.textContent = CURRENT_MAX.toFixed(2);

  legendGroup.appendChild(maxText);

  svgEl.appendChild(legendGroup);
}
// ---------- EXPORTS ----------

function downloadSVG() {
  const svgDoc = document.getElementById("usMap").contentDocument;
  if (!svgDoc) return;

  const svgEl = svgDoc.documentElement.cloneNode(true);

  appendLegendToSVG(svgEl);

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], {type: "image/svg+xml"});

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "map.svg";
  link.click();
}

function downloadPNG() {
  const svgDoc = document.getElementById("usMap").contentDocument;
  if (!svgDoc) return;

  const svgEl = svgDoc.documentElement.cloneNode(true);
  appendLegendToSVG(svgEl);

  const svgData = new XMLSerializer().serializeToString(svgEl);

  const targetDPI = 600;
  const baseDPI = 96;
  const scale = targetDPI / baseDPI;

  const vb = svgEl.viewBox.baseVal;
  const width = vb.width * scale;
  const height = vb.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = function() {
    ctx.drawImage(img, 0, 0, width, height);
    const a = document.createElement("a");
    a.download = "map_600dpi.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

async function downloadPDF() {
  const svgDoc = document.getElementById("usMap").contentDocument;
  if (!svgDoc) return;

  const svgEl = svgDoc.documentElement.cloneNode(true);
  appendLegendToSVG(svgEl);

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  await svg2pdf(svgEl, pdf, {
    xOffset: 10,
    yOffset: 10,
    scale: Math.min(
      width / svgEl.viewBox.baseVal.width,
      height / svgEl.viewBox.baseVal.height
    )
  });

  pdf.save("map_vector.pdf");
}

// Attach buttons
document.getElementById("downloadSVG").onclick = downloadSVG;
document.getElementById("downloadPNG").onclick = downloadPNG;
document.getElementById("downloadPDF").onclick = downloadPDF;

