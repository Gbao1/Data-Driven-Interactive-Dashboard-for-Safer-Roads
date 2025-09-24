// Radar Chart for Total Fines by Detection Method

class RadarChart {
  constructor() {
    this.margin = { top: 40, right: 180, bottom: 40, left: 40 } // Increased right margin for legend
    this.svg = null
    this.g = null
    this.width = 0
    this.height = 0
    this.radius = 0
    this.zoom = null
    this.currentZoomState = null
    this.isInitialised = false
    // Maximum chart dimensions
    this.maxWidth = 1200
    this.maxHeight = 800

    this.init()
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
    d3.select("#radar-chart").selectAll("*").remove()

    this.svg = d3
      .select("#radar-chart")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true)

    this.g = this.svg.append("g")

    // Create zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 4])
      .on("zoom", (event) => this.zoomed(event))
  }

  updateSize() {
    const container = d3.select("#radar-chart").node()
    if (!container) return

    const bounds = container.getBoundingClientRect()

    if (bounds.width === 0 || bounds.height === 0) {
      setTimeout(() => this.updateSize(), 100)
      return
    }

    const minWidth = 500
    const minHeight = 500

    // Apply maximum size constraints
    const safeWidth = Math.min(Math.max(bounds.width, minWidth), this.maxWidth)
    const safeHeight = Math.min(Math.max(bounds.height, minHeight), this.maxHeight)

    this.width = Math.max(safeWidth - this.margin.left - this.margin.right, 300)
    this.height = Math.max(safeHeight - this.margin.top - this.margin.bottom, 300)

    // Calculate radius with proper constraints, accounting for legend space
    const availableWidth = this.width - 100 // Account for legend space
    const availableHeight = this.height
    this.radius = Math.min(availableWidth, availableHeight) / 2 - 50

    this.svg
      .attr("viewBox", `0 0 ${safeWidth} ${safeHeight}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("max-width", `${this.maxWidth}px`)
      .style("max-height", `${this.maxHeight}px`)
      .style("margin", "0 auto") // Center the chart

    const centerX = (safeWidth - 150) / 2 // Offset for legend
    const centerY = safeHeight / 2
    this.g.attr("transform", `translate(${centerX}, ${centerY})`)

    if (window.dataManager && window.dataManager.isLoaded) {
      this.update()
    }
  }

  update() {
    if (!window.dataManager.isLoaded || this.width <= 0 || this.height <= 0 || this.radius <= 0) return

    const selectedMethods = window.chartNavigation.getSelectedValues("radar-method-filter")
    let data = window.dataManager.getDetectionMethodData()

    // Filter by selected methods
    if (selectedMethods.length > 0) {
      data = data.filter((d) => selectedMethods.includes(d.method))
    }

    // Clear previous content
    this.g.selectAll("*").remove()

    if (data.length === 0) {
      this.g
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No data available")
      return
    }

    // Prepare data for radar chart
    const maxValue = d3.max(data, (d) => d.fines)
    const angleSlice = (Math.PI * 2) / data.length

    // Scale for radius
    const rScale = d3.scaleLinear().domain([0, maxValue]).range([0, this.radius])

    // Draw background circles
    const levels = 5
    for (let i = 1; i <= levels; i++) {
      this.g
        .append("circle")
        .attr("r", (this.radius / levels) * i)
        .style("fill", "none")
        .style("stroke", "#CDCDCD")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.5)
    }

    // Draw axis lines and labels
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2

      // Draw axis line
      this.g
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", this.radius * Math.cos(angle))
        .attr("y2", this.radius * Math.sin(angle))
        .style("stroke", "#CDCDCD")
        .style("stroke-width", 1)

      // Add labels
      const labelRadius = this.radius + 30
      this.g
        .append("text")
        .attr("x", labelRadius * Math.cos(angle))
        .attr("y", labelRadius * Math.sin(angle))
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .style("text-anchor", "middle")
        .text(d.method)
      //.text(d.method.length > 12 ? d.method.substring(0, 12) + "..." : d.method)
    })

    // Create radar area
    const radarLine = d3
      .lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius((d) => rScale(d.fines))
      .curve(d3.curveLinearClosed)

    // Draw the radar area
    this.g
      .append("path")
      .datum(data)
      .attr("d", radarLine)
      .style("fill", "#667eea")
      .style("fill-opacity", 0.3)
      .style("stroke", "#667eea")
      .style("stroke-width", 2)

    // Draw dots for each point
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const r = rScale(d.fines)

      this.g
        .append("circle")
        .attr("cx", r * Math.cos(angle))
        .attr("cy", r * Math.sin(angle))
        .attr("r", 5)
        .style("fill", "#667eea")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", (event) => {
          d3.select(event.target).transition().duration(200).attr("r", 7)

          window.tooltip.transition().duration(200).style("opacity", 0.9)
          window.tooltip
            .html(`Method: ${d.method}<br/>Total Fines: $${d.fines.toLocaleString()}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
        })
        .on("mouseout", (event) => {
          d3.select(event.target).transition().duration(200).attr("r", 5)

          window.tooltip.transition().duration(500).style("opacity", 0)
        })
    })

    // Add value labels on the circles
    for (let i = 1; i <= levels; i++) {
      const value = (maxValue / levels) * i
      this.g
        .append("text")
        .attr("x", 5)
        .attr("y", -(this.radius / levels) * i)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("fill", "#666")
        .text(`$${(value / 1000000).toFixed(1)}M`)
    }

    // Add title
    this.g
      .append("text")
      .attr("x", 0)
      .attr("y", -this.radius - 60)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Detection Method Performance")

    // Add legend
    this.addLegend(data)

    // Add reset zoom button
    this.addResetZoomButton()

    // Add zoom behavior
    this.svg.call(this.zoom)

    // Restore zoom state if exists
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }
  }

  addLegend(data) {
    // Remove existing legend
    this.svg.selectAll(".legend").remove()

    // Always position legend in top right
    const legendX = this.width + this.margin.left
    const legendY = this.margin.top + 10

    const legend = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${legendX}, ${legendY})`)

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text("Detection Methods")

    // Determine if we need to compress the legend
    //const isCompressed = data.length > 8
    const lineHeight = 20

    const legendItems = legend
      .selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * lineHeight})`)
      .style("cursor", "pointer")

    // Add circles for each method
    legendItems
      .append("circle")
      .attr("cx", 8)
      .attr("cy", 8)
      .attr("r", 6)
      .style("fill", "#667eea")
      .style("stroke", "white")
      .style("stroke-width", 1)

    // Add method names
    legendItems
      .append("text")
      .attr("x", 15)
      .attr("y", 12)
      .style("font-size", "12px")
      .style("fill", "#333")
      .text((d) => d.method)

    // Add fine amounts
    legendItems
      .append("text")
      .attr("x", 180)
      .attr("y", 12)
      .style("font-size", "11px")
      .style("fill", "#666")
      .style("text-anchor", "end")
      //.text((d) => `$${(d.fines / 1000000).toFixed(1)}M`)
      // Display the full amount
      .text((d) => {
      const amount = d.fines;
      // Format the number with commas
      const formattedAmount = amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      return `$${formattedAmount}`
      })


    // Add interactivity to legend items
    legendItems
      .on("mouseover", (event, d) => {
        // Highlight corresponding radar point
        const dataIndex = data.findIndex((item) => item.method === d.method)
        const angleSlice = (Math.PI * 2) / data.length
        const angle = angleSlice * dataIndex - Math.PI / 2
        const rScale = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.fines)])
          .range([0, this.radius])
        const r = rScale(d.fines)

        // Highlight the corresponding dot
        this.g
          .selectAll("circle")
          .filter((_, i) => i === dataIndex)
          .transition()
          .duration(200)
          .attr("r", 8)
          .style("fill", "#ff6b6b")

        // Highlight legend item
        d3.select(event.currentTarget).select("text").style("font-weight", "bold")

        // Show tooltip
        window.tooltip.transition().duration(200).style("opacity", 0.9)
        window.tooltip
          .html(`Method: ${d.method}<br/>Total Fines: $${d.fines.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", (event, d) => {
        // Reset radar point
        const dataIndex = data.findIndex((item) => item.method === d.method)

        this.g
          .selectAll("circle")
          .filter((_, i) => i === dataIndex)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("fill", "#667eea")

        // Reset legend text
        d3.select(event.currentTarget).select("text").style("font-weight", "normal")

        // Hide tooltip
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

    const centerX = (this.width + this.margin.left + this.margin.right - 150) / 2
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

// Initialise radar chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.radarChart = new RadarChart()
  window.radarChart.update()
})
