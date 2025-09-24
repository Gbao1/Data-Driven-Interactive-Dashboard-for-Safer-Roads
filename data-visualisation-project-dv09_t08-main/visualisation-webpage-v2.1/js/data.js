// Data loading and management module

class DataManager {
  constructor() {
    this.jurisdictionData = []
    this.ageGroupData = []
    this.detectionMethodData = []
    this.finesByYearData = []
    this.detectionTrendData = []
    this.isLoaded = false
  }

  // Load all CSV data
  async loadAllData() {
    try {
      console.log("Loading data...")

      // Load jurisdiction data (for dot map)
      const jurisdictionResponse = await fetch(
        "data/Speeding_by_jurisdiction_and_location.csv",
      )
      const jurisdictionText = await jurisdictionResponse.text()
      this.jurisdictionData = d3.csvParse(jurisdictionText, (d) => ({
        year: +d.YEAR,
        jurisdiction: d.JURISDICTION,
        fines: +d["Sum(FINES)"],
      }))

      // Load age group data (for pie chart)
      const ageResponse = await fetch(
        "data/fines_by_age_groups.csv",
      )
      const ageText = await ageResponse.text()
      this.ageGroupData = d3.csvParse(ageText, (d) => ({
        year: +d.YEAR,
        ageGroup: d.AGE_GROUP,
        fines: +d["Sum(FINES)"],
      }))

      // Load detection method data (for radar chart)
      const detectionResponse = await fetch(
        "data/fines_per_detection.csv",
      )
      const detectionText = await detectionResponse.text()
      this.detectionMethodData = d3.csvParse(detectionText, (d) => ({
        method: d.DETECTION_METHOD,
        fines: +d["Sum(FINES)"],
      }))

      // Load fines by year data
      const finesByYearResponse = await fetch(
        "data/fines_by_year.csv",
      )
      const finesByYearText = await finesByYearResponse.text()
      this.finesByYearData = d3.csvParse(finesByYearText, (d) => ({
        year: +d.YEAR,
        fines: +d["Sum(FINES)"],
      }))

      // Load detection method trend data (for grouped bar chart)
      const detectionTrendResponse = await fetch(
        "data/Detection_method_trend.csv",
      )
      const detectionTrendText = await detectionTrendResponse.text()
      this.detectionTrendData = d3.csvParse(detectionTrendText, (d) => ({
        year: +d.YEAR,
        method: d.DETECTION_METHOD,
        fines: +d["Sum(FINES)"],
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
  getJurisdictionData() {
    return this.jurisdictionData
  }

  getAgeGroupData() {
    return this.ageGroupData
  }

  getDetectionMethodData() {
    return this.detectionMethodData
  }

  getFinesByYearData() {
    return this.finesByYearData
  }

  getDetectionTrendData() {
    return this.detectionTrendData
  }

  // Utility methods for getting unique values
  getUniqueYears(dataset = "all") {
    let data = []
    switch (dataset) {
      case "jurisdiction":
        data = this.jurisdictionData
        break
      case "age":
        data = this.ageGroupData
        break
      case "trend":
        data = this.detectionTrendData
        break
      case "fines":
        data = this.finesByYearData
        break
      default:
        data = [...this.jurisdictionData, ...this.ageGroupData, ...this.detectionTrendData, ...this.finesByYearData]
    }
    return [...new Set(data.map((d) => d.year))].sort()
  }

  getUniqueJurisdictions() {
    return [...new Set(this.jurisdictionData.map((d) => d.jurisdiction))].sort()
  }

  getUniqueDetectionMethods() {
    return [...new Set(this.detectionTrendData.map((d) => d.method))].sort()
  }

  getUniqueAgeGroups() {
    return [...new Set(this.ageGroupData.map((d) => d.ageGroup))].sort()
  }
}

// Create global data manager instance
window.dataManager = new DataManager()

// Global tooltip
window.tooltip = d3.select("body").append("div").attr("class", "tooltip")

// Global color schemes
window.colorScheme = d3.scaleOrdinal(d3.schemeCategory10)
window.pieColorScheme = d3.scaleOrdinal(d3.schemeSet3)
