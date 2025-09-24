// Main application initialisation
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing Road Safety Data Visualization...")

  // Load all data
  const success = await window.dataManager.loadAllData()

  if (!success) {
    console.error("Failed to load data")
    // Show error message to user
    showErrorMessage("Failed to load data. Please refresh the page and try again.")
    return
  }

  console.log("Application initialized successfully")

  // Ensure correct initial sizing after data load
  if (window.chartNavigation && window.dataManager && window.dataManager.isLoaded) {
    setTimeout(() => {
      window.chartNavigation.updateCurrentChart()

      // Force update all charts to ensure proper sizing
      setTimeout(() => {
        if (window.dotMap && window.dotMap.updateSize) window.dotMap.updateSize()
        if (window.groupedBarChart && window.groupedBarChart.updateSize) window.groupedBarChart.updateSize()
        if (window.pieChart && window.pieChart.updateSize) window.pieChart.updateSize()
        if (window.radarChart && window.radarChart.updateSize) window.radarChart.updateSize()
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
  // Debounce resize events
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
