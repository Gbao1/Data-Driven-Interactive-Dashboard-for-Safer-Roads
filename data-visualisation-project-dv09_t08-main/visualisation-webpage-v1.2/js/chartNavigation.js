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
          multiple: true,
        },
        {
          id: "detection-method-filter",
          label: "Filter by Method",
          type: "method",
          dataset: "detection",
          multiple: true,
        },
      ],
      fines: [
        {
          id: "fines-year-start",
          label: "Start Year",
          type: "year",
          dataset: "fines",
          multiple: false,
        },
        {
          id: "fines-year-end",
          label: "End Year",
          type: "year",
          dataset: "fines",
          multiple: false,
        },
      ],
      age: [
        {
          id: "pie-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "age",
          multiple: true,
        },
        {
          id: "pie-age-group-filter",
          label: "Filter by Age Group",
          type: "age",
          dataset: "age",
          multiple: true,
        },
      ],
      jurisdiction: [
        {
          id: "bar-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "jurisdiction",
          multiple: true,
        },
        {
          id: "jurisdiction-filter",
          label: "Filter by Jurisdiction",
          type: "jurisdiction",
          dataset: "jurisdiction",
          multiple: true,
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

    // Initialise with detection method chart
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

      const selectContainer = document.createElement("div")
      selectContainer.className = "select-container"

      if (filterConfig.multiple) {
        // Create multi-select dropdown
        const multiSelect = this.createMultiSelect(filterConfig)
        selectContainer.appendChild(multiSelect)
      } else {
        // Create regular single select
        const select = document.createElement("select")
        select.id = filterConfig.id

        // Add default "All" option
        const defaultOption = document.createElement("option")
        defaultOption.value = "all"
        defaultOption.textContent = this.getDefaultOptionText(filterConfig.type)
        select.appendChild(defaultOption)

        selectContainer.appendChild(select)

        // Add event listener for single select changes
        select.addEventListener("change", () => {
          this.updateCurrentChart()
        })
      }

      filterGroup.appendChild(label)
      filterGroup.appendChild(selectContainer)
      filtersContainer.appendChild(filterGroup)

      // Populate options if data is loaded
      if (window.dataManager && window.dataManager.isLoaded) {
        this.populateFilterOptions(filterConfig)
      }
    })
  }

  createMultiSelect(filterConfig) {
    const container = document.createElement("div")
    container.className = "multi-select-container"
    container.id = filterConfig.id

    const display = document.createElement("div")
    display.className = "multi-select-display"
    display.textContent = `All ${this.getFilterDisplayName(filterConfig.type)}`

    const dropdown = document.createElement("div")
    dropdown.className = "multi-select-dropdown"
    dropdown.style.display = "none"

    const selectAllContainer = document.createElement("div")
    selectAllContainer.className = "select-all-container"

    const selectAllCheckbox = document.createElement("input")
    selectAllCheckbox.type = "checkbox"
    selectAllCheckbox.id = `${filterConfig.id}-select-all`
    selectAllCheckbox.checked = true

    const selectAllLabel = document.createElement("label")
    selectAllLabel.setAttribute("for", `${filterConfig.id}-select-all`)
    selectAllLabel.textContent = "Select All"

    selectAllContainer.appendChild(selectAllCheckbox)
    selectAllContainer.appendChild(selectAllLabel)
    dropdown.appendChild(selectAllContainer)

    const optionsContainer = document.createElement("div")
    optionsContainer.className = "options-container"
    dropdown.appendChild(optionsContainer)

    container.appendChild(display)
    container.appendChild(dropdown)

    // Toggle dropdown visibility
    display.addEventListener("click", () => {
      const isVisible = dropdown.style.display === "block"
      dropdown.style.display = isVisible ? "none" : "block"
    })

    // Handle select all functionality
    selectAllCheckbox.addEventListener("change", () => {
      const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked
      })
      this.updateMultiSelectDisplay(filterConfig.id)
      this.updateCurrentChart()
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = "none"
      }
    })

    return container
  }

  getFilterDisplayName(type) {
    const displayNames = {
      year: "Years",
      method: "Methods",
      jurisdiction: "Jurisdictions",
      age: "Age Groups",
      location: "Locations",
    }
    return displayNames[type] || "Items"
  }

  updateMultiSelectDisplay(filterId) {
    const container = document.getElementById(filterId)
    const display = container.querySelector(".multi-select-display")
    const checkboxes = container.querySelectorAll('.options-container input[type="checkbox"]:checked')
    const selectAllCheckbox = container.querySelector(`#${filterId}-select-all`)

    if (checkboxes.length === 0) {
      display.textContent = "None selected"
      selectAllCheckbox.checked = false
    } else if (checkboxes.length === container.querySelectorAll('.options-container input[type="checkbox"]').length) {
      display.textContent = "All selected"
      selectAllCheckbox.checked = true
    } else {
      display.textContent = `${checkboxes.length} selected`
      selectAllCheckbox.checked = false
    }
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

    if (filterConfig.multiple) {
      this.populateMultiSelectOptions(filterConfig.id, options)
    } else {
      this.populateSingleSelectOptions(filterConfig.id, options)
    }
  }

  populateMultiSelectOptions(filterId, options) {
    const container = document.getElementById(filterId)
    const optionsContainer = container.querySelector(".options-container")

    // Clear existing options
    optionsContainer.innerHTML = ""

    // Add options
    options.forEach((option) => {
      const optionContainer = document.createElement("div")
      optionContainer.className = "option-item"

      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.id = `${filterId}-${option}`
      checkbox.value = option
      checkbox.checked = true

      const label = document.createElement("label")
      label.setAttribute("for", `${filterId}-${option}`)
      label.textContent = option

      optionContainer.appendChild(checkbox)
      optionContainer.appendChild(label)
      optionsContainer.appendChild(optionContainer)

      // Add event listener for individual checkbox changes
      checkbox.addEventListener("change", () => {
        this.updateMultiSelectDisplay(filterId)
        this.updateCurrentChart()
      })
    })

    // Update display
    this.updateMultiSelectDisplay(filterId)
  }

  populateSingleSelectOptions(filterId, options) {
    const select = document.getElementById(filterId)

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
    if (filterId === "fines-year-start" && options.length > 0) {
      select.value = Math.min(...options)
    } else if (filterId === "fines-year-end" && options.length > 0) {
      select.value = Math.max(...options)
    }
  }

  // Helper method to get selected values from multi-select
  getSelectedValues(filterId) {
    const container = document.getElementById(filterId)
    if (!container) return []

    if (container.classList.contains("multi-select-container")) {
      const checkboxes = container.querySelectorAll('.options-container input[type="checkbox"]:checked')
      return Array.from(checkboxes).map((checkbox) => checkbox.value)
    } else {
      const select = container.querySelector("select") || document.getElementById(filterId)
      return select.value === "all" ? [] : [select.value]
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

// Initialise navigation when DOM is loaded
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
