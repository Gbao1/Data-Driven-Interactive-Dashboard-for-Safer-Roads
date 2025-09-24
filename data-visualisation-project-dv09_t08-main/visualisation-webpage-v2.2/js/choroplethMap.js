// Dot Map for Total Fines by Jurisdiction (now as Choropleth Map)

class DotMap {
  constructor() {
    this.margin = { top: 40, right: 150, bottom: 60, left: 100 }
    this.svg = null
    this.g = null
    this.width = 0
    this.height = 0
    this.isInitialised = false
    this.zoom = null
    this.currentZoomState = null
    this.australiaGeoJSON = null
    this.projection = null
    this.pathGenerator = null
    // Maximum chart dimensions
    this.maxWidth = 1200
    this.maxHeight = 800

    // Mapping of jurisdiction names to state names in GeoJSON
    this.jurisdictionMapping = {
      NSW: "New South Wales",
      VIC: "Victoria",
      QLD: "Queensland",
      WA: "Western Australia",
      SA: "South Australia",
      TAS: "Tasmania",
      NT: "Northern Territory",
      ACT: "Australian Capital Territory",
    }

    this.loadGeoData().then(() => {
      this.init()
      setTimeout(() => {
        this.updateSize()
        this.isInitialised = true
      }, 100)
    })

    window.addEventListener("resize", () => {
      if (this.isInitialised) {
        this.updateSize()
      }
    })
  }

  async loadGeoData() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson",
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      this.australiaGeoJSON = await response.json()
      console.log("Australia GeoJSON loaded successfully")
    } catch (error) {
      console.error("Error loading Australia GeoJSON:", error)
      this.australiaGeoJSON = null
    }
  }

  init() {
    const container = d3.select("#dot-map")
    if (container.empty()) {
      console.error("DotMap container #dot-map not found.")
      return
    }

    // Clear any existing content
    container.selectAll("*").remove()

    this.svg = container
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true)

    this.g = this.svg.append("g")

    // Initialise projection
    this.projection = d3.geoAlbers().rotate([-134, 0]).center([0, -27]).parallels([-18, -36])

    this.pathGenerator = d3.geoPath().projection(this.projection)

    // Create zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([0.8, 8])
      .on("zoom", (event) => this.zoomed(event))
  }

  updateSize() {
    const container = d3.select("#dot-map").node()
    if (!container) return

    const bounds = container.getBoundingClientRect()

    if (bounds.width === 0 || bounds.height === 0) {
      setTimeout(() => this.updateSize(), 100)
      return
    }

    const minWidth = 600
    const minHeight = 400

    // Apply maximum size constraints
    const safeWidth = Math.min(Math.max(bounds.width, minWidth), this.maxWidth)
    const safeHeight = Math.min(Math.max(bounds.height, minHeight), this.maxHeight)

    this.width = Math.max(safeWidth - this.margin.left - this.margin.right, 400)
    this.height = Math.max(safeHeight - this.margin.top - this.margin.bottom, 300)

    this.svg
      .attr("viewBox", `0 0 ${safeWidth} ${safeHeight}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("max-width", `${this.maxWidth}px`)
      .style("max-height", `${this.maxHeight}px`)
      .style("margin", "0 auto") // Center the chart

    this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    // Update projection to fit the new size
    if (this.projection && this.australiaGeoJSON) {
      this.projection.fitSize([this.width, this.height], this.australiaGeoJSON)
    } else if (this.projection) {
      this.projection.scale(this.width * 1.2).translate([this.width / 2, this.height / 2])
    }

    // Update zoom extent
    if (this.zoom) {
      this.zoom.extent([
        [0, 0],
        [this.width, this.height],
      ])
    }

    // Only update if we have valid data and this is the active chart
    if (window.dataManager && window.dataManager.isLoaded && this.isActiveChart()) {
      this.update()
    }
  }

  isActiveChart() {
    return window.chartNavigation && window.chartNavigation.getCurrentChart() === "jurisdiction"
  }

  update() {
    // Only update if this is the active chart
    if (!this.isActiveChart()) {
      return
    }

    if (!this.isInitialised || !window.dataManager || !window.dataManager.isLoaded) {
      return
    }

    if (this.width <= 0 || this.height <= 0) {
      return
    }

    if (!this.australiaGeoJSON) {
      console.warn("Australia GeoJSON not loaded. Cannot draw map.")
      this.g.selectAll("*").remove()
      this.g
        .append("text")
        .attr("x", this.width / 2)
        .attr("y", this.height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("Map data unavailable")
      return
    }

    // Get filter values - now handling single selected year
    const selectedYear = window.chartNavigation.getSelectedValues("jurisdiction-year-filter")
    let filteredData = window.dataManager.getJurisdictionData()

    // Filter by year if selected (single year selection)
    if (selectedYear.length > 0 && selectedYear[0] !== "all") {
      filteredData = filteredData.filter((d) => d.year === +selectedYear[0])
    }

    // Aggregate data by jurisdiction
    const aggregatedData = d3.rollup(
      filteredData,
      (v) => d3.sum(v, (d) => d.fines),
      (d) => d.jurisdiction,
    )

    const mapData = Array.from(aggregatedData, ([jurisdiction, fines]) => ({
      jurisdiction,
      fines,
    })).filter((d) => d.fines > 0)

    // Clear previous content
    this.g.selectAll("*").remove()

    if (mapData.length === 0) {
      this.g
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", this.width / 2)
        .attr("y", this.height / 2)
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No data available")
      return
    }

    // Create color scale
    const maxFines = d3.max(mapData, (d) => d.fines)
    const minFines = d3.min(mapData, (d) => d.fines)

    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([minFines, maxFines])

    // Create a map for quick lookup of fine amounts by jurisdiction
    const finesByJurisdiction = new Map()
    mapData.forEach((d) => {
      finesByJurisdiction.set(d.jurisdiction, d.fines)
    })

    // Function to get jurisdiction code from state name
    const getJurisdictionCode = (stateName) => {
      for (const [code, name] of Object.entries(this.jurisdictionMapping)) {
        if (name === stateName) {
          return code
        }
      }
      return null
    }

    // Draw the choropleth map
    this.g
      .selectAll(".state")
      .data(this.australiaGeoJSON.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", this.pathGenerator)
      .style("fill", (d) => {
        const jurisdictionCode = getJurisdictionCode(d.properties.STATE_NAME)
        const fines = jurisdictionCode ? finesByJurisdiction.get(jurisdictionCode) : null

        if (fines && fines > 0) {
          return colorScale(fines)
        } else {
          return "#f0f0f0" // Light gray for states with no data
        }
      })
      .style("stroke", "#ffffff")
      .style("stroke-width", 2)
      .style("cursor", "pointer")
      .style("opacity", 0.9)
      .on("mouseover", (event, d) => {
        const jurisdictionCode = getJurisdictionCode(d.properties.STATE_NAME)
        const fines = jurisdictionCode ? finesByJurisdiction.get(jurisdictionCode) : null

        // Highlight the state
        d3.select(event.target).style("opacity", 1).style("stroke-width", 3).style("stroke", "#333")

        // Show tooltip
        window.tooltip.transition().duration(200).style("opacity", 0.9)

        if (fines && fines > 0) {
          window.tooltip.html(
            `State: ${d.properties.STATE_NAME}<br/>Jurisdiction: ${jurisdictionCode}<br/>Total Fines: $${fines.toLocaleString()}`,
          )
        } else {
          window.tooltip.html(`State: ${d.properties.STATE_NAME}<br/>No fine data available`)
        }

        window.tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", (event, d) => {
        // Reset state appearance
        d3.select(event.target).style("opacity", 0.9).style("stroke-width", 2).style("stroke", "#ffffff")

        // Hide tooltip
        window.tooltip.transition().duration(500).style("opacity", 0)
      })

    // Add state labels
    this.g
      .selectAll(".state-label")
      .data(this.australiaGeoJSON.features)
      .enter()
      .append("text")
      .attr("class", "state-label")
      .attr("transform", (d) => {
        const centroid = this.pathGenerator.centroid(d)
        return `translate(${centroid[0]}, ${centroid[1]})`
      })
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("pointer-events", "none") // Don't interfere with state hover
      .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)") // Better readability
      .text((d) => {
        const jurisdictionCode = getJurisdictionCode(d.properties.STATE_NAME)
        return jurisdictionCode || ""
      })

    // Add legend
    this.addLegend(mapData, null, colorScale)

    // Add reset zoom button
    this.addResetZoomButton()

    // Add zoom behavior
    this.svg.call(this.zoom)

    // Restore zoom state if exists
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }
  }

  // Helper function to format currency values based on magnitude
  formatCurrencyValue(value) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else {
      return `$${(value / 1000).toFixed(0)}K`
    }
  }

  addLegend(mapData, radiusScale, colorScale) {
    // Remove existing legend
    this.svg.selectAll(".legend").remove()

    // Always position legend in top right
    const legendX = this.width + this.margin.left + 10
    const legendY = this.margin.top + 10

    const legend = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${legendX}, ${legendY})`)

    // Legend title
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Fine Amount")

    // Get min and max values for the legend
    const maxFines = d3.max(mapData, (d) => d.fines)
    const minFines = d3.min(mapData, (d) => d.fines)
    const midFines = minFines + (maxFines - minFines) * 0.5

    // Color gradient legend with proper range
    const gradientHeight = 150
    const gradientWidth = 25

    // Create gradient definition with multiple stops for better color distribution
    const defs = this.svg.select("defs").empty() ? this.svg.append("defs") : this.svg.select("defs")

    // Remove existing gradient if it exists
    defs.select("#fine-gradient").remove()

    const gradient = defs
      .append("linearGradient")
      .attr("id", "fine-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%")

    // Create multiple color stops for a smoother gradient
    const numStops = 10
    for (let i = 0; i <= numStops; i++) {
      const offset = (i / numStops) * 100
      const value = minFines + (maxFines - minFines) * (i / numStops)
      gradient.append("stop").attr("offset", `${offset}%`).attr("stop-color", colorScale(value))
    }

    // Add gradient rectangle
    const gradientY = 25 // Position directly below the title

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", gradientY)
      .attr("width", gradientWidth)
      .attr("height", gradientHeight)
      .style("fill", "url(#fine-gradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", 1)

    // Add gradient labels with better positioning
    legend
      .append("text")
      .attr("x", gradientWidth + 5)
      .attr("y", gradientY + 5)
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(this.formatCurrencyValue(maxFines))

    legend
      .append("text")
      .attr("x", gradientWidth + 5)
      .attr("y", gradientY + gradientHeight - 5)
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(this.formatCurrencyValue(minFines))

    // Add middle value for reference
    const midValue = (maxFines + minFines) / 2
    legend
      .append("text")
      .attr("x", gradientWidth + 5)
      .attr("y", gradientY + gradientHeight / 2)
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(this.formatCurrencyValue(midValue))
  }

  addResetZoomButton() {
    // Remove existing button
    this.svg.select(".reset-zoom-button").remove()

    if (this.width <= 0 || this.height <= 0) return

    const buttonX = Math.max(this.width + this.margin.left - 30, 50)
    const buttonY = 30

    const resetButton = this.svg
      .append("g")
      .attr("class", "reset-zoom-button")
      .attr("transform", `translate(${buttonX}, ${buttonY})`)
      .style("cursor", "pointer")
      .style("opacity", 0)
      .on("click", () => this.resetZoom())

    resetButton
      .append("rect")
      .attr("x", -30)
      .attr("y", -15)
      .attr("width", 60)
      .attr("height", 30)
      .attr("rx", 5)
      .style("fill", "rgba(255, 255, 255, 0.9)")
      .style("stroke", "#667eea")
      .style("stroke-width", 1.5)

    resetButton.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").text("Reset").style("fill", "#333")
  }

  zoomed(event) {
    this.currentZoomState = event.transform
    const isTransformed = event.transform.k !== 1 || event.transform.x !== 0 || event.transform.y !== 0
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0)

    this.g.attr("transform", `translate(${this.margin.left}, ${this.margin.top}) ${event.transform}`)
  }

  resetZoom() {
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)
    this.svg.select(".reset-zoom-button").style("opacity", 0)
    this.currentZoomState = null
  }
}

// Initialise dot map when data is loaded
window.addEventListener("dataLoaded", () => {
  window.dotMap = new DotMap()
})

// Listen for chart switching to update only when active
window.addEventListener("chartSwitched", (event) => {
  if (event.detail.chartType === "jurisdiction" && window.dotMap) {
    setTimeout(() => {
      window.dotMap.update()
    }, 100)
  }
})
