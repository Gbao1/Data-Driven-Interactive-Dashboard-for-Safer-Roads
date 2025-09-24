// Dot Map for Total Fines by Jurisdiction

class DotMap {
  constructor() {
    this.margin = { top: 40, right: 40, bottom: 60, left: 100 };
    this.svg = null;
    this.g = null;
    this.width = 0;
    this.height = 0;
    this.isInitialized = false;
    this.zoom = null;
    this.currentZoomState = null;
    this.australiaGeoJSON = null; // To store the loaded GeoJSON
    this.projection = null;
    this.pathGenerator = null;

    // Australian jurisdiction coordinates (APPROXIMATE Latitude, Longitude)
    // These will need to be fairly accurate for the projection to place them correctly.
    // You might need to fine-tune these.
    this.jurisdictionCoords = {
      NSW: { lat: -32.0, lon: 147.0 }, // New South Wales
      VIC: { lat: -37.0, lon: 145.0 }, // Victoria
      QLD: { lat: -23.0, lon: 143.0 }, // Queensland
      WA: { lat: -25.0, lon: 122.0 },  // Western Australia
      SA: { lat: -30.0, lon: 135.0 },   // South Australia
      TAS: { lat: -42.0, lon: 147.0 }, // Tasmania
      NT: { lat: -19.0, lon: 133.0 },  // Northern Territory
      ACT: { lat: -35.3, lon: 149.1 }, // Australian Capital Territory
    };

    this.loadGeoData().then(() => {
      this.init();
      // Defer sizing and drawing until GeoJSON is loaded and SVG is ready
      setTimeout(() => {
        if (document.getElementById("dot-map-chart-container")) { // Check if container exists
            this.updateSize();
            this.drawMap(); // Draw the base map first
            this.update();  // Then draw the dots
            this.isInitialized = true;
        } else {
            console.error("DotMap container 'dot-map-chart-container' not found during initialization.");
        }
      }, 100); // Small delay to ensure DOM is ready
    });

    window.addEventListener("resize", () => {
      if (this.isInitialized) {
        this.updateSize();
        this.drawMap(); // Redraw map on resize
        this.update();  // Redraw dots
      }
    });
  }

  async loadGeoData() {
    try {
      const response = await fetch("https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson");
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.australiaGeoJSON = await response.json();
      console.log("Australia GeoJSON loaded successfully:", this.australiaGeoJSON);
    } catch (error) {
      console.error("Error loading Australia GeoJSON:", error);
      // Fallback or error display for the user could be implemented here
      // For now, we'll allow the class to initialize but the map won't draw.
      this.australiaGeoJSON = null; // Ensure it's null if loading failed
    }
  }

  init() {
    const container = d3.select("#dot-map");
    if (container.empty()) {
        console.error("DotMap container #dot-map not found.");
        // Potentially create the container or throw an error
        // For now, we'll just return to prevent further errors if it's missing.
        // This might happen if the script runs before the HTML element is in the DOM.
        // Consider using DOMContentLoaded or ensuring script order.
        return;
    }
    container.select("svg").remove(); // Clear previous SVG if any

    this.svg = container
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");

    this.g = this.svg.append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // Initialize projection and path generator
    // These will be configured in updateSize() once we know the dimensions
    this.projection = d3.geoAlbers()
        .rotate([-134, 0]) // Roughly center Australia longitude (adjust as needed)
        .center([0, -27])    // Roughly center Australia latitude (adjust as needed)
        .parallels([-18, -36]); // Standard parallels for Australia for Albers

    this.pathGenerator = d3.geoPath().projection(this.projection);

    this.setupZoom();
    this.addResetButton(); // Assuming this is your existing reset button logic
    // No need to call drawAustraliaOutline anymore
  }

  updateSize() {
    const container = document.getElementById("dot-map-chart-container"); // Use the parent div for sizing
    if (!container) {
        console.error("DotMap sizing container 'dot-map-chart-container' not found.");
        if (this.isInitialized) { // If already initialized, try to use last known good values or defaults
            this.width = this.width || 600 - this.margin.left - this.margin.right;
            this.height = this.height || 400 - this.margin.top - this.margin.bottom;
        } else { // Not initialized, can't proceed with sizing
            return;
        }
    } else {
        this.width = container.clientWidth - this.margin.left - this.margin.right;
        this.height = container.clientHeight - this.margin.top - this.margin.bottom;
    }


    if (this.width <= 0 || this.height <= 0) {
        console.warn("DotMap container has zero or negative dimensions.", this.width, this.height);
        // Provide some default minimum dimensions if sizing fails
        this.width = Math.max(this.width, 300);
        this.height = Math.max(this.height, 200);
    }

    if (this.svg) {
      this.svg
        .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    }

    // Update projection scale and translate to fit the new size
    if (this.projection && this.australiaGeoJSON) {
      this.projection
        .fitSize([this.width, this.height], this.australiaGeoJSON);
    } else if (this.projection) {
      // Fallback if geojson isn't loaded, use a rough scale
       this.projection.scale(this.width * 1.2).translate([this.width / 2, this.height / 2]);
    }


    // Update zoom extent if zoom is initialized
    if (this.zoom) {
      this.zoom.extent([
        [0, 0],
        [this.width, this.height],
      ]);
    }
  }

  drawMap() {
    if (!this.australiaGeoJSON) {
      console.warn("Australia GeoJSON not loaded. Cannot draw map.");
      // Optionally, draw a placeholder or error message on the SVG
      this.g.selectAll(".state").remove(); // Clear any old map paths
      this.g.append("text")
        .attr("x", this.width / 2)
        .attr("y", this.height / 2)
        .attr("text-anchor", "middle")
        .text("Map data unavailable");
      return;
    }
    if (!this.g || !this.pathGenerator) {
        console.error("SVG group (g) or pathGenerator not initialized. Cannot draw map.");
        return;
    }

    this.g.selectAll(".state").remove(); // Clear old map before redrawing

    this.g
      .selectAll(".state")
      .data(this.australiaGeoJSON.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", this.pathGenerator)
      .style("fill", "#eee") // Light grey fill for states
      .style("stroke", "#aaa") // Darker grey stroke for state borders
      .style("stroke-width", 0.5);
  }

  update() {
    if (!this.isInitialized && !this.australiaGeoJSON) { // Don't update if not ready or map data failed
        console.log("DotMap not ready for update (not initialized or GeoJSON missing).");
        return;
    }
    if (!window.dataManager || !window.dataManager.isLoaded) {
      console.log("Data manager not ready, deferring DotMap update.");
      return;
    }

    // Ensure map is drawn before dots, especially if update is called before initial drawMap
    if (this.g.selectAll(".state").empty() && this.australiaGeoJSON) {
        this.drawMap();
    }


    const selectedYear = window.chartNavigation.getFilterValue("jurisdiction-year-filter")[0];
    let finesData = window.dataManager.getJurisdictionData();

    if (selectedYear && selectedYear !== "all") {
      finesData = finesData.filter((d) => d.year === parseInt(selectedYear));
    }

    // Aggregate data: sum fines per jurisdiction for the selected year
    const aggregatedData = d3.rollups(
      finesData,
      (v) => d3.sum(v, (d) => d.fines),
      (d) => d.jurisdiction,
    )
    .map(([key, value]) => ({ jurisdiction: key, totalFines: value }));


    const maxFines = d3.max(aggregatedData, (d) => d.totalFines);
    const radiusScale = d3.scaleSqrt().domain([0, maxFines]).range([2, Math.min(this.width, this.height) / 15]); // Adjust max radius as needed

    this.g.selectAll(".dot").remove(); // Clear existing dots

    const dots = this.g
      .selectAll(".dot")
      .data(aggregatedData, (d) => d.jurisdiction);

    dots
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => {
        const coords = this.jurisdictionCoords[d.jurisdiction];
        return coords && this.projection ? this.projection([coords.lon, coords.lat])[0] : 0;
      })
      .attr("cy", (d) => {
        const coords = this.jurisdictionCoords[d.jurisdiction];
        return coords && this.projection ? this.projection([coords.lon, coords.lat])[1] : 0;
      })
      .attr("r", 0) // Start with radius 0 for transition
      .style("fill", "#667eea")
      .style("opacity", 0.7)
      .style("stroke", "#3c366b")
      .style("stroke-width", 1)
      .on("mouseover", (event, d) => this.showTooltip(event, d))
      .on("mouseout", () => this.hideTooltip())
      .transition() // Add transition for appearing dots
      .duration(500)
      .attr("r", (d) => (d.totalFines > 0 ? radiusScale(d.totalFines) : 0));

    // If you have an update selection (dots that already existed), update them
    dots.attr("cx", (d) => {
        const coords = this.jurisdictionCoords[d.jurisdiction];
        return coords && this.projection ? this.projection([coords.lon, coords.lat])[0] : 0;
      })
      .attr("cy", (d) => {
        const coords = this.jurisdictionCoords[d.jurisdiction];
        return coords && this.projection ? this.projection([coords.lon, coords.lat])[1] : 0;
      })
      .transition()
      .duration(500)
      .attr("r", (d) => (d.totalFines > 0 ? radiusScale(d.totalFines) : 0));

    dots.exit().transition().duration(500).attr("r", 0).remove();
  }

  // REMOVE the old drawAustraliaOutline method
  // drawAustraliaOutline() { ... } // This method is no longer needed

  setupZoom() {
    this.zoom = d3
      .zoom()
      .scaleExtent([0.8, 8]) // Allow slightly more zoom out if desired, and more zoom in
      .on("zoom", (event) => this.zoomed(event));
    this.svg.call(this.zoom);
  }

  zoomed(event) {
    this.currentZoomState = event.transform;
    const isTransformed = event.transform.k !== 1 || event.transform.x !== 0 || event.transform.y !== 0;
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0);

    this.g.attr("transform", event.transform);
  }

  resetZoom() {
    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity); // Resets to k=1, x=0, y=0
     // Ensure the button fades out after reset
    this.svg.select(".reset-zoom-button").style("opacity", 0);
    this.currentZoomState = d3.zoomIdentity; // Update current zoom state
  }

  // This method needs to be defined or ensure it's part of your class if it's missing.
  // Add a simple one if it doesn't exist, or enhance your existing one.
  addResetButton() {
    const buttonSize = { width: 60, height: 30, padding: 10 };
    const buttonX = this.margin.left + buttonSize.padding; // Position from left margin
    const buttonY = this.margin.top + buttonSize.padding; // Position from top margin


    // Ensure this.svg is defined before trying to append to it.
    // This function might be called before init() fully sets up this.svg if not careful with call order.
    // However, in the provided constructor, addResetButton is called after this.svg is created.
    if (!this.svg) {
        console.error("SVG not initialized when trying to add reset button.");
        return;
    }

    const resetButton = this.svg
      .append("g")
      .attr("class", "reset-zoom-button")
      .attr("transform", `translate(${buttonX}, ${buttonY})`)
      .style("cursor", "pointer")
      .style("opacity", 0) // Initially hidden
      .on("click", () => this.resetZoom());

    resetButton
      .append("rect")
      .attr("x", -buttonSize.width / 2) // Center the rect on the translated 'g'
      .attr("y", -buttonSize.height / 2)
      .attr("width", buttonSize.width)
      .attr("height", buttonSize.height)
      .attr("rx", 5) // Rounded corners
      .style("fill", "rgba(255, 255, 255, 0.9)")
      .style("stroke", "#667eea")
      .style("stroke-width", 1.5);

    resetButton
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em") // Vertical centering
      .text("Reset")
      .style("fill", "#333")
      .style("font-size", "12px");
  }


  showTooltip(event, d) {
    d3.select("#tooltip").remove(); // Remove any existing tooltip

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("opacity", 0.9) // Start with opacity 0 for fade-in
      .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)");


    tooltip.html(
        `<strong>${d.jurisdiction}</strong><br/>Total Fines: $${d3.format(",.0f")(d.totalFines)}`
    );

    // Position the tooltip
    // Get mouse position relative to the page
    const [mouseX, mouseY] = [event.pageX, event.pageY];

    tooltip
      .style("left", `${mouseX + 15}px`) // Offset from cursor
      .style("top", `${mouseY - 28}px`);

    tooltip.transition().duration(200).style("opacity", 0.9);
  }

  hideTooltip() {
    d3.select("#tooltip").transition().duration(200).style("opacity", 0).remove();
  }
}

// Make sure an instance is created and potentially exposed globally if other scripts need it.
// This might already be handled in your main.js or HTML file.
// Example:
// document.addEventListener("DOMContentLoaded", () => {
//   if (!window.dotMap) { // Ensure only one instance is created
//     window.dotMap = new DotMap();
//   }
 //});
