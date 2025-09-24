// Grouped Bar Chart for Detection Method Trends

class GroupedBarChart {
  constructor() {
    this.margin = { top: 20, right: 180, bottom: 80, left: 80 }
    this.svg = null
    this.g = null
    this.width = 0
    this.height = 0
    this.isInitialised = false
    this.zoom = null
    this.x0 = null
    this.x1 = null
    this.y = null
    this.xLinear = null
    this.xAxis = null
    this.yAxis = null
    this.gxAxis = null
    this.gyAxis = null
    this.currentZoomState = null
    this.chartContent = null
    this.lineGroup = null
    this.years = []
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
    d3.select("#grouped-bar-chart").selectAll("*").remove()

    this.svg = d3
      .select("#grouped-bar-chart")
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

  updateSize() {
    const container = d3.select("#grouped-bar-chart").node()
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

    if (window.dataManager && window.dataManager.isLoaded) {
      this.update()
    }
  }

  update() {
    if (!window.dataManager.isLoaded || this.width <= 0 || this.height <= 0) return

    const selectedYears = window.chartNavigation.getSelectedValues("grouped-year-filter")
    const selectedMethods = window.chartNavigation.getSelectedValues("grouped-method-filter")

    let filteredData = window.dataManager.getDetectionTrendData()

    // Filter by years
    if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year.toString()))
    }

    // Filter by methods
    if (selectedMethods.length > 0) {
      filteredData = filteredData.filter((d) => selectedMethods.includes(d.method))
    }

    // Clear previous content
    this.g.selectAll("*").remove()

    if (filteredData.length === 0) {
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

    // Get unique years and methods
    this.years = [...new Set(filteredData.map((d) => d.year))].sort()
    const methods = [...new Set(filteredData.map((d) => d.method))].sort()

    // Create nested data structure
    const nestedData = this.years.map((year) => {
      const yearData = { year }
      let totalForYear = 0
      methods.forEach((method) => {
        const item = filteredData.find((d) => d.year === year && d.method === method)
        const fines = item ? item.fines : 0
        yearData[method] = fines
        totalForYear += fines
      })
      yearData.total = totalForYear
      return yearData
    })

    // Calculate the maximum value for Y scale (considering both individual methods and totals)
    const maxIndividualFines = d3.max(filteredData, (d) => d.fines)
    const maxTotalFines = d3.max(nestedData, (d) => d.total)
    const yMax = Math.max(maxIndividualFines, maxTotalFines)

    // Initialise scales
    this.x0 = d3.scaleBand().domain(this.years).range([0, this.width]).paddingInner(0.1)
    this.x1 = d3.scaleBand().domain(methods).range([0, this.x0.bandwidth()]).padding(0.05)
    this.y = d3.scaleLinear().domain([0, yMax]).nice().range([this.height, 0])

    // Create a linear scale for zoom (maps year indices to positions)
    this.xLinear = d3
      .scaleLinear()
      .domain([0, this.years.length - 1])
      .range([0, this.width])

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(methods)

    // Create clip path for zoom
    this.svg.select("defs").remove()
    this.svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip-grouped-bar")
      .append("rect")
      .attr("width", Math.max(this.width, 0))
      .attr("height", Math.max(this.height, 0))

    // Initialise axes
    this.xAxis = d3.axisBottom(this.x0).tickFormat(d3.format("d"))
    this.yAxis = d3.axisLeft(this.y).tickFormat(d3.format(".2s"))

    this.gxAxis = this.g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(this.xAxis)
    this.gyAxis = this.g.append("g").attr("class", "y-axis").call(this.yAxis)

    // Axis labels
    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Total Fines ($)")

    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${this.width / 2}, ${this.height + this.margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Year")

    // Create chart content group with clipping
    this.chartContent = this.g.append("g").attr("clip-path", "url(#clip-grouped-bar)")

    // Create groups for each year
    const yearGroups = this.chartContent
      .selectAll(".year-group")
      .data(nestedData)
      .enter()
      .append("g")
      .attr("class", "year-group")
      .attr("transform", (d) => `translate(${this.x0(d.year)},0)`)

    // Create bars for each method within each year
    methods.forEach((method) => {
      yearGroups
        .append("rect")
        .attr("class", "bar")
        .attr("data-method", method)
        .attr("data-year", (d) => d.year)
        .attr("x", this.x1(method))
        .attr("y", (d) => this.y(d[method]))
        .attr("width", this.x1.bandwidth())
        .attr("height", (d) => this.height - this.y(d[method]))
        .style("fill", color(method))
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
          d3.select(event.target).style("opacity", 0.8)

          window.tooltip.transition().duration(200).style("opacity", 0.9)
          window.tooltip
            .html(`Year: ${d.year}<br/>Method: ${method}<br/>Fines: $${d[method].toLocaleString()}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px")
        })
        .on("mouseout", (event) => {
          d3.select(event.target).style("opacity", 1)
          window.tooltip.transition().duration(500).style("opacity", 0)
        })
    })

    // Add total fines line
    this.addTotalFinesLine(nestedData)

    // Add reset zoom button
    this.addResetZoomButton()

    // Add zoom behavior only after scales are initialised
    this.svg.call(this.zoom)

    // Restore zoom state if exists
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }

    // Add legend
    this.addLegend(methods, color)
  }

  addTotalFinesLine(nestedData) {
    // Create line group within chart content for clipping
    this.lineGroup = this.chartContent.append("g").attr("class", "total-line-group")

    // Create line generator
    const line = d3
      .line()
      .x((d) => this.x0(d.year) + this.x0.bandwidth() / 2) // Center of each year group
      .y((d) => this.y(d.total))
      .curve(d3.curveMonotoneX)

    // Add the line path
    this.lineGroup
      .append("path")
      .datum(nestedData)
      .attr("class", "total-line")
      .attr("d", line)
      .style("fill", "none")
      .style("stroke", "#e74c3c")
      .style("stroke-width", 3)
      .style("stroke-dasharray", "5,5")

    // Add dots for each data point
    this.lineGroup
      .selectAll(".total-dot")
      .data(nestedData)
      .enter()
      .append("circle")
      .attr("class", "total-dot")
      .attr("data-year", (d) => d.year)
      .attr("cx", (d) => this.x0(d.year) + this.x0.bandwidth() / 2)
      .attr("cy", (d) => this.y(d.total))
      .attr("r", 5)
      .style("fill", "#e74c3c")
      .style("stroke", "white")
      .style("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.target).transition().duration(200).attr("r", 7)

        window.tooltip.transition().duration(200).style("opacity", 0.9)
        window.tooltip
          .html(`Year: ${d.year}<br/>Total Fines: $${d.total.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", (event) => {
        d3.select(event.target).transition().duration(200).attr("r", 5)
        window.tooltip.transition().duration(500).style("opacity", 0)
      })
  }

  addLegend(methods, color) {
    // Remove existing legend
    this.svg.selectAll(".legend").remove()

    // Always position legend in top right
    const legendX = this.width + this.margin.left + 10
    const legendY = this.margin.top + 10

    const legend = this.svg.append("g").attr("class", "legend").attr("transform", `translate(${legendX}, ${legendY})`)

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Detection Methods")

    const lineHeight = 20

    // Add detection method legend items
    const legendItems = legend
      .selectAll(".legend-item")
      .data(methods)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * lineHeight})`)

    legendItems
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", (d) => color(d))

    legendItems
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "12px")
      .text((d) => d)

    // Add total line legend item
    const totalLegendY = methods.length * lineHeight + 10
    const totalLegendItem = legend
      .append("g")
      .attr("class", "total-legend-item")
      .attr("transform", `translate(0, ${totalLegendY})`)

    totalLegendItem
      .append("line")
      .attr("x1", 0)
      .attr("y1", 6)
      .attr("x2", 12)
      .attr("y2", 6)
      .style("stroke", "#e74c3c")
      .style("stroke-width", 3)
      .style("stroke-dasharray", "5,5")

    totalLegendItem
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Total Fines")

    // Add interactivity to legend items
    legendItems
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        // Highlight corresponding bars
        this.chartContent.selectAll(`.bar[data-method="${d}"]`).style("opacity", 1)
        this.chartContent.selectAll(`.bar:not([data-method="${d}"])`).style("opacity", 0.3)
        // Dim the total line
        this.lineGroup.selectAll(".total-line, .total-dot").style("opacity", 0.3)

        // Highlight legend item
        d3.select(event.currentTarget).select("text").style("font-weight", "bold")
      })
      .on("mouseout", () => {
        // Reset all bars and line
        this.chartContent.selectAll(".bar").style("opacity", 1)
        this.lineGroup.selectAll(".total-line, .total-dot").style("opacity", 1)

        // Reset legend text
        legend.selectAll("text").style("font-weight", "normal")
      })

    // Add interactivity to total line legend
    totalLegendItem
      .style("cursor", "pointer")
      .on("mouseover", (event) => {
        // Highlight total line
        this.lineGroup.selectAll(".total-line, .total-dot").style("opacity", 1)
        this.chartContent.selectAll(".bar").style("opacity", 0.3)

        d3.select(event.currentTarget).select("text").style("font-weight", "bold")
      })
      .on("mouseout", () => {
        // Reset all elements
        this.chartContent.selectAll(".bar").style("opacity", 1)
        this.lineGroup.selectAll(".total-line, .total-dot").style("opacity", 1)

        legend.selectAll("text").style("font-weight", "normal")
      })
  }

  addResetZoomButton() {
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
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("stroke", "#667eea")
      .style("stroke-width", 1)

    resetButton.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").text("Reset").style("fill", "#333")
  }

  zoomed(event) {
    // Check if scales are properly initialised
    if (!this.x0 || !this.y || !this.gxAxis || !this.gyAxis || !this.xLinear) {
      console.warn("Scales not initialised, skipping zoom")
      return
    }

    this.currentZoomState = event.transform
    const isTransformed = event.transform.k > 1 || event.transform.x !== 0 || event.transform.y !== 0
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0)

    // Use linear scale for X zoom and regular rescale for Y
    const newXLinear = event.transform.rescaleX(this.xLinear)
    const newY = event.transform.rescaleY(this.y)

    // Update Y axis
    this.gyAxis.call(this.yAxis.scale(newY))

    // Create new band scale based on transformed linear scale
    const newX0 = d3
      .scaleBand()
      .domain(this.years)
      .range([newXLinear(0), newXLinear(this.years.length - 1)])
      .paddingInner(0.1)

    // Update X axis
    this.gxAxis.call(this.xAxis.scale(newX0))

    // Update year groups positioning
    this.chartContent.selectAll(".year-group").attr("transform", (d) => `translate(${newX0(d.year)},0)`)

    // Update individual bars within each group - only update heights for Y zoom
    this.chartContent
      .selectAll(".bar")
      .attr("y", function (d) {
        const method = d3.select(this).attr("data-method")
        return newY(d[method] || 0)
      })
      .attr("height", function (d) {
        const method = d3.select(this).attr("data-method")
        return Math.max(
          0,
          this.parentNode.__data__.year
            ? this.parentNode.parentNode.getBoundingClientRect().height - newY(d[method] || 0)
            : 0,
        )
      })

    // Update total line and dots
    if (this.lineGroup) {
      this.lineGroup
        .selectAll(".total-dot")
        .attr("cx", (d) => newX0(d.year) + newX0.bandwidth() / 2)
        .attr("cy", (d) => newY(d.total))

      // Update line path
      const line = d3
        .line()
        .x((d) => newX0(d.year) + newX0.bandwidth() / 2)
        .y((d) => newY(d.total))
        .curve(d3.curveMonotoneX)

      this.lineGroup.select(".total-line").attr("d", line)
    }
  }

  resetZoom() {
    this.svg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity)
    this.svg.select(".reset-zoom-button").style("opacity", 0)
    this.currentZoomState = null
  }
}

// Initialise grouped bar chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.groupedBarChart = new GroupedBarChart()
  window.groupedBarChart.update()
})
