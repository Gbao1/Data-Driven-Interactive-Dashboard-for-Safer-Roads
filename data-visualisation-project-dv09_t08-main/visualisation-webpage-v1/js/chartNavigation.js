// Chart Navigation Controller with Dynamic Filters
class ChartNavigation {
  constructor() {
    this.currentChart = "detection"
    this.filterConfigs = {
      detection: [
        {
          id: "detection-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "detection",
        },
        {
          id: "detection-method-filter",
          label: "Filter by Method",
          type: "method",
          dataset: "detection",
        },
      ],
      fines: [
        {
          id: "fines-year-start",
          label: "Start Year",
          type: "year",
          dataset: "fines",
        },
        {
          id: "fines-year-end",
          label: "End Year",
          type: "year",
          dataset: "fines",
        },
      ],
      age: [
        {
          id: "pie-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "age",
        },
      ],
      jurisdiction: [
        {
          id: "bar-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "jurisdiction",
        },
        {
          id: "jurisdiction-filter",
          label: "Filter by Jurisdiction",
          type: "jurisdiction",
          dataset: "jurisdiction",
        },
      ],
    }
    this.init()
  }

  init() {
    // Add event listeners to navigation buttons
    const navButtons = document.querySelectorAll(".nav-btn")
    navButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const chartType = e.target.getAttribute("data-chart")
        this.switchChart(chartType)
      })
    })

    // Initialize with detection method chart
    this.switchChart("detection")
  }

  switchChart(chartType) {
    // Update current chart
    this.currentChart = chartType

    // Update button states
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-chart="${chartType}"]`).classList.add("active")

    // Hide all chart sections
    document.querySelectorAll(".chart-section").forEach((section) => {
      section.classList.remove("active")
    })

    // Show selected chart section
    const targetSection = document.getElementById(`${chartType}-chart-section`)
    if (targetSection) {
      targetSection.classList.add("active")
    }

    // Update dynamic filters
    this.updateFilters(chartType)

    // Update the chart if it exists and data is loaded
    if (window.dataManager && window.dataManager.isLoaded) {
      this.updateCurrentChart()
    }

    // Dispatch custom event for chart switching
    window.dispatchEvent(
      new CustomEvent("chartSwitched", {
        detail: { chartType },
      }),
    )
  }

  updateFilters(chartType) {
    const filtersContainer = document.getElementById("dynamic-filters")
    const config = this.filterConfigs[chartType]

    // Clear existing filters
    filtersContainer.innerHTML = ""

    // Create new filters based on chart type
    config.forEach((filterConfig) => {
      const filterGroup = document.createElement("div")
      filterGroup.className = "filter-group"

      const label = document.createElement("label")
      label.setAttribute("for", filterConfig.id)
      label.textContent = filterConfig.label

      const select = document.createElement("select")
      select.id = filterConfig.id

      // Add default "All" option
      const defaultOption = document.createElement("option")
      defaultOption.value = "all"
      defaultOption.textContent = this.getDefaultOptionText(filterConfig.type)
      select.appendChild(defaultOption)

      filterGroup.appendChild(label)
      filterGroup.appendChild(select)
      filtersContainer.appendChild(filterGroup)

      // Populate options if data is loaded
      if (window.dataManager && window.dataManager.isLoaded) {
        this.populateFilterOptions(filterConfig)
      }

      // Add event listener for filter changes
      select.addEventListener("change", () => {
        this.updateCurrentChart()
      })
    })
  }

  getDefaultOptionText(type) {
    const defaults = {
      year: "All Years",
      method: "All Methods",
      jurisdiction: "All Jurisdictions",
      age: "All Age Groups",
      location: "All Locations",
    }
    return defaults[type] || "All"
  }

  populateFilterOptions(filterConfig) {
    const select = document.getElementById(filterConfig.id)
    let options = []

    switch (filterConfig.type) {
      case "year":
        options = window.dataManager.getUniqueYears(filterConfig.dataset)
        break
      case "method":
        options = window.dataManager.getUniqueDetectionMethods()
        break
      case "jurisdiction":
        options = window.dataManager.getUniqueJurisdictions()
        break
      case "age":
        options = window.dataManager.getUniqueAgeGroups()
        break
    }

    // Remove existing options (except the first "All" option)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild)
    }

    // Add new options
    options.forEach((option) => {
      const optionElement = document.createElement("option")
      optionElement.value = option
      optionElement.textContent = option
      select.appendChild(optionElement)
    })

    // Set default values for year range filters
    if (filterConfig.id === "fines-year-start" && options.length > 0) {
      select.value = Math.min(...options)
    } else if (filterConfig.id === "fines-year-end" && options.length > 0) {
      select.value = Math.max(...options)
    }
  }

  updateCurrentChart() {
    // Update the currently active chart
    switch (this.currentChart) {
      case "detection":
        if (window.lineChart) {
          window.lineChart.update()
        }
        break
      case "fines":
        if (window.finesChart) {
          window.finesChart.update()
        }
        break
      case "age":
        if (window.pieChart) {
          window.pieChart.update()
        }
        break
      case "jurisdiction":
        if (window.barChart) {
          window.barChart.update()
        }
        break
    }
  }

  getCurrentChart() {
    return this.currentChart
  }

  // Method to populate all filters when data is loaded
  populateAllFilters() {
    const config = this.filterConfigs[this.currentChart]
    config.forEach((filterConfig) => {
      this.populateFilterOptions(filterConfig)
    })
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chartNavigation = new ChartNavigation()
})

// Update filters when data is loaded
window.addEventListener("dataLoaded", () => {
  if (window.chartNavigation) {
    window.chartNavigation.populateAllFilters()
    window.chartNavigation.updateCurrentChart()
  }
})
