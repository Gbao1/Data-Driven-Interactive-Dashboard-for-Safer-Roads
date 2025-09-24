// Data loading and management module

class DataManager {
  constructor() {
    this.detectionData = []
    this.ageGroupData = []
    this.jurisdictionData = []
    this.finesData = []
    this.isLoaded = false
  }

  // Load all CSV data
  async loadAllData() {
    try {
      console.log("Loading data...")

      // Load detection method data
      const detectionResponse = await fetch(
        "data/Detection_method_trend.csv",
      )
      const detectionText = await detectionResponse.text()
      this.detectionData = d3.csvParse(detectionText, (d) => ({
        year: +d.YEAR,
        method: d.DETECTION_METHOD,
        count: +d["Count*(OffenceNo)"],
      }))

      // Load age group data
      const ageResponse = await fetch(
        "data/fines_by_age_groups.csv",
      )
      const ageText = await ageResponse.text()
      this.ageGroupData = d3.csvParse(ageText, (d) => ({
        year: +d.YEAR,
        ageGroup: d.AGE_GROUP,
        fines: +d["Sum(FINES)"],
      }))

      // Load jurisdiction data
      const jurisdictionResponse = await fetch(
        "data/Speeding_by_jurisdiction_and_location.csv",
      )
      const jurisdictionText = await jurisdictionResponse.text()
      this.jurisdictionData = d3.csvParse(jurisdictionText, (d) => ({
        year: +d.YEAR,
        jurisdiction: d.JURISDICTION,
        location: d.LOCATION,
        count: +d["Count*(OffenceNo)"],
      }))

      // Load fines by year data
      const finesResponse = await fetch(
        "data/fines_by_year.csv",
      )
      const finesText = await finesResponse.text()
      this.finesData = d3.csvParse(finesText, (d) => ({
        year: +d.YEAR,
        meanFines: +d["Mean(FINES)"],
      }))

      this.isLoaded = true
      console.log("Data loaded successfully")

      // Dispatch custom event to notify charts that data is ready
      window.dispatchEvent(new CustomEvent("dataLoaded"))

      return true
    } catch (error) {
      console.error("Error loading data:", error)
      return false
    }
  }

  // Getter methods for accessing data
  getDetectionData() {
    return this.detectionData
  }

  getAgeGroupData() {
    return this.ageGroupData
  }

  getJurisdictionData() {
    return this.jurisdictionData
  }

  getFinesData() {
    return this.finesData
  }

  // Utility methods for getting unique values
  getUniqueYears(dataset = "all") {
    let data = []
    switch (dataset) {
      case "detection":
        data = this.detectionData
        break
      case "age":
        data = this.ageGroupData
        break
      case "jurisdiction":
        data = this.jurisdictionData
        break
      case "fines":
        data = this.finesData
        break
      default:
        data = [...this.detectionData, ...this.ageGroupData, ...this.jurisdictionData, ...this.finesData]
    }
    return [...new Set(data.map((d) => d.year))].sort()
  }

  getUniqueDetectionMethods() {
    return [...new Set(this.detectionData.map((d) => d.method))].sort()
  }

  getUniqueJurisdictions() {
    return [...new Set(this.jurisdictionData.map((d) => d.jurisdiction))].sort()
  }

  getUniqueAgeGroups() {
    return [...new Set(this.ageGroupData.map((d) => d.ageGroup))].sort()
  }
}

// Create global data manager instance
window.dataManager = new DataManager()

// Utility function for populating select dropdowns
function populateSelect(selectId, options) {
  const select = d3.select(`#${selectId}`)
  select
    .selectAll('option:not([value="all"])')
    .data(options)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d)
}

// Global tooltip
window.tooltip = d3.select("body").append("div").attr("class", "tooltip")

// Global color schemes
window.colorScheme = d3.scaleOrdinal(d3.schemeCategory10)
window.pieColorScheme = d3.scaleOrdinal(d3.schemeSet3)
