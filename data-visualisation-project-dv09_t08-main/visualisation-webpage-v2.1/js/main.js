// Main application initialisation
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initialising Road Safety Data Visualization...")

  // Load all data
  const success = await window.dataManager.loadAllData()

  if (!success) {
    console.error("Failed to load data")
    showErrorMessage("Failed to load data. Please refresh the page and try again.")
    return
  }

  console.log("Application initialised successfully")

  // Ensure correct initial sizing after data load
  if (window.chartNavigation && window.dataManager && window.dataManager.isLoaded) {
    setTimeout(() => {
      // Hide all charts initially
      document.querySelectorAll(".chart-section").forEach((section) => {
        section.classList.remove("active")
      })

      // Initialise navigation which will show the correct chart
      window.chartNavigation.updateCurrentChart()

      // Force update all charts to ensure proper sizing, but only update active ones
      setTimeout(() => {
        const currentChart = window.chartNavigation.getCurrentChart()

        if (currentChart === "jurisdiction" && window.dotMap && window.dotMap.updateSize) {
          window.dotMap.updateSize()
        }
        if (currentChart === "grouped-bar" && window.groupedBarChart && window.groupedBarChart.updateSize) {
          window.groupedBarChart.updateSize()
        }
        if (currentChart === "age" && window.pieChart && window.pieChart.updateSize) {
          window.pieChart.updateSize()
        }
        if (currentChart === "radar" && window.radarChart && window.radarChart.updateSize) {
          window.radarChart.updateSize()
        }
      }, 200)
    }, 150)
  }
})

// Error handling function
function showErrorMessage(message) {
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message"
  errorDiv.innerHTML = `
    <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 5px; margin: 1rem; text-align: center;">
      <strong>Error:</strong> ${message}
    </div>
  `
  document.querySelector("main").prepend(errorDiv)
}

// Handle window resize for responsive charts
window.addEventListener("resize", () => {
  clearTimeout(window.resizeTimeout)
  window.resizeTimeout = setTimeout(() => {
    if (window.chartNavigation && window.dataManager && window.dataManager.isLoaded) {
      window.chartNavigation.updateCurrentChart()
    }
  }, 250)
})

// Add keyboard navigation support
document.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "4") {
    const chartTypes = ["jurisdiction", "grouped-bar", "age", "radar"]
    const index = Number.parseInt(e.key) - 1
    if (chartTypes[index] && window.chartNavigation) {
      window.chartNavigation.switchChart(chartTypes[index])
    }
  }
})
