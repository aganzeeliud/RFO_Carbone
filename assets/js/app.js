// Configuration & Constants
const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };
const YEARS = Array.from({length: 26}, (_, i) => 2001 + i);

// Helper to get Plotly Layout based on current theme
function getPlotlyLayout(title, yaxisTitle, isDual = false) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const layout = {
        title: { text: title, font: { family: 'Inter', size: 16, color: textColor, weight: 'bold' } },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { 
            title: 'Year', 
            gridcolor: gridColor, 
            tickfont: { color: textColor },
            titlefont: { color: textColor }
        },
        yaxis: { 
            title: yaxisTitle, 
            gridcolor: gridColor, 
            tickfont: { color: textColor },
            titlefont: { color: textColor }
        },
        margin: { t: 50, b: 50, l: 50, r: 50 },
        legend: { font: { color: textColor }, orientation: 'h', y: -0.2 }
    };

    if (isDual) {
        layout.yaxis2 = {
            title: '',
            overlaying: 'y',
            side: 'right',
            showgrid: false,
            tickfont: { color: textColor }
        };
    }

    return layout;
}

// Data Fetching
async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        return rows.filter(row => row.trim() !== '').map(row => {
            const cols = row.split(',');
            return {
                year: parseInt(cols[0]),
                carbon_sequestration_mtco2e: parseFloat(cols[1] || 0),
                forest_loss_hectares: parseFloat(cols[2] || 0),
                biomass_density_mgha: parseFloat(cols[3] || 0),
                carbon_stock_gtc: parseFloat(cols[4] || 0),
                co2_equivalent_tons: parseFloat(cols[5] || 0),
                status: cols[6],
                avoided_emissions_tCO2e: parseFloat(cols[7] || 0),
                cumulative_avoided_tCO2e: parseFloat(cols[8] || 0)
            };
        });
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// Chart Initializers for Dashboard
async function initCarbonChart(id) {
    const dataPath = window.location.pathname.includes('dashboard') ? '../assets/data/Carbone_db.csv' : 'assets/data/Carbone_db.csv';
    const data = await fetchCSV(dataPath);
    if (!data.length) return;

    const trace = {
        x: data.map(d => d.year),
        y: data.map(d => d.carbon_sequestration_mtco2e),
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#2ecc71', width: 3 },
        name: 'Sequestration'
    };
    Plotly.newPlot(id, [trace], getPlotlyLayout('Carbon Sequestration Trend', 'MtCO2e'), PLOTLY_CONFIG);
}

async function initLossChart(id) {
    const dataPath = window.location.pathname.includes('dashboard') ? '../assets/data/Carbone_db.csv' : 'assets/data/Carbone_db.csv';
    const data = await fetchCSV(dataPath);
    if (!data.length) return;

    const trace = {
        x: data.map(d => d.year),
        y: data.map(d => d.forest_loss_hectares),
        type: 'bar',
        marker: { color: '#e74c3c' },
        name: 'Forest Loss'
    };
    Plotly.newPlot(id, [trace], getPlotlyLayout('Annual Forest Loss', 'Hectares'), PLOTLY_CONFIG);
}

function initEvolutionTrend(chartId, resumeId, sliderId, yearId) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    slider.addEventListener('input', async (e) => {
        const year = e.target.value;
        document.getElementById(yearId).innerText = year;
        
        const dataPath = '../assets/data/Carbone_db.csv';
        const data = await fetchCSV(dataPath);
        const yearData = data.find(d => d.year == year);
        
        if (yearData) {
            document.getElementById(resumeId).innerHTML = `
                <strong>Sequestration:</strong> ${yearData.carbon_sequestration_mtco2e} MtCO2e<br>
                <strong>Forest Loss:</strong> ${yearData.forest_loss_hectares} ha<br>
                <strong>Status:</strong> ${yearData.status}
            `;
        }
    });
}

// GHG Intelligence Module
async function initGHGModule() {
    const dataPath = window.location.pathname.includes('dashboard') || window.location.pathname.includes('pages') || window.location.pathname.includes('maps') ? '../assets/data/Carbone_db.csv' : 'assets/data/Carbone_db.csv';
    const data = await fetchCSV(dataPath);
    if (!data.length) return;

    // Update Global KPIs
    const latest = data[data.length - 1];
    const totalAvoided = latest.cumulative_avoided_tCO2e;
    
    const updateEl = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };

    updateEl('mainSequestration', latest.carbon_sequestration_mtco2e.toFixed(1) + 'M');
    updateEl('mainAvoided', (latest.avoided_emissions_tCO2e / 1000000).toFixed(1) + 'M');
    updateEl('totalAvoidedCounter', (totalAvoided / 1000000).toFixed(2) + 'M');
    updateEl('carsRemovedCounter', (totalAvoided / 4.6 / 1000000).toFixed(1) + 'M');
    updateEl('householdsCounter', (totalAvoided / 5.4 / 1000).toFixed(0) + 'K');
    updateEl('forestConservedCounter', (data.reduce((sum, r) => sum + (6000 - r.forest_loss_hectares), 0) / 1000).toFixed(1) + 'K');

    // Initialize Charts
    if(document.getElementById('avoidedEmissionsChart')) renderAvoidedChart('avoidedEmissionsChart', data);
    if(document.getElementById('cumulativeEmissionsChart')) renderCumulativeChart('cumulativeEmissionsChart', data);
}

// Standalone GHG Module
async function initGHGStandalone() {
    const dataPath = 'assets/data/Carbone_db.csv';
    const data = await fetchCSV(dataPath);
    if (!data.length) return;

    const latest = data[data.length - 1];
    const totalAvoided = latest.cumulative_avoided_tCO2e;
    const avgAvoided = data.reduce((sum, r) => sum + r.avoided_emissions_tCO2e, 0) / data.length;

    const updateEl = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };

    updateEl('mainAvoidedLarge', (totalAvoided / 1000000).toFixed(2) + 'M');
    updateEl('annualAverageAvoided', (avgAvoided / 1000000).toFixed(2) + 'M');
    updateEl('carsLarge', (totalAvoided / 4.6 / 1000000).toFixed(1) + 'M');
    updateEl('homesLarge', (totalAvoided / 5.4 / 1000).toFixed(0) + 'K');
    updateEl('forestLarge', (data.reduce((sum, r) => sum + (6000 - r.forest_loss_hectares), 0) / 1000).toFixed(1) + 'K');

    renderAvoidedChart('detailedAvoidedChart', data);
    renderCumulativeChart('detailedCumulativeChart', data);
}

function renderAvoidedChart(id, data) {
    const trace = {
        x: data.map(d => d.year),
        y: data.map(d => d.avoided_emissions_tCO2e),
        type: 'bar',
        marker: { color: '#2d5a27', line: { color: '#d4af37', width: 1 } },
        name: 'Avoided Emissions'
    };
    Plotly.newPlot(id, [trace], getPlotlyLayout('Annual Avoided Emissions', 'tCO2e'), PLOTLY_CONFIG);
}

function renderCumulativeChart(id, data) {
    const trace = {
        x: data.map(d => d.year),
        y: data.map(d => d.cumulative_avoided_tCO2e),
        type: 'scatter',
        mode: 'lines+markers',
        fill: 'tozeroy',
        line: { color: '#d4af37', width: 3 },
        marker: { size: 6, color: '#1a4314' },
        name: 'Cumulative Impact'
    };
    Plotly.newPlot(id, [trace], getPlotlyLayout('Climate Contribution Trend', 'Total tCO2e'), PLOTLY_CONFIG);
}

// Regional Benchmarking
function initComparisonChart(id) {
    const years = Array.from({length: 26}, (_, i) => 2001 + i);
    const okapiData = [13.2, 13.4, 13.3, 13.5, 13.6, 13.8, 13.7, 13.9, 14.0, 14.1, 14.2, 14.0, 14.1, 14.3, 14.4, 14.2, 14.5, 14.5, 14.8, 14.4, 15.1, 14.9, 15.5, 15.2, 15.8, 16.2]; 
    const regionalData = [1100, 1080, 1050, 1020, 1000, 980, 950, 920, 890, 850, 820, 790, 760, 740, 710, 680, 650, 630, 610, 600, 595, 590, 585, 580, 575, 570];

    const trace1 = {
        x: years, y: okapiData, name: 'Okapi Reserve',
        type: 'scatter', mode: 'lines+markers',
        line: { color: '#2d5a27', width: 4 }
    };
    const trace2 = {
        x: years, y: regionalData, name: 'Congo Basin',
        type: 'scatter', mode: 'lines',
        line: { color: '#d4af37', dash: 'dot', width: 2 },
        yaxis: 'y2'
    };

    Plotly.newPlot(id, [trace1, trace2], getPlotlyLayout('Regional Efficiency Benchmark', 'MtCO2e', true), PLOTLY_CONFIG);
}

// Soil & Forest Type Analytics
async function fetchSoilData(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        return rows.filter(row => row.trim() !== '').map(row => {
            const cols = row.split(',');
            return {
                category: cols[0],
                area: parseFloat(cols[1]),
                carbon: parseFloat(cols[2])
            };
        });
    } catch (e) { return []; }
}

async function fetchForestTypeData(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        return rows.filter(row => row.trim() !== '').map(row => {
            const cols = row.split(',');
            return {
                type: cols[0],
                density: parseFloat(cols[1]),
                percentage: parseFloat(cols[2])
            };
        });
    } catch (e) { return []; }
}

async function initSoilCharts() {
    const isLocal = window.location.pathname.includes('pages');
    const soilPath = isLocal ? '../assets/data/soil_occupation.csv' : 'assets/data/soil_occupation.csv';
    const forestPath = isLocal ? '../assets/data/forest_types.csv' : 'assets/data/forest_types.csv';
    
    const soilData = await fetchSoilData(soilPath);
    const forestData = await fetchForestTypeData(forestPath);

    if (document.getElementById('soilOccupationChart')) {
        const trace = {
            type: 'treemap',
            labels: soilData.map(d => d.category),
            parents: soilData.map(() => ""),
            values: soilData.map(d => d.area),
            textinfo: "label+value+percent parent",
            marker: { colorscale: 'Greens' },
            pathbar: { visible: false }
        };
        const layout = getPlotlyLayout('Soil Occupation Hierarchy', '');
        layout.margin = { t: 30, l: 10, r: 10, b: 10 };
        Plotly.newPlot('soilOccupationChart', [trace], layout, PLOTLY_CONFIG);
    }

    if (document.getElementById('soilCarbonChart')) {
        const trace = {
            y: soilData.map(d => d.category),
            x: soilData.map(d => d.carbon),
            type: 'bar',
            orientation: 'h',
            marker: {
                color: soilData.map(d => d.carbon),
                colorscale: 'Viridis',
                line: { color: '#d4af37', width: 1 }
            }
        };
        const layout = getPlotlyLayout('Carbon Stock by Category', 'tC');
        layout.xaxis.title = 'Total Carbon (tC)';
        layout.yaxis.title = '';
        Plotly.newPlot('soilCarbonChart', [trace], layout, PLOTLY_CONFIG);
    }

    if (document.getElementById('forestTypeChart')) {
        const trace = {
            type: 'barpolar',
            r: forestData.map(d => d.density),
            theta: forestData.map(d => d.type),
            name: 'Density',
            marker: { color: '#2ecc71', line: { color: 'white' }, opacity: 0.8 },
        };
        const layout = getPlotlyLayout('Forest Carbon Density Polar Analysis', '');
        layout.polar = {
            radialaxis: { visible: true, side: 'counterclockwise', showline: true, tickfont: { size: 10 } },
            angularaxis: { tickfont: { size: 11 } }
        };
        Plotly.newPlot('forestTypeChart', [trace], layout, PLOTLY_CONFIG);
    }
}

// Congo Basin Comparison Module
async function initCongoBasinModule() {
    const data = await fetchCSV('assets/data/Carbone_db.csv');
    if (!data.length) return;

    const years = data.map(d => d.year);
    const okapiSeq = data.map(d => d.carbon_sequestration_mtco2e);
    const okapiStock = data.map(d => d.carbon_stock_gtc);
    const okapiAvoided = data.map(d => d.avoided_emissions_tCO2e);

    // Simulated Basin Data (Normalized for comparison)
    const basinSeq = okapiSeq.map(v => v * 60 + (Math.random() - 0.5) * 50);
    const basinStock = okapiStock.map(v => v * 120 + (Math.random() - 0.5) * 2);
    const basinAvoided = okapiAvoided.map(v => v * 40 + (Math.random() - 0.5) * 100000);

    const commonLayout = (title, ytitle, isDual = false) => getPlotlyLayout(title, ytitle, isDual);

    // Sequestration Chart
    Plotly.newPlot('sequestrationComparisonChart', [
        { x: years, y: okapiSeq, name: 'Okapi (MtCO2e)', line: { color: '#2ecc71', width: 4 } },
        { x: years, y: basinSeq, name: 'Congo Basin (MtCO2e)', line: { color: '#d4af37', dash: 'dot' }, yaxis: 'y2' }
    ], commonLayout('Sequestration Comparison', 'Okapi MtCO2e', true), PLOTLY_CONFIG);

    // Storage Chart
    Plotly.newPlot('storageComparisonChart', [
        { x: years, y: okapiStock, name: 'Okapi Stock (GtC)', type: 'bar', marker: { color: '#27ae60' } },
        { x: years, y: basinStock, name: 'Basin Stock (GtC)', type: 'scatter', mode: 'lines', line: { color: '#f1c40f' }, yaxis: 'y2' }
    ], commonLayout('Carbon Storage Comparison', 'Okapi GtC', true), PLOTLY_CONFIG);

    // Avoided Emissions Chart
    Plotly.newPlot('avoidedComparisonChart', [
        { x: years, y: okapiAvoided, name: 'Okapi Avoided (tCO2e)', fill: 'tozeroy', line: { color: '#3498db' } },
        { x: years, y: basinAvoided, name: 'Basin Avoided (tCO2e)', line: { color: '#e67e22', dash: 'dash' }, yaxis: 'y2' }
    ], commonLayout('Avoided Emissions Performance', 'Okapi tCO2e', true), PLOTLY_CONFIG);

    // Prediction Chart (5-Year)
    const futureYears = [2027, 2028, 2029, 2030, 2031];
    const okapiPred = [16.5, 16.8, 17.2, 17.5, 17.9];
    const basinPred = [1050, 1065, 1080, 1095, 1110];

    Plotly.newPlot('predictionChart', [
        { x: futureYears, y: okapiPred, name: 'Okapi Projection (MtCO2e)', mode: 'lines+markers', line: { color: '#2ecc71', width: 5 } },
        { x: futureYears, y: basinPred, name: 'Basin Projection (MtCO2e)', mode: 'lines+markers', line: { color: '#d4af37', dash: 'dot' }, yaxis: 'y2' }
    ], commonLayout('5-Year Climate Impact Forecast', 'Okapi MtCO2e', true), PLOTLY_CONFIG);
}

// Original Map Functions (Retained)
let activeLayers = {};
let currentMap = null;

function initMap(elementId) {
    currentMap = L.map(elementId).setView([1.9, 28.5], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(currentMap);

    activeLayers.boundary = L.layerGroup().addTo(currentMap);
    activeLayers.biomass = L.layerGroup().addTo(currentMap);
    activeLayers.avoided = L.layerGroup();
    activeLayers.hotspots = L.layerGroup();

    const boundaryPath = elementId === 'mainMap' ? '../assets/data/okapi_boundary.json' : 'assets/data/okapi_boundary.json';
    fetch(boundaryPath)
        .then(res => res.json())
        .then(data => {
            L.geoJSON(data, { style: { color: "#d4af37", weight: 2, fillOpacity: 0.05 } }).addTo(activeLayers.boundary);
        });

    // Simulated Layers (simplified for performance)
    for (let i = 0; i < 30; i++) {
        const lat = 1.0 + Math.random() * 1.7;
        const lng = 28.03 + Math.random() * 1.1;
        L.circle([lat, lng], { radius: 5000, color: '#2d5a27', fillOpacity: 0.3, stroke: false }).addTo(activeLayers.avoided);
        L.circleMarker([lat, lng], { radius: 6, color: '#d4af37', fillOpacity: 0.8 }).addTo(activeLayers.hotspots);
    }

    return currentMap;
}

function updateMapLayer(layerId) {
    if (!currentMap) return;
    Object.values(activeLayers).forEach(layer => currentMap.removeLayer(layer));
    activeLayers.boundary.addTo(currentMap);
    if (activeLayers[layerId]) activeLayers[layerId].addTo(currentMap);
}
