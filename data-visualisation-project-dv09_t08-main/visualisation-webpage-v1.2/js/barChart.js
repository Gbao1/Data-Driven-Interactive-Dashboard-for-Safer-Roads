// Bar Chart for Jurisdiction and Location

class BarChart {
  constructor() {
    this.margin = { top: 20, right: 20, bottom: 100, left: 150 }
    this.svg = null
    this.g = null
    this.width = 0
    this.height = 0
    this.zoom = null
    this.xScale = null
    this.yScale = null
    this.xAxis = null
    this.yAxis = null
    this.currentZoomState = null
    this.chartContent = null
    this.isInitialized = false

    this.init()
    // Use setTimeout to ensure container is properly rendered before sizing
    setTimeout(() => {
      this.updateSize()
      this.isInitialized = true
    }, 100)

    window.addEventListener("resize", () => {
      if (this.isInitialized) {
        this.updateSize()
      }
    })
  }

  init() {
    // Create SVG container
    d3.select("#bar-chart").selectAll("*").remove()

    this.svg = d3
      .select("#bar-chart")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true)

    this.g = this.svg.append("g")

    // Create zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => this.zoomed(event))
  }

  addResetZoomButton() {
    this.svg.select(".reset-zoom-button").remove()

    // Only add if we have valid dimensions
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

    // Button background with safe dimensions
    resetButton
      .append("rect")
      .attr("x", -30)
      .attr("y", -15)
      .attr("width", Math.max(60, 0))
      .attr("height", Math.max(30, 0))
      .attr("rx", 5)
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("stroke", "#667eea")
      .style("stroke-width", 1)

    resetButton.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").text("Reset").style("fill", "#333")
  }

  updateSize() {
    const container = d3.select("#bar-chart").node()
    if (!container) return

    const bounds = container.getBoundingClientRect()

    // Ensure we have valid container dimensions
    if (bounds.width === 0 || bounds.height === 0) {
      // Container not ready, try again later
      setTimeout(() => this.updateSize(), 100)
      return
    }

    const minWidth = 400
    const minHeight = 400
    const safeWidth = Math.max(bounds.width, minWidth)
    const safeHeight = Math.max(bounds.height, minHeight)

    // Calculate chart dimensions with safety checks
    this.width = Math.max(safeWidth - this.margin.left - this.margin.right, 200)
    this.height = Math.max(safeHeight - this.margin.top - this.margin.bottom, 200)

    this.svg.attr("viewBox", `0 0 ${safeWidth} ${safeHeight}`).attr("width", safeWidth).attr("height", safeHeight)

    this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    if (this.zoom) {
      this.zoom.extent([
        [0, 0],
        [this.width, this.height],
      ])
    }

    // Only update if we have valid data
    if (window.dataManager && window.dataManager.isLoaded) {
      this.update()
    }
  }

  update() {
    if (!window.dataManager.isLoaded || this.width <= 0 || this.height <= 0) return

    const selectedYears = window.chartNavigation.getSelectedValues("bar-year-filter")
    const selectedJurisdictions = window.chartNavigation.getSelectedValues("jurisdiction-filter")

    let filteredData = window.dataManager.getJurisdictionData()

    if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year.toString()))
    }

    if (selectedJurisdictions.length > 0) {
      filteredData = filteredData.filter((d) => selectedJurisdictions.includes(d.jurisdiction))
    }

    const aggregatedData = d3.rollup(
      filteredData,
      (v) => d3.sum(v, (d) => d.count),
      (d) => `${d.jurisdiction} - ${d.location}`,
    )

    const barData = Array.from(aggregatedData, ([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    // Clear previous content
    this.g.selectAll("*").remove()
    this.svg.select("defs").remove()

    if (barData.length === 0) {
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

    // Create clip path with safe dimensions
    this.svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip-bar")
      .append("rect")
      .attr("width", Math.max(this.width, 0))
      .attr("height", Math.max(this.height, 0))

    this.xScale = d3
      .scaleLinear()
      .domain([0, d3.max(barData, (d) => d.count)])
      .range([0, this.width])

    this.yScale = d3
      .scaleBand()
      .domain(barData.map((d) => d.key))
      .range([0, this.height])
      .padding(0.1)

    this.xAxis = d3.axisBottom(this.xScale)
    this.yAxis = d3.axisLeft(this.yScale)

    this.gxAxis = this.g
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(this.xAxis)

    this.gyAxis = this.g.append("g").attr("class", "axis y-axis").call(this.yAxis)

    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${this.width / 2}, ${this.height + this.margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text("Number of Offences")

    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Jurisdiction - Location")

    this.chartContent = this.g.append("g").attr("clip-path", "url(#clip-bar)")

    this.chartContent
      .selectAll(".bar")
      .data(barData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d) => this.yScale(d.key))
      .attr("width", (d) => this.xScale(d.count))
      .attr("height", this.yScale.bandwidth())
      .style("fill", "#667eea")
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        window.tooltip.transition().duration(200).style("opacity", 0.9)
        window.tooltip
          .html(`${d.key}<br/>Count: ${d.count.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        window.tooltip.transition().duration(500).style("opacity", 0)
      })

    this.addResetZoomButton()
    this.svg.call(this.zoom)
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }
  }

  zoomed(event) {
    // Save current zoom state
    this.currentZoomState = event.transform

    // Show reset button when zoomed OR panned
    const isTransformed = event.transform.k > 1 || event.transform.x !== 0 || event.transform.y !== 0
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0)

    // Create new scales based on zoom event
    const newXScale = event.transform.rescaleX(this.xScale)
    const newYScale = this.yScale.copy().range([0, this.height].map((d) => event.transform.applyY(d)))

    // Update axes
    this.gxAxis.call(this.xAxis.scale(newXScale))
    this.gyAxis.call(this.yAxis.scale(newYScale))

    // Update bars
    this.chartContent
      .selectAll(".bar")
      .attr("y", (d) => newYScale(d.key))
      .attr("height", newYScale.bandwidth())
      .attr("width", (d) => newXScale(d.count))
  }

  resetZoom() {
    // Reset zoom transform
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)

    // Hide reset button
    this.svg.select(".reset-zoom-button").style("opacity", 0)

    // Clear saved zoom state
    this.currentZoomState = null
  }
}

// Initialize bar chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.barChart = new BarChart()
  window.barChart.update()
})
