// Theme Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', targetTheme);
            themeToggle.innerHTML = targetTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    // Initialize Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});

// Sample Data for Charts (2018-2025)
const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const carbonSequestration = [12.5, 12.8, 12.4, 13.1, 12.9, 13.5, 13.2, 13.8]; // MtCO2e
const forestLoss = [4500, 4200, 4800, 4100, 3900, 3700, 3500, 3200]; // Hectares
const biomassDensity = [310, 312, 311, 314, 315, 318, 319, 322]; // Mg/ha

// Chart Functions
function initCarbonChart(elementId) {
    const trace = {
        x: years,
        y: carbonSequestration,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Carbon Sequestration',
        line: { color: '#2d5a27', width: 3 },
        marker: { size: 8 }
    };

    const layout = {
        title: 'Annual Carbon Sequestration (2018-2025)',
        xaxis: { title: 'Year' },
        yaxis: { title: 'MtCO2e' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter', color: '#333' }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

function initLossChart(elementId) {
    const trace = {
        x: years,
        y: forestLoss,
        type: 'bar',
        name: 'Forest Loss',
        marker: { color: '#c5a059' }
    };

    const layout = {
        title: 'Annual Forest Loss Trends',
        xaxis: { title: 'Year' },
        yaxis: { title: 'Hectares' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

// Map Functions
let activeLayers = {};
let currentMap = null;

function initMap(elementId) {
    currentMap = L.map(elementId).setView([1.9, 28.5], 8);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(currentMap);

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Layer groups
    activeLayers.boundary = L.layerGroup().addTo(currentMap);
    activeLayers.biomass = L.layerGroup().addTo(currentMap);
    activeLayers.loss = L.layerGroup();
    activeLayers.mining = L.layerGroup();

    // Fetch and add Okapi Boundary
    fetch('../assets/data/okapi_boundary.json')
        .then(res => res.json())
        .then(data => {
            L.geoJSON(data, {
                style: { color: "#2d5a27", weight: 3, fillOpacity: 0.05 }
            }).bindPopup("<b>Okapi Wildlife Reserve</b>").addTo(activeLayers.boundary);
        });

    // Simulate Biomass Heatmap (Mocked with circle markers)
    for (let i = 0; i < 50; i++) {
        const lat = 1.0 + Math.random() * 1.5;
        const lng = 27.5 + Math.random() * 2.0;
        const density = 200 + Math.random() * 200;
        L.circle([lat, lng], {
            radius: 5000,
            color: density > 350 ? '#00441b' : '#74c476',
            fillOpacity: 0.6,
            stroke: false
        }).addTo(activeLayers.biomass);
    }

    // Simulate Loss Points (Mocked)
    for (let i = 0; i < 20; i++) {
        const lat = 1.0 + Math.random() * 1.5;
        const lng = 27.5 + Math.random() * 2.0;
        L.circleMarker([lat, lng], {
            radius: 8,
            color: '#ff4d4d',
            fillOpacity: 0.8
        }).bindPopup("Forest Loss Detected").addTo(activeLayers.loss);
    }

    // Simulate Mining Zones
    const miningZones = [
        [1.5, 28.2], [2.1, 29.0], [1.2, 27.8]
    ];
    miningZones.forEach(coord => {
        L.polygon([
            [coord[0], coord[1]],
            [coord[0] + 0.1, coord[1]],
            [coord[0] + 0.1, coord[1] + 0.1],
            [coord[0], coord[1] + 0.1]
        ], { color: '#c5a059', fillOpacity: 0.5 }).bindPopup("Artisanal Mining Impact Zone").addTo(activeLayers.mining);
    });

    return currentMap;
}

function updateMapLayer(layerId) {
    if (!currentMap) return;
    
    // Remove all data layers first (keep boundary)
    currentMap.removeLayer(activeLayers.biomass);
    currentMap.removeLayer(activeLayers.loss);
    currentMap.removeLayer(activeLayers.mining);

    // Add selected layer
    if (layerId === 'biomass') activeLayers.biomass.addTo(currentMap);
    if (layerId === 'loss') activeLayers.loss.addTo(currentMap);
    if (layerId === 'mining') activeLayers.mining.addTo(currentMap);
}
