# RFO Carbone Pipeline: Detailed Stage Breakdown

## Stage 1: Multi-Sensor Data Collection

### What Happens
Our system automatically connects to Google Earth Engine to pull down the latest satellite data from multiple sources:

**Primary Data Sources:**
- **Sentinel-2 MSI (Multi-Spectral Instrument):** 10m resolution multispectral imagery (RGB, NIR, SWIR bands) captured every 5 days
- **Landsat 8/9 OLI (Operational Land Imager):** 30m resolution data with thermal bands for vegetation monitoring
- **GEDI (Global Ecosystem Dynamics Investigation):** Spaceborne lidar providing tree height measurements at 25m footprints
- **ALOS PALSAR:** Synthetic Aperture Radar (SAR) for penetrating cloud cover and measuring forest structure

**Technical Implementation:**
- **API:** Google Earth Engine Python/JavaScript API (ee.Authenticate() → ee.Initialize())
- **Data Format:** GeoTIFF with Cloud Optimized GeoTIFF (COG) compression for efficient streaming
- **Temporal Resolution:** Annual collection (typically December-February dry season for clearest skies)
- **Spatial Coverage:** Full RFO Carbone reserve extent (approximately 500,000 hectares)
- **Output:** Multi-band satellite imagery stacks (12-15 bands per pixel) stored in GCS buckets

**Processing Parameters:**
- Projection: EPSG:32633 (UTM Zone 33N)
- Pixel Size: 10m (Sentinel-2 native resolution)
- Data Tile: 5km x 5km managed chips to optimize memory
- Acquisition Date Range: November 1 - February 28 (dry season window)

### Why It Matters
The Congo Basin experiences heavy cloud cover year-round, making it impossible to use just one seasonal snapshot. By collecting data annually during the dry season from multiple sensor types:
- We capture the most recent forest condition with minimal atmospheric interference
- Multi-sensor fusion reduces errors in individual sensors
- Annual collection allows us to measure year-over-year change in canopy structure
- Lidar data provides ground-truth tree heights unavailable from optical sensors alone

---

## Stage 2: Pre-Processing & Cloud Masking

### What Happens
Raw satellite data contains significant atmospheric noise and cloud cover. We apply a sophisticated cloud masking pipeline:

**Pre-Processing Steps:**

1. **Atmospheric Correction:**
   - Apply Sen2Cor for Sentinel-2 (converts Top-of-Atmosphere to Bottom-of-Atmosphere reflectance)
   - LEDAPS algorithm for Landsat data
   - Removes effects of atmospheric aerosols, water vapor, and Rayleigh scattering

2. **Cloud & Cloud Shadow Detection:**
   - **S2Cloudless Neural Network:** Deep learning model (ResNet backbone) trained on 70,000+ labeled Sentinel-2 images
   - Output: Per-pixel cloud probability map (0-100%)
   - Threshold: 70% confidence for cloud classification
   - Cloud shadow detection: Use temporal coherence and SAR backscatter changes

3. **Radiometric Calibration:**
   - Convert Digital Numbers (DNs) to Top-of-Atmosphere Reflectance (TOA)
   - Calculate radiometric indices (NDVI, EVI, NDMI) for downstream analysis
   - Normalize across multiple satellite passes for consistency

4. **Geometric Registration:**
   - Co-register all data to a master Sentinel-2 reference image (±1 pixel RMSE)
   - Apply sub-pixel orthorectification using GCPs from Landsat
   - Output georeferencing: Horizontal accuracy ±30m

**Technical Stack:**
- **Libraries:** GeoPandas, Rasterio, GDAL, S2Cloudless (via Sentinel Hub API)
- **Processing:** Apache Spark (PySpark) for distributed cloud masking across 5km tiles
- **Performance:** ~45 minutes for full reserve on 64-core cluster

**Output Specifications:**
- Pixel Count: Valid (cloud-free) pixels identified per date
- Data Format: Cloud Probability GeoTIFF + Boolean Mask Raster
- File Size: ~2.3 GB per annual collection after compression
- Valid Pixel Coverage: Target ≥60% per reserve (typically achieve 65-75%)

### Why It Matters
The Congo Basin receives ~250+ cloudy days per year. Without sophisticated cloud masking:
- Standard optical data would have >90% invalid pixels during wet season
- Annual analysis would be impossible without multi-year composites
- Remaining cloud artifacts would severely bias tree height estimation models
- S2Cloudless achieves 96% accuracy in cloud detection (vs. 72% for traditional methods like FMASK)

This unlocks the ability to do **real-time annual monitoring** rather than multi-year rolling averages.

---

## Stage 3: Spatial Fusion & Machine Learning Modeling

### What Happens
This is the most complex stage where we synthesize lidar and optical data to create continent-wide aboveground biomass maps:

**Data Fusion Approach:**

1. **Training Data Preparation:**
   - Collect GEDI lidar returns within the reserve (2019-2023 archive)
   - Extract tree height estimates using GEDI Level 2A product (waveform processing)
   - Collocate GEDI shots with Sentinel-2 pixels (same footprint)
   - Training sample size: ~45,000 co-located GEDI-Sentinel-2 pairs
   - Split: 70% training, 15% validation, 15% test

2. **Feature Engineering:**
   
   **Spectral Indices (from Sentinel-2):**
   - NDVI (Normalized Difference Vegetation Index)
   - EVI (Enhanced Vegetation Index)
   - NDMI (Normalized Difference Moisture Index)
   - SWIR1/2 bands (Short-Wave Infrared for vegetation density)
   - Red Edge bands (705nm, 740nm) for chlorophyll concentration
   - Brightness (B2 blue channel) for canopy structure
   - Textural features: GLCM variance, entropy at 150m window
   
   **Lidar Features (from GEDI):**
   - RH25, RH50, RH75, RH95 (waveform percentile heights)
   - Leaf Area Index (LAI) estimate from waveform
   - Canopy Cover (CC) fraction

3. **Random Forest Model:**
   - **Algorithm:** Scikit-learn RandomForestRegressor with 500 trees
   - **Hyperparameters:**
     - Max depth: 25
     - Min samples split: 5
     - Max features: √(n_features) = 4
   - **Target Variable:** Tree height (meters, 0-80m range)
   - **R² Score:** 0.78 on validation set (RMSE: ±4.2m per pixel)
   - **Feature Importance:** NDVI=28%, RH95=22%, EVI=15%, texture_variance=12%

4. **Biomass Estimation:**
   - Convert predicted height to Above-Ground Biomass (AGB) using allometric equations
   - Regional equation for Congo Basin species: **AGB = 0.0673 × (DBH)^2.473**
   - Height → DBH conversion using height-diameter models specific to forest type
   - Output: Megagrams of dry biomass per hectare (Mg/ha)

5. **Model Validation:**
   - Leave-One-Year-Out (LOYO) cross-validation to test temporal consistency
   - Accuracy ±15% at hectare scale
   - Spatial resolution: 10m pixels aggregated to 100m for statistical stability
   - Confidence intervals: 90% based on RF prediction uncertainty

**Technical Implementation:**
- **Language:** Python 3.9+
- **ML Framework:** Scikit-learn 1.0+
- **Processing:** Distributed via Apache Spark (xgboost4j-spark alternative available)
- **Memory:** 128GB RAM cluster for full-reserve inference
- **Training Time:** 2.5 hours on GPU-accelerated cluster
- **Inference Time:** 18 hours for full reserve (50 billion pixels at 10m resolution)

**Output Specifications:**
- **File Format:** Single-band GeoTIFF (biomass density map)
- **File Size:** 850MB (uncompressed), 180MB (LZW compressed)
- **Spatial Extent:** Full RFO reserve at 10m resolution
- **Value Range:** 0-250 Mg/ha (typical range 80-200 in undisturbed forest)
- **Geospatial Metadata:** EPSG:32633, geotransform, nodata=-9999

### Why It Matters
Machine learning enables **scaling from sparse lidar data (footprints ~25m diameter) to continuous wall-to-wall maps (10m pixels)**. Without this:
- Biomass data would only exist at scattered lidar points (100+ km between shots)
- We couldn't track localized forest loss hotspots
- Carbon accounting would have >50% uncertainty

The fusion approach achieves the precision of lidar with the spatial coverage of satellites, creating a foundation for all subsequent carbon calculations.

---

## Stage 4: Carbon Flux Calculation

### What Happens
We identify forest loss areas and calculate the carbon released from deforestation:

**Process Steps:**

1. **Forest Loss Detection:**
   - Download Global Forest Watch Deforestation Alert data (30m resolution)
   - Temporal resolution: Monthly updates from Hansen et al. Global Forest Change dataset
   - Filter to RFO reserve extent
   - Cross-reference with Sentinel-1 SAR for validation (SAR easily detects canopy removal)
   - Loss detection accuracy: ~92% (with 8% false positive rate)

2. **Biomass Loss Quantification:**
   - Intersect GFW forest loss polygons with our Stage 3 biomass density map
   - For each loss pixel:
     - Retrieve biomass value from baseline map
     - Identify loss year from Hansen date layer
     - Apply carbon conversion factor: **C = Biomass × 0.47** (dry biomass to carbon conversion)
   - Calculate total hectares lost per year

3. **Emissions Calculation:**
   
   **Formula:**
   ```
   Annual_Emissions = Σ(Loss_Pixels) × Biomass_Density_Mg/ha × 0.47 C/Mg
   
   = Σ(Area_lost_ha × Mean_Biomass_Mg/ha × 0.47)
   = CO₂ Equivalents × 3.667 (44/12 conversion)
   ```
   
   **Example Calculation:**
   - Loss detected: 250 hectares in Year X
   - Mean biomass in loss area: 145 Mg/ha
   - Carbon content: 145 × 0.47 = 68.15 Mg C/ha
   - Annual emissions: 250 ha × 68.15 Mg C/ha = 17,037.5 Mg C = 62,537 Mg CO₂e

4. **Hotspot Identification:**
   - Create annual loss heatmaps at 1km × 1km resolution
   - Identify "hotspots" = areas with >10% annual loss rate
   - Flag for conservation team intervention
   - Rank by carbon impact (highest CO₂e loss first)

**Data Sources:**
- **GFW Hansen Dataset:** Global 30m-resolution tree cover maps (2000-present)
- **Update Frequency:** Near-real-time (3-month latency)
- **Uncertainty Range:** ±18% on total emissions (95% CI)

**Technical Stack:**
- **GIS Processing:** GDAL, GeoPandas for raster/vector overlay
- **Spatial SQL:** PostGIS for efficient geometric queries
- **Database:** PostgreSQL for archival and trend analysis

**Output Deliverables:**
1. **Annual Emissions Report:**
   - Year, hectares lost, Mg CO₂e released, top 5 hotspot coordinates
   - Format: CSV + interactive map (Folium/Plotly)
   
2. **Hotspot Shapefile:**
   - Polygon layer of loss areas (1km tiles)
   - Attributes: loss_area_ha, biomass_loss_Mg, emissions_CO2e, conservation_priority
   - Format: GeoJSON + Shapefile (EPSG:32633)

3. **Time Series:**
   - Annual trends (2015-present)
   - Rate of change analysis: Compare Year-over-Year loss

### Why It Matters
Forest loss calculations answer the critical question: **"How much carbon is being saved by protecting this reserve?"**

Without precise biomass mapping and loss detection:
- Impact claims would be speculative (±50% uncertainty)
- Policymakers couldn't verify conservation effectiveness
- International carbon credit programs wouldn't accept the data (REDD+ requires ±5% accuracy)

This stage converts satellite data into **actionable intelligence** that drives conservation funding and policy decisions.

---

## Stage 5: REDD+ Baseline Benchmarking

### What Happens
We prove the reserve is preventing deforestation that would have occurred naturally:

**Baseline Estimation:**

1. **Define "Business-As-Usual" Scenario:**
   - Analyze deforestation rates in surrounding unprotected forests (buffer zones 50-100km from reserve)
   - Historical period: 2005-2015 (pre-protection period)
   - Calculate annual deforestation rate: **r = (% forest loss per year)**
   - Example: 1.2% annual loss rate in buffer zone

2. **Project BAU Emissions:**
   ```
   BAU_Emissions_Year_X = Reserve_Biomass × r × Carbon_Conversion
   
   Example (Year 2023):
   - Reserve baseline biomass: 285 million Mg
   - BAU loss rate: 1.2% annually
   - Loss under BAU: 285M × 0.012 = 3.42M Mg biomass
   - Carbon released: 3.42M × 0.47 × 3.667 = 5.92M Mg CO₂e
   ```

3. **Calculate Actual Performance:**
   - Measure actual emissions from Stage 4 (forest loss within reserve)
   - Example: If actual 2023 loss = 0.1%, emissions = ~0.49M Mg CO₂e
   
4. **Net Emissions Reduction:**
   ```
   Credits_Generated = BAU_Emissions - Actual_Emissions
   = 5.92M - 0.49M = 5.43M Mg CO₂e saved
   ```

5. **Statistical Validation:**
   - Confidence interval: 90% (accounts for ±15% baseline uncertainty)
   - Sensitivity analysis: Run projections with conservative, baseline, and optimistic loss rates
   - Matched-pair comparison: Compare reserve performance to statistically similar unprotected areas

**Data & Methodology:**
- **Historical Reference:** FAO Forest Resource Assessment, Global Forest Watch historical data
- **Comparison Dataset:** Deforestation rates from Cameroon, CAR border regions (similar access/pressure)
- **Verification:** Independent audit by climate finance organization (e.g., Verra, Gold Standard)
- **Crediting Period:** 5-year implementation periods (REDD+ standard)

**REDD+ Compliance:**
- **Standard:** VCS (Verified Carbon Standard) or Gold Standard v3.0
- **Leakage Assessment:** Confirm no significant displacement of deforestation outside reserve
- **Permanence:** Monitor for 30 years post-project
- **Additionality:** Prove conservation wouldn't occur without carbon finance incentive

**Technical Validation:**
- Logistic regression model to predict forest loss probability (controls for slope, distance to settlements, etc.)
- Propensity-score matching to compare reserve to statistically similar unprotected sites
- Generate 10,000 Monte Carlo simulations to quantify uncertainty

**Output Specifications:**
- **REDD+ Project Design Document (PDD):**
  - Methodology, baselines, monitoring plan (60-80 pages)
  - Format: PDF + supplementary data tables (Excel)
  
- **Annual Monitoring Report:**
  - Actual vs. projected emissions table
  - Credits generated (Verified Carbon Units, VCUs)
  - Geospatial hotspot map for adaptive management
  
- **Database:**
  - Vintage registry: Blockchain-based carbon credit ledger
  - Transparency for carbon buyers and auditors

### Why It Matters
REDD+ funding represents **$200-500 million annually** in climate finance for tropical forest conservation. However:
- Without rigorous baselines, conservation claims lack credibility
- Buyers need proof of "additionality" (activity prevented real deforestation)
- International carbon markets require VCS/Gold Standard certification

This stage transforms emissions reductions into **tradeable carbon credits** worth ~$15-30/Mg CO₂e, generating revenue that funds on-ground conservation work.

---

## Stage 6: Final Result Documentation & Publication

### What Happens
All findings are compiled, verified, and released to the global community:

**Documentation Deliverables:**

1. **Scientific Publication:**
   - Target journal: *Remote Sensing of Environment* or *Global Change Biology*
   - Sections:
     - Methods: Data sources, processing pipeline, uncertainty quantification
     - Results: Annual emissions timeline, hotspot maps, REDD+ credits generated
     - Discussion: Forest protection effectiveness, management implications
   - Peer review + revision cycle (4-6 months)
   - Open-access (Creative Commons)
   - Citation: DOI assigned via DataCite

2. **Interactive Data Portal:**
   - Web-based platform (built with Streamlit/Dash)
   - Features:
     - Annual biomass map visualization (toggle by year)
     - Click-to-inspect pixel data (biomass, confidence interval, change since last year)
     - Forest loss hotspot map with animated timeline
     - REDD+ credit tracking dashboard
     - Download raw datasets (GeoTIFF, Shapefiles, CSV)
   - Server: AWS/GCP (geospatial services tier)
   - Audience: Scientists, policymakers, conservation NGOs, carbon buyers

3. **Open Data Release:**
   - **Harvard Dataverse:** Scientific community repository
   - **OSM/Google Earth Engine Catalog:** Ready-to-analyze data layers
   - **Zenodo/Figshare:** Backup redundancy + long-term preservation
   - Metadata: ISO 19115 geospatial standard
   - License: CC0 (public domain) or CC-BY (attribution required)
   - File formats:
     - GeoTIFF (raster data)
     - GeoJSON (hotspots, loss polygons)
     - NetCDF (temporal series)

4. **Policy Brief & Visualization Dashboard:**
   - 2-page summary for non-technical audience (policymakers, donors)
   - Key graphics:
     - Before/after satellite images
     - Emissions trend line
     - Carbon credits earned
     - Cost-per-hectare protected vs. global benchmarks
   - Distribution: Direct to ministries, climate commitments (NDCs)

5. **Monitoring & Adaptive Management Report:**
   - Annual updates (every January)
   - Adapts conservation strategies based on detected hotspots
   - Updated REDD+ credit calculations
   - Recommendations for ranger deployment, community engagement
   - Format: PDF report + geospatial data package

**Technical Specifications:**
- **Data Portal Architecture:**
  - Frontend: React/Mapbox GL for interactive mapping
  - Backend: FastAPI (Python) + PostGIS
  - Caching: Redis for <1s tile response time
  - Uptime: 99.9% SLA with auto-scaling
  
- **Data Archival:**
  - Versioning: All data releases frozen with DOI
  - Version history: Maintained back to 2015
  - Replication: 3 geographic redundancy zones
  - Preservation: 50-year digital preservation guarantee (via Portico/Archivematica)

- **Quality Assurance:**
  - All products reviewed by 2 independent experts
  - Uncertainty quantified in all visualizations
  - Validation reports published alongside datasets

**Outreach & Communication:**
- Scientific seminars for climate modeling community
- Webinars for carbon buyers and REDD+ registries
- Video tutorials for data portal usage
- Social media campaign (LinkedIn: carbon finance, Twitter: climate action)
- Partnership announcements (Carbon Trust, World Wildlife Fund, etc.)

**Documentation Index:**

| Document | Audience | Format | Size |
|----------|----------|--------|------|
| Peer-reviewed paper | Scientists | PDF + SI | 25-40 pages |
| REDD+ Project Design Document | Carbon buyers | PDF | 60-80 pages |
| Policy Brief | Policymakers | PDF | 2-3 pages |
| Technical User Guide | Data consumers | Markdown/HTML | 20-30 pages |
| Annual Monitoring Report | Government/donors | PDF + data | 30-50 pages |
| Dataset README | Data users | CSV metadata | Text |

### Why It Matters
Conservation impact remains invisible without communication. This stage ensures:
- **Scientific credibility:** Peer review validates methods and results
- **Accessibility:** Open data enables independent verification and secondary research
- **Policy influence:** Policy briefs reach decision-makers who control conservation funding
- **Stakeholder transparency:** Communities see data proving reserve effectiveness
- **Scalability:** Others can replicate methods in new reserves (50+ REDD+ programs globally)

Publication in top journals (and media coverage) can attract $5-10M in additional conservation funding, making this the **highest ROI stage** of the entire pipeline.

---

## Cross-Stage Data Lineage

```
Stage 1 (Collection)
      ↓
   Satellite/Lidar Raw Data (Multi-sensor)
      ↓
Stage 2 (Pre-processing)
      ↓
   Cloud-masked Reflectance Data + Tree Heights
      ↓
Stage 3 (Fusion & ML)
      ↓
   Biomass Density Map (10m resolution)
      ↓
Stage 4 (Carbon Flux)
      ↓
   Emissions Inventory + Hotspot Map
      ↓
Stage 5 (REDD+ Baseline)
      ↓
   Verified Carbon Credits + Impact Report
      ↓
Stage 6 (Documentation)
      ↓
   Published Data, Policy Briefs, Peer-reviewed Science
```

---

## Pipeline Quality Metrics

| Metric | Target | Actual (2024) | Status |
|--------|--------|---------------|--------|
| Cloud-masked data coverage | >60% | 71% | ✅ |
| Biomass model R² | >0.75 | 0.78 | ✅ |
| Forest loss detection accuracy | >90% | 92% | ✅ |
| REDD+ baseline confidence interval | <20% | ±15% | ✅ |
| Data publication delay | <6 months | 4 months | ✅ |
| Public data access uptime | 99.5% | 99.92% | ✅ |

---

## Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Cloud obscuration | Lost annual data | Multi-sensor fusion + SAR backup |
| Model drift | Increasing bias over time | Annual retraining + LOYO validation |
| Loss detection error | Over/under-credited | Independent SAR validation + manual audit sample |
| Baseline non-stationarity | REDD+ rejection | Historical trend analysis + buffer zones |
| Data unavailability | Pipeline failure | Google Earth Engine redundancy + local mirrors |

