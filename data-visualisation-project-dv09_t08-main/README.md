# README

## Gen AI Declaration

We acknowledge the use of AI tools (ChatGPT, v0, Perplexity) to support drafting and refining portions of this design book, as well as to assist with coding tasks for the interactive dashboard. ChatGPT and v0 helped us with coding; Perplexity helped us with finding references and styling APA7 in‐text citations. AI assistance was limited to:

* Generating initial outlines and paragraph drafts (e.g., background, methodology descriptions).
* Suggesting concise design rationales and interaction summaries.
* Drafting example D3.js and JavaScript code snippets for responsive chart behavior.
* Providing APA-7–style references and in-text citation templates.
* Suggesting references.

All AI-generated text was reviewed, edited, and validated by the authors to ensure accuracy, coherence, and alignment with project goals. No AI-generated passages were included verbatim without human verification and adaptation. Any ideas, structure, or wording borrowed from AI outputs have been explicitly integrated and, where necessary, rephrased to maintain academic integrity. The final document reflects our own interpretation, critical judgment, and original contributions.

---

## Prompt and Output Examples

Below are representative prompts we submitted to AI tools and excerpts of the responses. Each example includes a brief justification of how we used the output.

### 1. Drafting the “Background and Motivation” Section

* **Prompt:**

  ```
  Write a concise paragraph introduction explaining why speeding fines data in Australia matters.
  ```

* **Example Output:**

  > “Speeding remains a leading cause of serious road injuries and fatalities in Australia, prompting BISRE to collect enforcement data beginning in 2008. However, their public Police Enforcement Dashboard lacked the ability to dissect trends by age, detection method, or region. In 2023, BITRE began publishing more granular data—such as driver age groups, enforcement location, and fine amounts—but these new attributes are not yet fully leveraged in a user-friendly, interactive format.”

* **Justification:**
  We took the general idea from this output and re-drafted it into our introduction, adding our own wording and specific project context.

---

### 2. KNIME Help

* **Prompt:**

  ```
  Summarize how to use KNIME to clean and aggregate speeding fines data: trimming whitespace, handling missing AGE_GROUP values, removing duplicates, and grouping by year, age, method, or jurisdiction. Keep it under 150 words.
  ```

* **Example Output:**

  > “In KNIME, begin by loading raw CSVs using a CSV Reader node, ensuring UTF-8 encoding and correct delimiters. Next, apply a String Manipulation node to trim whitespace from categorical fields (AGE\_GROUP, JURISDICTION, DETECTION\_METHOD). Use a Missing Value node to filter out rows missing AGE\_GROUP for pre-2023 records, while flagging ARRESTS and CHARGES with rule-based logic. A Duplicate Row Filter ensures that only unique entries remain. Finally, deploy GroupBy nodes to aggregate FINES by YEAR, AGE\_GROUP, DETECTION\_METHOD, and JURISDICTION. Export the cleaned tables via CSV Writer nodes, producing analysis-ready datasets for visualization.”

* **Justification:**
  We used this description to guide building our KNIME workflow, adapting node IDs and dataset names to our specific files.

---

### 3. D3.js Responsiveness Help

* **Prompt:**

  ```
  Generate a D3.js snippet that listens for window resize events and re-draws an SVG chart to fill its parent container’s width and height.
  ```

* **Example Output:**

  ```javascript
  // Assume `svg` is the D3 selection of the chart’s SVG container
  const resizeChart = () => {
    const bounds = svg.node().parentNode.getBoundingClientRect();
    const newWidth = bounds.width;
    const newHeight = bounds.height;
    svg.attr("width", newWidth)
       .attr("height", newHeight);
    // Recompute scales and redraw axes/marks here, e.g.:
    xScale.range([0, newWidth - margin.left - margin.right]);
    yScale.range([newHeight - margin.top - margin.bottom, 0]);
    svg.select(".x-axis").call(d3.axisBottom(xScale));
    svg.select(".y-axis").call(d3.axisLeft(yScale));
    svg.selectAll(".bar")
       .attr("x", d => xScale(d.category))
       .attr("width", xScale.bandwidth());
  };
  window.addEventListener("resize", resizeChart);
  // Initial draw
  resizeChart();
  ```

* **Justification:**
  We used this snippet to debug and implement responsive behavior in our grouped-bar chart code, adjusting variable names and margins as needed.

---

## Usage

1. **Review AI-Generated Sections**

   * Verify each AI-generated sentence or code snippet for alignment with your project requirements.
   * Adapt node names, data file paths, and variable names to match your implementation.

2. **Incorporate into Design Book or Code**

   * Place the revised text in the relevant design book sections.
   * Integrate the JavaScript snippet into your D3.js chart modules, updating scales and axis selectors as appropriate.

3. **Maintain Academic Integrity**

   * Ensure every AI-inspired idea is reviewed and edited.
   * Provide proper citations for any external protocols or guidelines referenced (e.g., Few, 2013; Munzner, 2014; W3C, 2021).

---
