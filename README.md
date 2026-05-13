# Okapi Wildlife Reserve Carbon Sequestration & Storage Analysis (2018–2025)

A professional environmental intelligence platform for monitoring forest carbon dynamics in the Democratic Republic of Congo.

## 🚀 Live Demo
This platform is designed to be hosted on **GitHub Pages**.

## 📂 Project Structure
```text
/
├── index.html          # Landing Page
├── about.html          # Project Background
├── methodology.html    # Scientific Workflow
├── datasets.html       # Data Catalog
├── dashboard.html      # Analytics Dashboard (Plotly.js)
├── maps.html           # Interactive GIS Viewer (Leaflet.js)
├── downloads.html      # Data Center
├── references.html     # Bibliography
├── contact.html        # Collaboration Form
├── assets/
│   ├── css/style.css   # Scientific Theme (Dark/Light mode)
│   ├── js/app.js       # Interactive Logic
│   └── data/           # Sample GeoJSON & Statistics
└── scripts/            # Python Data Pipeline (Extraction & Analysis)
```

## 🛠 Tech Stack
- **Frontend:** Bootstrap 5, Leaflet.js, Plotly.js, Font Awesome.
- **Backend (Scripts):** Python, Google Earth Engine API, GeoPandas, Rasterio.
- **Data Sources:** NASA GEDI, ESA Biomass CCI, Global Forest Watch (Hansen).

## 💻 Local Execution
To view the platform locally:
1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. No local server is required as the architecture is purely static.

## 🌍 GitHub Pages Deployment
1. Create a new repository on GitHub.
2. Initialize git and push the files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Okapi Carbon Platform"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Go to **Settings > Pages** in your GitHub repository.
4. Select the `main` branch and `/ (root)` folder.
5. Click **Save**. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

## 🔬 Scientific Methodology
The platform calculates carbon sequestration using a multi-sensor fusion approach:
- **Biomass:** NASA GEDI Lidar + ESA Radar.
- **Forest Loss:** Hansen Global Forest Change (30m).
- **Carbon Fraction:** 0.47 (IPCC Standard).

---
*Developed for conservation researchers and policy makers monitoring the Congo Basin.*
