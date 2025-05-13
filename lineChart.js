//  Chart Implementation for EEG Visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Modern EEG Chart is initializing...");
  
  // Make sure D3 is available
  if (!window.d3) {
    console.error("D3 library not loaded!");
    return;
  }
  
  // Find our container - it should exist in the HTML
  const chartContainer = document.getElementById('eeg-chart-svg-container');
  if (!chartContainer) {
    console.error("Chart container not found!");
    return;
  }
  
  // Create SVG element if it doesn't exist
  let svg = d3.select('#eeg-chart-svg');
  if (svg.empty()) {
    svg = d3.select('#eeg-chart-svg-container')
      .append('svg')
      .attr('id', 'eeg-chart-svg')
      .attr('width', '100%')
      .attr('height', '100%');
    
    // Add a gradient for the area fill
    const defs = svg.append('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.8);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0);
  }
  
  // Get participant and channel selectors
  const participantSelector = document.getElementById('participant-selector');
  const channelSelector = document.getElementById('channel-selector');
  const zoomResetButton = document.getElementById('zoom-reset');
  
  // Initialize data and state variables
  let eegData = [];
  let currentParticipant = participantSelector ? participantSelector.value : 'B1';
  let currentChannel = channelSelector ? channelSelector.value : 'TP9';
  let isZoomed = false;
  
  // Channel colors (matching the dot colors)
  const channelColors = {
    'TP9': '#4F8CFF',
    'AF7': '#4ECDC4',
    'AF8': '#FFB865',
    'TP10': '#FF6B6B',
    'Right AUX': '#C788E5'
  };
  
  // Load initial data
  loadEEGData(currentParticipant);
  
  // Add event listeners
  if (participantSelector) {
    participantSelector.addEventListener('change', function() {
      currentParticipant = this.value;
      loadEEGData(currentParticipant);
    });
  }
  
  if (channelSelector) {
    channelSelector.addEventListener('change', function() {
      currentChannel = this.value;
      updateChart();
    });
  }
  
  if (zoomResetButton) {
    zoomResetButton.addEventListener('click', resetZoom);
  }
  
  // Function to generate sample data
  function generateSampleData(participant = 'B1') {
    // Create a seed based on participant name for consistent randomness
    const seed = participant.charCodeAt(0) + participant.charCodeAt(1);
    
    // Generate 100 data points with a wave pattern + noise
    const data = [];
    for (let i = 0; i < 1000; i++) {
      const point = {
        timestamp: i,
        TP9: Math.sin(i * 0.01 + seed * 0.01) * 250 + Math.cos(i * 0.02) * 100 + (Math.random() - 0.5) * 50,
        AF7: Math.sin(i * 0.015 + seed * 0.02) * 200 + Math.cos(i * 0.03) * 50 + (Math.random() - 0.5) * 50,
        AF8: Math.sin(i * 0.02 + seed * 0.03) * 150 + Math.cos(i * 0.01) * 150 + (Math.random() - 0.5) * 50,
        TP10: Math.sin(i * 0.025 + seed * 0.04) * 300 + Math.cos(i * 0.02) * 70 + (Math.random() - 0.5) * 50,
        'Right AUX': Math.sin(i * 0.03 + seed * 0.05) * 280 + Math.cos(i * 0.04) * 120 + (Math.random() - 0.5) * 50
      };
      data.push(point);
    }
    return data;
  }
  
  // Function to load EEG data
  function loadEEGData(participant) {
    console.log(`Loading data for participant: ${participant}`);
    
    // In a real application, you would fetch data from a backend
    // For now, we'll use sample data
    eegData = generateSampleData(participant);
    updateChart();
  }
  
  // Function to update chart
  function updateChart() {
    // Get container dimensions
    const width = chartContainer.clientWidth;
    const height = chartContainer.clientHeight;
    
    // Clear previous chart
    svg.selectAll('*').remove();
    
    // Re-add gradient definition
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', channelColors[currentChannel])
      .attr('stop-opacity', 0.8);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', channelColors[currentChannel])
      .attr('stop-opacity', 0);
    
    // Set margins
    const margin = {top: 10, right: 30, bottom: 30, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create chart group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(eegData, d => d.timestamp)])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([
        d3.min(eegData, d => d[currentChannel]) * 1.1,
        d3.max(eegData, d => d[currentChannel]) * 1.1
      ])
      .range([innerHeight, 0]);
    
    // Add X axis with grid lines
    g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickSize(-innerHeight)
        .tickFormat(d => `${d}ms`))
      .call(g => g.select('.domain').attr('stroke-opacity', 0.5))
      .call(g => g.selectAll('.tick line')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '2,2'));
    
    // Add Y axis with grid lines
    g.append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth))
      .call(g => g.select('.domain').attr('stroke-opacity', 0.5))
      .call(g => g.selectAll('.tick line')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '2,2'));
    
    // Create area generator
    const area = d3.area()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d[currentChannel]))
      .curve(d3.curveMonotoneX);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d[currentChannel]))
      .curve(d3.curveMonotoneX);
    
    // Add the area path
    g.append('path')
      .datum(eegData)
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', `url(#area-gradient)`);
    
    // Add the line path
    g.append('path')
      .datum(eegData)
      .attr('class', 'line')
      .attr('d', line)
      .attr('stroke', channelColors[currentChannel]);
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('zoom', zoomed);
    
    // Add zoom rect
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('opacity', 0)
      .call(zoom);
    
    // Zoom function
    function zoomed(event) {
      isZoomed = true;
      
      // Create new scales based on zoom event
      const newXScale = event.transform.rescaleX(xScale);
      
      // Update axes
      g.select('.x-axis').call(d3.axisBottom(newXScale)
        .ticks(5)
        .tickSize(-innerHeight)
        .tickFormat(d => `${d}ms`));
      
      // Update line and area
      g.select('.line')
        .attr('d', line.x(d => newXScale(d.timestamp)));
      
      g.select('.area')
        .attr('d', area.x(d => newXScale(d.timestamp)));
    }
    
    // Reset zoom function
    function resetZoom() {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
      isZoomed = false;
    }
    
    console.log(`Chart updated for channel: ${currentChannel}`);
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    updateChart();
  });
  
  console.log("Modern EEG Chart initialized successfully");
});

// Function to reset zoom (exposing to global scope for button access)
function resetZoom() {
  const zoomRect = d3.select('rect').node();
  if (zoomRect && zoomRect.__zoom) {
    d3.select('rect').transition()
      .duration(750)
      .call(d3.zoom().transform, d3.zoomIdentity);
  }
}