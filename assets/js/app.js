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

// Sample Data for Charts (2001-2026)
const years = Array.from({length: 26}, (_, i) => 2001 + i);
const carbonSequestration = [13.2, 13.4, 13.3, 13.5, 13.6, 13.8, 13.7, 13.9, 14.0, 14.1, 14.2, 14.0, 14.1, 14.3, 14.4, 14.2, 14.5, 14.5, 14.8, 14.4, 15.1, 14.9, 15.5, 15.2, 15.8, 16.2]; 
const forestLoss = [
    5200, 5100, 5300, 5000, 4900, 4800, 4850, 4700, 4600, 4500,
    4450, 4900, 4800, 4600, 4550, 4800, 4500, 4500, 4200, 4800,
    4100, 3900, 3700, 3500, 3205, 3000
];
const biomassDensity = [312, 313, 312, 314, 315, 316, 317, 318, 319, 320, 321, 319, 320, 321, 322, 321, 322, 323, 324, 323, 325, 326, 328, 329, 331, 332]; 

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
        title: 'Annual Carbon Sequestration (2001-2026)',
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

// Evolution Trend Slider Logic
function initEvolutionTrend(chartId, resumeId, sliderId, yearDisplayId) {
    const slider = document.getElementById(sliderId);
    const yearDisplay = document.getElementById(yearDisplayId);
    const resumeDisplay = document.getElementById(resumeId);

    const resumes = {
        2001: "Baseline year. Establishing initial carbon monitoring protocols.",
        2005: "Significant forest stability observed during early conservation efforts.",
        2010: "Enhanced monitoring using early satellite data; sequestration remains robust.",
        2015: "Middle of the second decade; slight increase in sequestration potential.",
        2020: "Challenging year with minor disturbances, yet sequestration stays above 14 Mt.",
        2025: "Optimal sequestration reached through strict protected area management.",
        2026: "Projected peak sequestration; Okapi reserve as a global carbon sink leader."
    };

    const updateUI = (year) => {
        yearDisplay.innerText = year;
        const index = years.indexOf(parseInt(year));
        
        // Find the closest resume
        let closestYear = 2001;
        Object.keys(resumes).forEach(y => {
            if (parseInt(y) <= parseInt(year)) closestYear = y;
        });
        resumeDisplay.innerText = resumes[closestYear];

        // Highlight point in chart
        const update = {
            'marker.size': years.map(y => y == year ? 15 : 8),
            'marker.color': years.map(y => y == year ? '#c5a059' : '#2d5a27')
        };
        Plotly.restyle(chartId, update);
    };

    slider.addEventListener('input', (e) => {
        updateUI(e.target.value);
    });

    // Initial load
    updateUI(slider.value);
}

// Map Functions
let activeLayers = {};
let currentMap = null;

function initMap(elementId) {
    currentMap = L.map(elementId).setView([1.9, 28.5], 8);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(currentMap);

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
        const lat = 1.0 + Math.random() * 1.7;
        const lng = 28.03 + Math.random() * 1.1;
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
        const lat = 1.0 + Math.random() * 1.7;
        const lng = 28.03 + Math.random() * 1.1;
        L.circleMarker([lat, lng], {
            radius: 8,
            color: '#ff4d4d',
            fillOpacity: 0.8
        }).bindPopup("Forest Loss Detected").addTo(activeLayers.loss);
    }

    // Simulate Mining Zones
    const miningZones = [
        [1.7, 28.2], [2.1, 29.0], [1.2, 27.8]
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
