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
    const dataPath = window.location.pathname.includes('dashboard') || window.location.pathname.includes('avoided-emissions') ? '../assets/data/Carbone_db.csv' : 'assets/data/Carbone_db.csv';
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
    const dataPath = '../assets/data/Carbone_db.csv';
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
