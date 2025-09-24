// Utility functions module

export function populateSelect(selectId, options) {
  const select = d3.select(`#${selectId}`)
  select
    .selectAll('option:not([value="all"])')
    .data(options)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d)
}
