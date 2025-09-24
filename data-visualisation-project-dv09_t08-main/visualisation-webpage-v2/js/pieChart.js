// Pie Chart for Age Groups

class PieChart {
  constructor() {
    this.margin = { top: 20, right: 120, bottom: 20, left: 20 } // Space for legend
    this.svg = null
    this.g = null
    this.width = 0
    this.height = 0
    this.radius = 0
    this.isInitialised = false
    this.zoom = null
    this.currentZoomState = null

    this.init()
    // Use setTimeout to ensure container is properly rendered before sizing
    setTimeout(() => {
      this.updateSize()
      this.isInitialised = true
    }, 100)

    window.addEventListener("resize", () => {
      if (this.isInitialised) {
        this.updateSize()
      }
    })
  }

  init() {
    // Create SVG container
    d3.select("#pie-chart").selectAll("*").remove()

    this.svg = d3
      .select("#pie-chart")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true)

    this.g = this.svg.append("g")

    // Create zoom behavior for pie chart
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 3])
      .on("zoom", (event) => this.zoomed(event))
  }

  updateSize() {
    const container = d3.select("#pie-chart").node()
    if (!container) return

    const bounds = container.getBoundingClientRect()

    // Ensure we have valid container dimensions
    if (bounds.width === 0 || bounds.height === 0) {
      // Container not ready, try again later
      setTimeout(() => this.updateSize(), 100)
      return
    }

    const minWidth = 500
    const minHeight = 400
    const safeWidth = Math.max(bounds.width, minWidth)
    const safeHeight = Math.max(bounds.height, minHeight)

    // Calculate chart dimensions with safety checks
    this.width = Math.max(safeWidth - this.margin.left - this.margin.right, 300)
    this.height = Math.max(safeHeight - this.margin.top - this.margin.bottom, 300)

    // Calculate radius with proper constraints
    const availableWidth = this.width - 120 // Account for legend space
    const availableHeight = this.height
    this.radius = Math.max(80, Math.min(availableWidth * 0.4, availableHeight * 0.4))

    // Update SVG dimensions
    this.svg.attr("viewBox", `0 0 ${safeWidth} ${safeHeight}`).attr("width", safeWidth).attr("height", safeHeight)

    // Position the chart group
    const centerX = (safeWidth - 120) / 2 // Offset for legend
    const centerY = safeHeight / 2
    this.g.attr("transform", `translate(${centerX}, ${centerY})`)

    // Only update if we have valid data
    if (window.dataManager && window.dataManager.isLoaded) {
      this.update()
    }
  }

  update() {
    if (!window.dataManager.isLoaded || this.width <= 0 || this.height <= 0 || this.radius <= 0) return

    // Use all age group data (no filters)
    const data = window.dataManager.getAgeGroupData()

    // Aggregate by age group across all years
    const aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.fines),
      (d) => d.ageGroup,
    )

    const pieData = Array.from(aggregatedData, ([ageGroup, fines]) => ({
      ageGroup,
      fines,
    })).sort((a, b) => b.fines - a.fines)

    // Clear previous content
    this.g.selectAll("*").remove()

    if (pieData.length === 0) {
      this.g
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No data available")
      return
    }

    const pie = d3
      .pie()
      .value((d) => d.fines)
      .sort(null)

    const arc = d3.arc().innerRadius(0).outerRadius(this.radius)
    const labelArc = d3
      .arc()
      .innerRadius(this.radius + 20)
      .outerRadius(this.radius + 20)

    const slices = this.g.selectAll(".pie-slice").data(pie(pieData)).enter().append("g").attr("class", "pie-slice")

    slices
      .append("path")
      .attr("d", arc)
      .style("fill", (d) => window.pieColorScheme(d.data.ageGroup))
      .style("stroke", "white")
      .style("stroke-width", 2)
      .style("cursor", "pointer")

    // Add percentage labels for larger slices
    slices
      .append("text")
      .attr("transform", (d) => {
        const [x, y] = labelArc.centroid(d)
        return `translate(${x}, ${y})`
      })
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("fill", "#333")
      .text((d) => {
        const pct = (((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100).toFixed(1)
        return pct > 5 ? `${pct}%` : ""
      })

    // Add center title
    this.g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Total Fines by Age Group")

    // Add total amount in center
    const totalFines = d3.sum(pieData, (d) => d.fines)
    this.g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text(`Total: $${(totalFines / 1000000).toFixed(1)}M`)

    // Add tooltips
    slices
      .on("mouseover", (event, d) => {
        d3.select(event.target).select("path").style("opacity", 0.8)
        const pct = (((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100).toFixed(1)

        window.tooltip.transition().duration(200).style("opacity", 0.9)
        window.tooltip
          .html(`Age Group: ${d.data.ageGroup}<br/>Fines: $${d.data.fines.toLocaleString()}<br/>Percentage: ${pct}%`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", (event) => {
        d3.select(event.target).select("path").style("opacity", 1)
        window.tooltip.transition().duration(500).style("opacity", 0)
      })

    // Add legend
    this.addLegend(pieData)

    // Add reset zoom button
    this.addResetZoomButton()

    // Add zoom behavior
    this.svg.call(this.zoom)

    // Restore zoom state if exists
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }
  }

  addLegend(pieData) {
    this.svg.selectAll(".legend").remove()

    const legendX = Math.max(this.width + this.margin.left - 110, this.width * 0.75)
    const legendY = 50

    const legend = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${legendX}, ${legendY})`)

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Age Groups")

    const items = legend
      .selectAll(".legend-item")
      .data(pieData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 22})`)
      .style("cursor", "pointer")

    items
      .append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .style("fill", (d) => window.pieColorScheme(d.ageGroup))
      .style("stroke", "white")
      .style("stroke-width", 1)

    items
      .append("text")
      .attr("x", 22)
      .attr("y", 8)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", "#333")
      .text((d) => d.ageGroup)

    items
      .append("text")
      .attr("x", 125)
      .attr("y", 8)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("fill", "#666")
      .style("text-anchor", "end")
      .text((d) => `$${(d.fines / 1000000).toFixed(1)}M`)

    // Legend interactions
    items
      .on("mouseover", (event, d) => {
        this.g.selectAll(".pie-slice path").style("opacity", (slice) => (slice.data.ageGroup === d.ageGroup ? 1 : 0.3))

        window.tooltip.transition().duration(200).style("opacity", 0.9)
        window.tooltip
          .html(`Age Group: ${d.ageGroup}<br/>Fines: $${d.fines.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        this.g.selectAll(".pie-slice path").style("opacity", 1)
        window.tooltip.transition().duration(500).style("opacity", 0)
      })
  }

  addResetZoomButton() {
    // Remove existing button
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

    // Button background
    resetButton
      .append("rect")
      .attr("x", -30)
      .attr("y", -15)
      .attr("width", 60)
      .attr("height", 30)
      .attr("rx", 5)
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("stroke", "#667eea")
      .style("stroke-width", 1)

    // Button text
    resetButton.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").text("Reset").style("fill", "#333")
  }

  zoomed(event) {
    this.currentZoomState = event.transform
    const isTransformed = event.transform.k > 1 || event.transform.x !== 0 || event.transform.y !== 0
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0)

    // Calculate center position accounting for legend offset
    const centerX = (this.width + this.margin.left + this.margin.right - 120) / 2
    const centerY = (this.height + this.margin.top + this.margin.bottom) / 2

    this.g.attr(
      "transform",
      `translate(${centerX + event.transform.x}, ${centerY + event.transform.y}) scale(${event.transform.k})`,
    )
  }

  resetZoom() {
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)
    this.svg.select(".reset-zoom-button").style("opacity", 0)
    this.currentZoomState = null
  }
}

// Initialise pie chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.pieChart = new PieChart()
  window.pieChart.update()
})
