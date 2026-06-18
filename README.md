# Okapi Environmental Intelligence (OEI) Platform

[![Status](https://img.shields.io/badge/Status-Live-success.svg)](https://yourusername.github.io/RFO_Carbone/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Framework-Bootstrap%205-7952b3.svg)](https://getbootstrap.com/)

> **Securing the Congo Basin's Carbon Future through Advanced Intelligence.**

The **Okapi Environmental Intelligence Platform** is a cutting-edge scientific monitoring system dedicated to the Okapi Wildlife Reserve (RFO) in the Democratic Republic of Congo. By fusing multi-sensor satellite data with REDD+ validated analytics, the platform provides real-time transparency into the climate mitigation performance of one of Africa's most critical carbon sinks.

---

## 🌟 Project Vision

The Okapi Wildlife Reserve is a UNESCO World Heritage site sequestering millions of tons of CO2 annually. Our mission is to provide researchers, policy makers, and conservationists with a **high-integrity data layer** to:
1.  **Monitor** forest health and carbon stock stability.
2.  **Quantify** avoided GHG emissions using IPCC-aligned methodologies.
3.  **Benchmark** reserve performance against regional Congo Basin trends.

## 🚀 Key Features

-   **REDD+ Analytics Engine:** Automated calculation of avoided GHG emissions from 2001 to 2026.
-   **Carbon Intelligence Dashboard:** High-fidelity visualizations of sequestration trends and forest loss.
-   **Soil & Forest Analytics:** Detailed mapping of land cover (Soil Occupation) and forest type carbon density.
-   **Multi-Sensor Fusion:** Integration of NASA GEDI (Biomass), ESA CCI, and Global Forest Watch data.
-   **Regional Benchmarking:** Comparative analytics vs. the broader Congo Basin sequestration efficiency.
-   **Interactive GIS Viewer:** Layered mapping of biomass density, protected boundaries, and conservation hotspots.
-   **Professional UI:** Modern glassmorphism design with full Dark/Light mode support.
-   **Non-Technical Documentation:** Comprehensive guides explaining LiDAR analysis, satellite technology, and carbon calculations in simple terms.

## 📂 Project Architecture

```text
RFO_Carbone/
├── index.html                    # Landing Page & Executive Summary
├── README.md                     # Project Overview
├── LIDAR_ANALYSIS_GUIDE.md       # Non-Technical Guide to Satellite Analysis
├── dashboard/                    # In-depth Analytics Dashboard
├── maps/                         # Interactive GIS Spatial Viewer
├── pages/
│   ├── methodology.html          # Scientific Workflow & IPCC Alignment
│   ├── datasets.html             # Data Catalog & Attribution
│   └── about.html                # History of the Okapi Wildlife Reserve
├── assets/
│   ├── css/style.css             # Custom Scientific Theme
│   ├── js/app.js                 # Core Analytics & Data Processing Logic
│   └── data/                     # CSV/GeoJSON Datasets (GEDI, GFW, ESA)
└── scripts/                      # Data Pipeline (Python/Earth Engine)
```

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Bootstrap 5, Font Awesome 6 |
| **Analytics** | Plotly.js |
| **Mapping** | Leaflet.js, CartoDB |
| **Data Processing** | Python (GeoPandas, Rasterio, GEE) |
| **Data Sources** | NASA GEDI, ESA, GFW, UNESCO |

## 💻 Local Development

The platform is built as a **Static Web Application**, making it highly portable and resilient.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/RFO_Carbone.git
    ```
2.  **Open locally:**
    Simply open `index.html` in your browser. For full GIS functionality, a local server is recommended:
    ```bash
    # If you have Python installed
    python3 -m http.server 8000
    ```
3.  **Navigate to:** `http://localhost:8000`

## 🌍 Deployment

Optimized for **GitHub Pages**. To deploy your own instance:
1.  Push your changes to the `main` branch.
2.  In GitHub Settings > Pages, set the source to `main` branch / root.

## 🔬 Scientific Methodology

The platform's GHG estimates are derived from:
-   **Net Sequestration:** Calculated using NASA GEDI Lidar-derived biomass density.
-   **Avoided Emissions:** Based on the difference between the reserve's deforestation rate and the regional "business-as-usual" baseline (REDD+ VM0015).
-   **Carbon Fraction:** Adheres to the IPCC 2006 standard of 0.47.

### 🛰️ Satellite Data Sources

Our multi-sensor fusion approach combines:

| Satellite | Agency | Measurement | Purpose |
|-----------|--------|-------------|---------|
| **GEDI** | NASA | Tree Height & 3D Structure | Biomass density mapping |
| **Sentinel-2** | ESA | Optical/Infrared | Forest health & change detection |
| **BIOMASS** | ESA | Radar (SAR) | Canopy penetration & total biomass |
| **Global Forest Watch** | WRI | Historical Loss Data | Deforestation baseline |

For a comprehensive non-technical explanation of these technologies, see **[LIDAR_ANALYSIS_GUIDE.md](LIDAR_ANALYSIS_GUIDE.md)** — perfect for stakeholders, policy makers, and anyone new to satellite monitoring.

---
Developed with ❤️ for the protection of the Congo Basin.
