// Chart Navigation Controller with Dynamic Filters
class ChartNavigation {
  constructor() {
    this.currentChart = "welcome" // Start with welcome state
    this.filterConfigs = {
      jurisdiction: [
        {
          id: "jurisdiction-year-filter",
          label: "Filter by Year",
          type: "year",
          dataset: "jurisdiction",
          multiple: false,
        },
      ],
      "grouped-bar": [
        {
          id: "grouped-year-filter",
          label: "Filter by Years",
          type: "year",
          dataset: "trend",
          multiple: true,
        },
        {
          id: "grouped-method-filter",
          label: "Filter by Detection Method",
          type: "method",
          dataset: "trend",
          multiple: true,
        },
      ],
      age: [], // No filters needed
      radar: [
        {
          id: "radar-method-filter",
          label: "Filter by Detection Method",
          type: "method",
          dataset: "detection",
          multiple: true,
        },
      ],
      welcome: [], // Add welcome state with no filters
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

    // Don't hide sections initially - let HTML control initial state
    // Initialise with welcome state but don't override HTML
    this.currentChart = "welcome"

    // Set initial filter message
    const filtersContainer = document.getElementById("dynamic-filters")
    if (filtersContainer && !filtersContainer.innerHTML.trim()) {
      filtersContainer.innerHTML = "<p>Select a visualisation to see available filters.</p>"
    }
  }

  switchChart(chartType) {
    console.log(`Switching to chart: ${chartType}`) // Debug log

    // Update current chart
    this.currentChart = chartType

    // Update button states
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active")
    })

    // Only add active class if it's not the welcome state
    if (chartType !== "welcome") {
      const targetButton = document.querySelector(`[data-chart="${chartType}"]`)
      if (targetButton) {
        targetButton.classList.add("active")
      }
    }

    // Hide all chart sections
    document.querySelectorAll(".chart-section").forEach((section) => {
      section.classList.remove("active")
      section.style.display = "none"
    })

    // Hide all description sections
    document.querySelectorAll(".chart-description").forEach((description) => {
      description.classList.remove("active")
      description.style.display = "none"
    })

    // Show selected chart section
    if (chartType === "welcome") {
      const welcomeSection = document.getElementById("welcome-state")
      if (welcomeSection) {
        welcomeSection.classList.add("active")
        welcomeSection.style.display = "block"
        console.log("Welcome section should now be visible") // Debug log
      }
    } else {
      const targetSection = document.getElementById(`${chartType}-chart-section`)
      if (targetSection) {
        targetSection.classList.add("active")
        targetSection.style.display = "block"
      }
    }

    // Show corresponding description section
    const targetDescription = document.getElementById(`${chartType}-description`)
    if (targetDescription) {
      targetDescription.classList.add("active")
      targetDescription.style.display = "block"
    }

    // Update dynamic filters only for actual charts, not welcome state
    if (chartType !== "welcome") {
      this.updateFilters(chartType)

      // Update the chart if it exists and data is loaded
      if (window.dataManager && window.dataManager.isLoaded) {
        this.updateCurrentChart()
      }
    } else {
      // Clear filters for welcome state
      const filtersContainer = document.getElementById("dynamic-filters")
      if (filtersContainer) {
        filtersContainer.innerHTML = "<p>Select a visualisation to see available filters.</p>"
      }
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

    if (config.length === 0) {
      filtersContainer.innerHTML = "<p>No filters available for this chart.</p>"
      return
    }

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
        if (filterConfig.dataset === "detection") {
          options = [...new Set(window.dataManager.getDetectionMethodData().map((d) => d.method))].sort()
        } else {
          options = window.dataManager.getUniqueDetectionMethods()
        }
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
  }

  // Helper method to get selected values from multi-select or single select
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
      case "jurisdiction":
        if (window.dotMap) {
          window.dotMap.update()
        }
        break
      case "grouped-bar":
        if (window.groupedBarChart) {
          window.groupedBarChart.update()
        }
        break
      case "age":
        if (window.pieChart) {
          window.pieChart.update()
        }
        break
      case "radar":
        if (window.radarChart) {
          window.radarChart.update()
        }
        break
      case "welcome":
        // No chart to update for welcome state
        break
    }
  }

  getCurrentChart() {
    return this.currentChart
  }

  // Method to populate all filters when data is loaded
  populateAllFilters() {
    // Add guard clause to prevent errors when current chart doesn't have filters
    if (!this.filterConfigs[this.currentChart]) {
      console.warn(`No filter configuration found for chart: ${this.currentChart}`)
      return
    }

    const config = this.filterConfigs[this.currentChart]
    if (config && config.length > 0) {
      config.forEach((filterConfig) => {
        this.populateFilterOptions(filterConfig)
      })
    }
  }
}

// Initialise navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure all elements are properly rendered
  setTimeout(() => {
    window.chartNavigation = new ChartNavigation()
  }, 50)
})

// Update filters when data is loaded
window.addEventListener("dataLoaded", () => {
  if (window.chartNavigation && window.chartNavigation.getCurrentChart() !== "welcome") {
    window.chartNavigation.populateAllFilters()
    window.chartNavigation.updateCurrentChart()
  }
})
