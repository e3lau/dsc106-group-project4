import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { dexcoms, foodLogs, formatDate, formatHour, demographics } from './data_processing.js';

// Set dimensions for the SVG container.
const width = 600;
const height = 600;
const innerRadius = 50;
const outerRadius = Math.min(width, height) / 2 - 40;

// Create the main SVG element and center it.
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Sample data: each object represents a glucose reading at a given time (in hours).
const data = dexcoms["id_001"].map(d => {
    const timestamp = new Date(d["Timestamp (YYYY-MM-DDThh:mm:ss)"]);
    // Compute the hour as a decimal (e.g., 17.39 for 17:23)
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;
    return {
        time: hour, // time in hours (0-24)
        glucose: +d["Glucose Value (mg/dL)"] // ensure numeric value
    };
});

// Create a scale to map time (0 to 24 hours) to angles (0 to 2π).
const angleScale = d3.scaleLinear()
    .domain([0, 24])
    .range([0, 2 * Math.PI]);

// Create a scale for glucose values (using the extent of our sample data).
const glucoseExtent = d3.extent(data, d => d.glucose);
const radiusScale = d3.scaleLinear()
    .domain([glucoseExtent[0], glucoseExtent[1]])
    .range([innerRadius, outerRadius]);

// Use D3's radial line generator.
// It converts our data points into an arc in polar coordinates.
const radialLine = d3.lineRadial()
    .angle(d => angleScale(d.time))
    .radius(d => radiusScale(d.glucose))
    .curve(d3.curveCardinalClosed); // Smooth curve and closed loop.

// Draw the radial line path.
svg.append("path")
    .datum(data)
    .attr("class", "radial-line")
    .attr("d", radialLine);

// Add concentric circles as grid lines.
const numCircles = 5;
const ticks = radiusScale.ticks(numCircles);
ticks.forEach(tick => {
    const r = radiusScale(tick);
    // Draw the circle
    svg.append("circle")
        .attr("r", r)
        .attr("class", "grid-line");
    // Add label: positioned at the left of the circle
    svg.append("text")
        .attr("x", -r - 5)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .attr("class", "axis-label")
        .attr("text-anchor", "end")
        .text(tick);
});

// Radial lines for time (every 3 hours)
for (let hour = 0; hour < 24; hour += 3) {
    const angle = angleScale(hour);
    const x = outerRadius * Math.cos(angle - Math.PI / 2);
    const y = outerRadius * Math.sin(angle - Math.PI / 2);
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#ddd");
}

// Time labels along the outer edge (every 6 hours)
for (let hour = 0; hour < 24; hour += 6) {
    const angle = angleScale(hour);
    const x = (outerRadius + 20) * Math.cos(angle - Math.PI / 2);
    const y = (outerRadius + 20) * Math.sin(angle - Math.PI / 2);
    svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("class", "time-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(`${hour}:00`);
}

// Additional axis labels (optional)
// Label for the radial (glucose) axis: placed below the chart.
svg.append("text")
    .attr("x", 0)
    .attr("y", outerRadius + 40)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Glucose (mg/dL)");

// Label for the angular (time) axis: placed to the right.
svg.append("text")
    .attr("x", outerRadius + 40)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .attr("transform", `rotate(90, ${outerRadius + 40}, 0)`)
    .text("Time of Day");