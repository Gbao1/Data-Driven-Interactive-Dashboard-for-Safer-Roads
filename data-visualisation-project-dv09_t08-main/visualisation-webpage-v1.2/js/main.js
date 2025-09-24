// Main application initialisation
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing Road Safety Data Visualization with tabbed interface...")

  // Load all data
  const success = await window.dataManager.loadAllData()

  if (!success) {
    console.error("Failed to load data")
    // Show error message to user
    showErrorMessage("Failed to load data. Please refresh the page and try again.")
    return
  }

  console.log("Application initialized successfully with chart navigation")

  // Ensure correct initial sizing after data load with longer delay
  if (window.chartNavigation && window.dataManager && window.dataManager.isLoaded) {
    setTimeout(() => {
      window.chartNavigation.updateCurrentChart()

      // Force update all charts to ensure proper sizing
      setTimeout(() => {
        if (window.lineChart && window.lineChart.resize) window.lineChart.resize()
        if (window.pieChart && window.pieChart.updateSize) window.pieChart.updateSize()
        if (window.barChart && window.barChart.updateSize) window.barChart.updateSize()
        if (window.finesChart && window.finesChart.resize) window.finesChart.resize()
      }, 200)
    }, 150) // Increased delay to allow layout to fully settle
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
    const chartTypes = ["detection", "fines", "age", "jurisdiction"]
    const index = Number.parseInt(e.key) - 1
    if (chartTypes[index] && window.chartNavigation) {
      window.chartNavigation.switchChart(chartTypes[index])
    }
  }
})
