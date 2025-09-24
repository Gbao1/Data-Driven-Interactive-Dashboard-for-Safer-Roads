// Line Chart for Detection Methods

class LineChart {
  constructor() {
    this.margin = { top: 20, right: 160, bottom: 50, left: 60 }
    this.width = 0
    this.height = 0
    this.svg = null
    this.g = null
    this.zoom = null
    this.xScale = null
    this.yScale = null
    this.xAxis = null
    this.yAxis = null
    this.currentZoomState = null
    this.chartContent = null

    this.init()
    this.resize() // Initial sizing
    window.addEventListener("resize", () => this.resize())
  }

  init() {
    // Create SVG container
    d3.select("#line-chart").selectAll("*").remove()

    this.svg = d3
      .select("#line-chart")
      .append("svg")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true)

    this.g = this.svg.append("g")

    // Create zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => this.zoomed(event))
  }

  addResetZoomButton() {
    // Remove existing button if it exists
    this.svg.select(".reset-zoom-button").remove()

    // Add reset zoom button
    const resetButton = this.svg
      .append("g")
      .attr("class", "reset-zoom-button")
      .attr("transform", `translate(${this.width + this.margin.left - 30}, 30)`)
      .style("cursor", "pointer")
      .style("opacity", 0) // Start hidden
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

  resize() {
    // Get container size and update chart dimensions
    const container = d3.select("#line-chart").node()
    const boundingRect = container.getBoundingClientRect()
    const newWidth = boundingRect.width
    const newHeight = boundingRect.height

    this.width = newWidth - this.margin.left - this.margin.right
    this.height = newHeight - this.margin.top - this.margin.bottom

    this.svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`).attr("width", newWidth).attr("height", newHeight)

    this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    // Update zoom extent
    if (this.zoom) {
      this.zoom.extent([
        [0, 0],
        [this.width, this.height],
      ])
    }

    this.update()
  }

  update() {
    if (!window.dataManager.isLoaded) return

    // Get filter values using the new multi-select system
    const selectedYears = window.chartNavigation.getSelectedValues("detection-year-filter")
    const selectedMethods = window.chartNavigation.getSelectedValues("detection-method-filter")

    // Filter data based on multi-select values
    let filteredData = window.dataManager.getDetectionData()

    // Filter by years (if any are selected)
    if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year.toString()))
    }

    // Filter by methods (if any are selected)
    if (selectedMethods.length > 0) {
      filteredData = filteredData.filter((d) => selectedMethods.includes(d.method))
    }

    // Group data by method
    const groupedData = d3.group(filteredData, (d) => d.method)

    // Scales
    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.year))
      .range([0, this.width])

    this.yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.count)])
      .range([this.height, 0])

    // Clear previous content
    this.g.selectAll("*").remove()

    // Create clip path for zoom
    this.svg.select("defs").remove()

    this.svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip-line")
      .append("rect")
      .attr("width", this.width)
      .attr("height", this.height)

    // Create axes
    this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.format("d"))
    this.yAxis = d3.axisLeft(this.yScale)

    // Add axes
    this.gxAxis = this.g
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(this.xAxis)

    this.gyAxis = this.g.append("g").attr("class", "axis y-axis").call(this.yAxis)

    // Add axis labels
    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Number of Offences")

    this.g
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${this.width / 2}, ${this.height + this.margin.bottom})`)
      .style("text-anchor", "middle")
      .text("Year")

    // Create chart content group with clipping
    this.chartContent = this.g.append("g").attr("clip-path", "url(#clip-line)")

    // Line generator
    const line = d3
      .line()
      .x((d) => this.xScale(d.year))
      .y((d) => this.yScale(d.count))
      .curve(d3.curveMonotoneX)

    const allDots = []

    groupedData.forEach((values, method) => {
      const sortedValues = values.sort((a, b) => a.year - b.year)

      const methodGroup = this.chartContent.append("g").attr("class", `method-group ${method.replace(/\s+/g, "-")}`)

      methodGroup
        .append("path")
        .datum(sortedValues)
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", window.colorScheme(method))
        .style("fill", "none")
        .style("stroke-width", 2)

      methodGroup
        .selectAll(".dot")
        .data(sortedValues)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => this.xScale(d.year))
        .attr("cy", (d) => this.yScale(d.count))
        .attr("r", 6)
        .style("fill", window.colorScheme(method))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .each(function (d) {
          allDots.push({ element: this, data: d, method: method })
        })
    })

    // Handle multi-tooltips
    this.svg.on("mousemove", (event) => {
      const [mouseX, mouseY] = d3.pointer(event, this.g.node())
      const radius = 8 // pixel distance to consider overlapping

      const hoveredDots = allDots.filter((dot) => {
        const cx = Number.parseFloat(d3.select(dot.element).attr("cx"))
        const cy = Number.parseFloat(d3.select(dot.element).attr("cy"))
        const dx = cx - mouseX
        const dy = cy - mouseY
        return Math.sqrt(dx * dx + dy * dy) <= radius
      })

      if (hoveredDots.length > 0) {
        window.tooltip.transition().duration(100).style("opacity", 0.9)
        window.tooltip
          .html(
            hoveredDots
              .map((dot) => `Method: ${dot.data.method}<br/>Year: ${dot.data.year}<br/>Count: ${dot.data.count}`)
              .join("<hr>"),
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      } else {
        window.tooltip.transition().duration(200).style("opacity", 0)
      }
    })

    // Add legend
    const legend = this.g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.width + 10}, 20)`)

    const legendItems = legend
      .selectAll(".legend-item")
      .data(Array.from(groupedData.keys()))
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)

    legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", (d) => window.colorScheme(d))

    legendItems
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .text((d) => d)

    // Add reset zoom button
    this.addResetZoomButton()

    // Add zoom behavior to the chart
    this.svg.call(this.zoom)

    // If we have a saved zoom state, restore it
    if (this.currentZoomState) {
      this.svg.call(this.zoom.transform, this.currentZoomState)
    }
  }

  zoomed(event) {
    // Save current zoom state
    this.currentZoomState = event.transform

    // Show reset button when zoomed or panned
    const isTransformed = event.transform.k > 1 || event.transform.x !== 0 || event.transform.y !== 0
    this.svg.select(".reset-zoom-button").style("opacity", isTransformed ? 1 : 0)

    // Create new scales based on zoom event
    const newXScale = event.transform.rescaleX(this.xScale)
    const newYScale = event.transform.rescaleY(this.yScale)

    // Update axes
    this.gxAxis.call(this.xAxis.scale(newXScale))
    this.gyAxis.call(this.yAxis.scale(newYScale))

    // Update lines
    this.chartContent.selectAll(".line").attr(
      "d",
      d3
        .line()
        .x((d) => newXScale(d.year))
        .y((d) => newYScale(d.count))
        .curve(d3.curveMonotoneX),
    )

    // Update dots
    this.chartContent
      .selectAll(".dot")
      .attr("cx", (d) => newXScale(d.year))
      .attr("cy", (d) => newYScale(d.count))
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

// Initialise line chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.lineChart = new LineChart()
  window.lineChart.update()
})
