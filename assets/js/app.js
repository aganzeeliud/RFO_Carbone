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
function initMap(elementId) {
    const map = L.map(elementId).setView([1.9, 28.5], 9); // Centered on Okapi Reserve

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Placeholder for Okapi Boundary (Simplified Rectangle for now)
    const okapiBoundary = L.rectangle([[1.0, 27.5], [2.5, 29.5]], {
        color: "#2d5a27",
        weight: 2,
        fillOpacity: 0.1
    }).addTo(map);
    
    okapiBoundary.bindPopup("<b>Okapi Wildlife Reserve</b><br>UNESCO World Heritage Site");
    
    return map;
}
