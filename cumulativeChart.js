// cumulativeChart.js - Implementation of MultiChannelEEGChart visualization
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing Multi-Channel EEG Chart...");
  
  // Get the container
  const chartContainer = document.getElementById('cumulative-chart-container');
  if (!chartContainer) {
    console.error("Cumulative chart container not found!");
    return;
  }

  // Default channel configuration 
  let channels = [
    { id: 'TP9', name: 'TP9', color: '#4F8CFF', enabled: true },
    { id: 'AF7', name: 'AF7', color: '#4ECDC4', enabled: true },
    { id: 'AF8', name: 'AF8', color: '#FFB865', enabled: true },
    { id: 'TP10', name: 'TP10', color: '#FF6B6B', enabled: true },
    { id: 'Right_AUX', name: 'Right AUX', color: '#C788E5', enabled: true },
    { id: 'Average', name: 'Average', color: '#333333', enabled: true }
  ];

  // Initialize the chart
  initializeChart(chartContainer, channels);
  
  // Listen for tab changes to refresh the chart
  document.getElementById('cumulative-plot-tab').addEventListener('click', function() {
    // Wait a moment for the DOM to update
    setTimeout(() => {
      if (window.cumulativeChart) {
        renderChart(window.cumulativeChart.data, window.cumulativeChart.channels);
      }
    }, 100);
  });
  
  // Add resize listener
  window.addEventListener('resize', () => {
    if (window.cumulativeChart) {
      renderChart(window.cumulativeChart.data, window.cumulativeChart.channels);
    }
  });

  // Reset zoom button
  const resetZoomButton = document.getElementById('reset-zoom');
  if (resetZoomButton) {
    resetZoomButton.addEventListener('click', () => {
      if (window.cumulativeChart && window.cumulativeChart.zoom) {
        // Reset zoom transformation
        d3.select('#cumulative-svg')
          .transition()
          .duration(750)
          .call(window.cumulativeChart.zoom.transform, d3.zoomIdentity);
      }
    });
  }
  
  console.log("Multi-Channel EEG Chart initialized successfully");
});

// Initialize the chart with the container and channels
function initializeChart(container, channels) {
  // Clear container
  container.innerHTML = '';
  
  // Create the header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'eeg-header';
  headerDiv.innerHTML = `
    <h3>EEG Signal Visualization</h3>
    <p>Channel amplitude with confidence intervals</p>
  `;
  container.appendChild(headerDiv);
  
  // Create channel toggles
  const togglesContainer = document.createElement('div');
  togglesContainer.className = 'channel-toggles';
  
  channels.forEach(channel => {
    const channelClass = channel.id === 'Right_AUX' ? 'aux-color' : 
                      channel.id === 'Average' ? 'avg-color' : 
                      `${channel.id.toLowerCase()}-color`;
    
    const toggle = document.createElement('label');
    toggle.className = `cumulative-channel-toggle ${channel.enabled ? 'active' : ''} ${channelClass}`;
    toggle.dataset.channel = channel.id;
    
    toggle.innerHTML = `
      <input type="checkbox" ${channel.enabled ? 'checked' : ''}>
      <span class="channel-dot" style="background-color: ${channel.color}"></span>
      ${channel.name}
    `;
    
    togglesContainer.appendChild(toggle);
  });
  
  container.appendChild(togglesContainer);
  
  // Create chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.width = '100%';
  chartDiv.style.flex = '1';
  chartDiv.style.position = 'relative';
  chartDiv.style.marginTop = '20px';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'cumulative-svg';
  svg.style.width = '100%';
  svg.style.height = '100%';
  
  chartDiv.appendChild(svg);
  container.appendChild(chartDiv);
  
  // Generate data
  const data = generateEEGData();
  
  // Store in global scope for interaction
  window.cumulativeChart = {
    data,
    channels,
    zoom: null
  };
  
  // Setup channel toggle listeners
  setupChannelToggleListeners();
  
  // Render the chart
  renderChart(data, channels);
}

// Generate sample EEG data
function generateEEGData() {
  const dataPoints = 250;
  const timepoints = Array.from({ length: dataPoints }, (_, i) => i * 40); // 0-10000ms
  const result = [];
  
  timepoints.forEach(time => {
    const point = { time };
    
    // Generate channel values with different patterns
    point.TP9 = Math.sin(time * 0.01) * 250 + (Math.random() - 0.5) * 50;
    point.AF7 = Math.sin(time * 0.015 + 1) * 180 + (Math.random() - 0.5) * 40;
    point.AF8 = Math.sin(time * 0.02 + 2) * 150 + Math.cos(time * 0.01) * 100 + (Math.random() - 0.5) * 30;
    point.TP10 = Math.sin(time * 0.025 + 3) * 300 + (Math.random() - 0.5) * 60;
    point.Right_AUX = Math.sin(time * 0.018 + 4) * 220 + (Math.random() - 0.5) * 45;
    
    // Calculate average
    const channelValues = [point.TP9, point.AF7, point.AF8, point.TP10, point.Right_AUX];
    point.Average = channelValues.reduce((sum, val) => sum + val, 0) / channelValues.length;
    
    // Add variance data for confidence intervals
    point.TP9_upper = point.TP9 + 30 + Math.random() * 20;
    point.TP9_lower = point.TP9 - 30 - Math.random() * 20;
    
    point.AF7_upper = point.AF7 + 25 + Math.random() * 15;
    point.AF7_lower = point.AF7 - 25 - Math.random() * 15;
    
    point.AF8_upper = point.AF8 + 20 + Math.random() * 10;
    point.AF8_lower = point.AF8 - 20 - Math.random() * 10;
    
    point.TP10_upper = point.TP10 + 35 + Math.random() * 25;
    point.TP10_lower = point.TP10 - 35 - Math.random() * 25;
    
    point.Right_AUX_upper = point.Right_AUX + 28 + Math.random() * 18;
    point.Right_AUX_lower = point.Right_AUX - 28 - Math.random() * 18;
    
    point.Average_upper = point.Average + 15 + Math.random() * 5;
    point.Average_lower = point.Average - 15 - Math.random() * 5;
    
    result.push(point);
  });
  
  return result;
}

// Setup event listeners for channel toggles
function setupChannelToggleListeners() {
  document.querySelectorAll('.cumulative-channel-toggle').forEach(toggle => {
    const input = toggle.querySelector('input');
    input.addEventListener('change', function() {
      const channelId = toggle.dataset.channel;
      
      // Update channels array
      window.cumulativeChart.channels = window.cumulativeChart.channels.map(ch => 
        ch.id === channelId ? { ...ch, enabled: this.checked } : ch
      );
      
      // Update toggle appearance
      if (this.checked) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
      
      // Re-render chart
      renderChart(window.cumulativeChart.data, window.cumulativeChart.channels);
    });
  });
}

// Render D3 chart
function renderChart(data, channels) {
  // Set up the svg
  const svg = d3.select('#cumulative-svg');
  svg.selectAll('*').remove(); // Clear previous content
  
  // Get chart container dimensions
  const containerDiv = document.getElementById('cumulative-chart-container');
  const containerWidth = containerDiv.clientWidth;
  const containerHeight = containerDiv.clientHeight - 120; // Account for header and toggles
  
  // Set dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;
  
  // Create chart group
  const chart = svg
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.time)])
    .range([0, width]);
  
  // Find y extent across all enabled channels
  const enabledChannels = channels.filter(c => c.enabled);
  let yMin = Infinity, yMax = -Infinity;
  
  enabledChannels.forEach(channel => {
    const lowerKey = `${channel.id}_lower`;
    const upperKey = `${channel.id}_upper`;
    
    data.forEach(d => {
      if (d[lowerKey] && d[lowerKey] < yMin) yMin = d[lowerKey];
      if (d[upperKey] && d[upperKey] > yMax) yMax = d[upperKey];
      
      // Also check main value in case confidence bounds aren't available
      if (d[channel.id] < yMin) yMin = d[channel.id];
      if (d[channel.id] > yMax) yMax = d[channel.id];
    });
  });
  
  // Add padding to y-axis
  const yPadding = (yMax - yMin) * 0.1;
  
  const yScale = d3.scaleLinear()
    .domain([yMin - yPadding, yMax + yPadding])
    .range([height, 0]);
  
  // Add grid
  chart.append('g')
    .attr('class', 'grid-horizontal')
    .selectAll('line')
    .data(yScale.ticks(10))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 0.5);
  
  chart.append('g')
    .attr('class', 'grid-vertical')
    .selectAll('line')
    .data(xScale.ticks(10))
    .enter()
    .append('line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 0.5);
  
  // Add axes
  chart.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d}`));
  
  chart.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale));
  
  // Add axis labels
  chart.append('text')
    .attr('class', 'x-axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + 35)
    .style('font-size', '12px')
    .text('timepoint (ms)');
  
  chart.append('text')
    .attr('class', 'y-axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .style('font-size', '12px')
    .text('amplitude (μV)');
  
  // Line generator
  const line = d3.line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.value))
    .curve(d3.curveBasis);
  
  // Area generator (for confidence intervals)
  const area = d3.area()
    .x(d => xScale(d.time))
    .y0(d => yScale(d.lower))
    .y1(d => yScale(d.upper))
    .curve(d3.curveBasis);
  
  // Draw enabled channels
  enabledChannels.forEach(channel => {
    // Prepare data for this channel
    const channelData = data.map(d => ({
      time: d.time,
      value: d[channel.id],
      lower: d[`${channel.id}_lower`],
      upper: d[`${channel.id}_upper`]
    }));
    
    // Draw confidence interval area
    chart.append('path')
      .datum(channelData)
      .attr('fill', channel.color)
      .attr('fill-opacity', 0.2)
      .attr('d', area);
    
    // Draw line
    chart.append('path')
      .datum(channelData)
      .attr('fill', 'none')
      .attr('stroke', channel.color)
      .attr('stroke-width', channel.id === 'Average' ? 2 : 1.5)
      .attr('d', line);
  });
  
  // Create tooltip
  let tooltip = d3.select('body').select('.cumulative-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'cumulative-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  }
  
  // Add hover interaction elements
  const hoverLine = chart.append('line')
    .attr('class', 'hover-line')
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
    .style('opacity', 0);
  
  const hoverPoints = chart.append('g')
    .attr('class', 'hover-points');
  
  // Create invisible overlay for mouse tracking
  const overlay = chart.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mousemove', function(event) {
      const mouseX = d3.pointer(event)[0];
      const xValue = xScale.invert(mouseX);
      
      // Find closest data point
      let closestIndex = 0;
      let closestDistance = Math.abs(data[0].time - xValue);
      
      for (let i = 1; i < data.length; i++) {
        const distance = Math.abs(data[i].time - xValue);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
      
      const point = data[closestIndex];
      
      // Update hover line
      hoverLine
        .attr('x1', xScale(point.time))
        .attr('x2', xScale(point.time))
        .style('opacity', 1);
      
      // Update hover points
      hoverPoints.selectAll('*').remove();
      
      enabledChannels.forEach(channel => {
        hoverPoints.append('circle')
          .attr('cx', xScale(point.time))
          .attr('cy', yScale(point[channel.id]))
          .attr('r', 4)
          .attr('fill', 'white')
          .attr('stroke', channel.color)
          .attr('stroke-width', 2);
      });
      
      // Update tooltip
      tooltip
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
        .style('opacity', 1)
        .html(`
          <div style="font-weight: bold; margin-bottom: 4px;">
            ${point.time} ms
          </div>
          ${enabledChannels.map(ch => `
            <div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${ch.color}; border-radius: 50%; margin-right: 4px;"></span>
              <span style="width: 70px;">${ch.name}:</span>
              <span style="font-weight: 500;">${Math.round(point[ch.id])} μV</span>
            </div>
          `).join('')}
        `);
      
      // Update channel values in the sidebar
      enabledChannels.forEach(channel => {
        // Don't update Average in the sidebar
        if (channel.id === 'Average') return;
        
        // Get the channel index
        let channelIndex;
        switch(channel.id) {
          case 'TP9': channelIndex = 0; break;
          case 'AF7': channelIndex = 1; break;
          case 'AF8': channelIndex = 2; break;
          case 'TP10': channelIndex = 3; break;
          case 'Right_AUX': channelIndex = 4; break;
          default: return;
        }
        
        const value = point[channel.id];
        const valueElement = document.querySelector(`.channel-item:nth-child(${channelIndex + 1}) .channel-value`);
        
        if (valueElement) {
          valueElement.textContent = value.toFixed(2);
          valueElement.className = 'channel-value ' + (value >= 0 ? 'positive' : 'negative');
        }
      });
    })
    .on('mouseleave', function() {
      hoverLine.style('opacity', 0);
      hoverPoints.selectAll('*').remove();
      tooltip.style('opacity', 0);
    });
  
  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .extent([[0, 0], [width, height]])
    .on('zoom', zoomed);
  
  svg.call(zoom);
  
  // Store zoom in global variable for reset button
  window.cumulativeChart.zoom = zoom;
  
  function zoomed(event) {
    // Create new scales based on event
    const newXScale = event.transform.rescaleX(xScale);
    
    // Update axes
    chart.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d => `${d}`));
    
    // Update grid lines
    chart.selectAll('.grid-vertical line')
      .attr('x1', d => newXScale(d))
      .attr('x2', d => newXScale(d));
    
    // Update all lines and areas
    chart.selectAll('path')
      .filter(function() {
        return !this.classList.contains('domain');
      })
      .attr('d', function() {
        const pathData = d3.select(this).datum();
        
        if (this.getAttribute('fill') === 'none') {
          // It's a line
          return d3.line()
            .x(d => newXScale(d.time))
            .y(d => yScale(d.value))
            .curve(d3.curveBasis)(pathData);
        } else {
          // It's an area
          return d3.area()
            .x(d => newXScale(d.time))
            .y0(d => yScale(d.lower))
            .y1(d => yScale(d.upper))
            .curve(d3.curveBasis)(pathData);
        }
      });
  }
}