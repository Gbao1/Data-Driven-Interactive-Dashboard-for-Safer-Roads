// Line Chart for Detection Methods

class LineChart {
  constructor() {
    this.margin = { top: 20, right: 200, bottom: 50, left: 60 }
    this.width = 800 - this.margin.left - this.margin.right
    this.height = 400 - this.margin.bottom - this.margin.top
    this.svg = null
    this.g = null

    this.init()
  }

  init() {
    // Create SVG container
    d3.select("#line-chart").selectAll("*").remove()

    this.svg = d3
      .select("#line-chart")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)

    this.g = this.svg.append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`)

    // Initialize filters
    this.initializeFilters()

    // Add event listeners
    d3.select("#detection-year-filter").on("change", () => this.update())
    d3.select("#detection-method-filter").on("change", () => this.update())
  }

  initializeFilters() {
    if (!window.dataManager.isLoaded) return

    const years = window.dataManager.getUniqueYears("detection")
    const methods = window.dataManager.getUniqueDetectionMethods()

    populateSelect("detection-year-filter", years)
    populateSelect("detection-method-filter", methods)
  }

  update() {
    if (!window.dataManager.isLoaded) return

    // Get filter values
    const yearFilter = d3.select("#detection-year-filter").property("value")
    const methodFilter = d3.select("#detection-method-filter").property("value")

    // Filter data
    let filteredData = window.dataManager.getDetectionData()
    if (yearFilter !== "all") {
      filteredData = filteredData.filter((d) => d.year == yearFilter)
    }
    if (methodFilter !== "all") {
      filteredData = filteredData.filter((d) => d.method === methodFilter)
    }

    // Group data by method
    const groupedData = d3.group(filteredData, (d) => d.method)

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.year))
      .range([0, this.width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.count)])
      .range([this.height, 0])

    // Clear previous content
    this.g.selectAll("*").remove()

    // Add axes
    this.g
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))

    this.g.append("g").attr("class", "axis").call(d3.axisLeft(yScale))

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

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX)

    const allDots = []

    groupedData.forEach((values, method) => {
      const sortedValues = values.sort((a, b) => a.year - b.year)

      const methodGroup = this.g.append("g").attr("class", `method-group ${method.replace(/\s+/g, "-")}`)

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
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.count))
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
        const cx = parseFloat(d3.select(dot.element).attr("cx"))
        const cy = parseFloat(d3.select(dot.element).attr("cy"))
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
              .join("<hr>")
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
  }
}

// Initialize line chart when data is loaded
window.addEventListener("dataLoaded", () => {
  window.lineChart = new LineChart()
  window.lineChart.update()
})
