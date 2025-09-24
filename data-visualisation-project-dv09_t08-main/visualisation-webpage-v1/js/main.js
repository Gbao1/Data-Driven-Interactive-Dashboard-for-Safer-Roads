// Main application initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing Road Safety Data Visualization with 4 charts...")

  // Load all data
  const success = await window.dataManager.loadAllData()

  if (!success) {
    console.error("Failed to load data")
    // You could show an error message to the user here
    return
  }

  console.log("Application initialized successfully")
})
