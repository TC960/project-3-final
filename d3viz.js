// D3 Tooltip implementation for Brain Visualizer
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
// Patch for brainViewer.js
// This patch should be added at the top of your existing brainViewer.js file

console.log("Starting brain viewer initialization...");

// Fix for multiple THREE.js instances
if (window.THREE) {
  console.log("Using existing THREE instance");
} else {
  console.log("No existing THREE instance found");
}

// Ensure the brain container exists
document.addEventListener('DOMContentLoaded', function() {
  // Find the container in the new HTML structure
  const brainContainer = document.getElementById('brain-container');
  
  if (!brainContainer) {
    console.error("Brain container not found! Creating one...");
    
    // Try to find the container in the card
    const brainCard = document.querySelector('.brain-card .card-content');
    
    if (brainCard) {
      brainCard.id = 'brain-container';
      console.log("Created brain container inside card");
    } else {
      console.error("Could not find brain card element");
    }
  } else {
    console.log("Brain container found:", brainContainer);
  }
  
  // Ensure the container has proper dimensions
  const container = document.getElementById('brain-container');
  if (container) {
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '300px';
    container.style.position = 'relative';
    console.log("Adjusted brain container styles");
  }
  
  // Check for brain.glb file path - adjust if needed
  // You may need to update this path based on your file structure
  const testImg = new Image();
  testImg.onload = function() {
    console.log("brain.glb directory appears accessible");
  };
  testImg.onerror = function() {
    console.error("Warning: brain.glb directory may not be accessible");
    console.log("Checking alternative paths...");
    
    // Try to find the file in alternative locations
    const paths = [
      'brain.glb',
      './brain.glb',
      '../brain.glb',
      './assets/brain.glb',
      './models/brain.glb'
    ];
    
    console.log("Consider checking these paths:", paths.join(', '));
  };
  // Test with a small image in the same directory that should contain brain.glb
  testImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
});

// Function to be called in the original brainViewer.js after loading the model
window.onBrainModelLoaded = function(brain) {
  console.log("Brain model loaded successfully!");
  
  // Make sure the brain is visible and properly positioned
  brain.traverse(child => {
    if (child.isMesh) {
      console.log("Found brain mesh:", child.name);
      // Ensure the material is visible
      child.material.opacity = 0.9;
      child.material.transparent = true;
      child.material.needsUpdate = true;
    }
  });
  
  // Adjust brain position if needed
  brain.position.set(0, -0.7, 0);
  brain.scale.set(1.3, 1.3, 1.3);
  
  // Ensure it's added to the scene
  if (!brain.parent) {
    window.brainViewerScene.add(brain);
    console.log("Added brain to scene");
  }
};

// Add this line to your GLTFLoader callback in the original code:
// window.onBrainModelLoaded(brain);

// Patch complete
console.log("Brain viewer patch applied");
// Wait for the brainViewer.js to initialize
document.addEventListener('DOMContentLoaded', function() {
  // Make sure tooltip container exists or create it
  let tooltipDiv = document.getElementById('tooltip');
  if (!tooltipDiv) {
    tooltipDiv = document.createElement('div');
    tooltipDiv.id = 'tooltip';
    tooltipDiv.style.display = 'none';
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.appendChild(tooltipDiv);
    } else {
      document.body.appendChild(tooltipDiv);
    }
  }

  // Add tooltip CSS if not already in style.css
  if (!document.querySelector('style#tooltip-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tooltip-styles';
    styleSheet.textContent = `
      #tooltip {
        position: absolute;
        padding: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        border: 1px solid #00ffff;
        border-radius: 4px;
        pointer-events: none;
        font-size: 14px;
        z-index: 1000;
        transition: opacity 0.3s;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        max-width: 250px;
      }
      
      #tooltip::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #00ffff transparent transparent transparent;
      }
      
      #tooltip .signal-value {
        font-weight: bold;
        margin-top: 5px;
      }
      
      #tooltip .signal-high {
        color: #ff0000;
      }
      
      #tooltip .signal-medium {
        color: #ffff00;
      }
      
      #tooltip .signal-low {
        color: #00ffff;
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Try to initialize tooltips after a short delay, but with improved retry logic
  let attempts = 0;
  const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
  
  function initializeTooltips() {
    // Check if all required objects are available
    if (!window.brainViewerScene || 
        !window.brainViewerCamera || 
        !window.brainViewerRenderer || 
        !window.brainViewerElectrodes) {
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Brain viewer not fully initialized yet, retry attempt ${attempts}/${maxAttempts}...`);
        setTimeout(initializeTooltips, 500);
      } else {
        console.error('Failed to initialize tooltips after maximum attempts');
      }
      return;
    }

    console.log('Initializing D3 tooltips for brain visualizer');
    
    // Get references to the objects from global scope
    const scene = window.brainViewerScene;
    const camera = window.brainViewerCamera;
    const renderer = window.brainViewerRenderer;
    const electrodes = window.brainViewerElectrodes;

    // Create D3 tooltip
    const tooltip = d3.select("#tooltip");
    
    // Track current hovered electrode
    let currentHoveredElectrode = null;

    // Electrode descriptions
    const electrodeDescriptions = {
      'TP9': 'Left temporal-parietal junction. Processes auditory information and language integration.',
      'AF7': 'Left anterior-frontal region. Associated with executive function, working memory, and attention.',
      'AF8': 'Right anterior-frontal region. Associated with executive function, emotional regulation, and attention.',
      'TP10': 'Right temporal-parietal junction. Processes auditory information and spatial awareness.',
      'Right AUX': 'Auxiliary electrode on right hemisphere. Provides additional reference point for signal comparison.'
    };

    // Setup raycasting for interaction
    const raycaster = new THREE.Raycaster();
    // Make raycaster more precise
    raycaster.params.Points.threshold = 0.01;
    raycaster.params.Line.threshold = 0.01;
    const mouse = new THREE.Vector2();

    // Add descriptions to electrodes
    Object.entries(electrodes).forEach(([label, mesh]) => {
      mesh.userData.description = electrodeDescriptions[label] || `Electrode at position ${label}`;
    });

    // Create color scale for visualization
    const colorScale = d3.scaleLinear()
      .domain([-500, 0, 500])
      .range(["blue", "#00ffff", "red"]);
      
    // Function to hide tooltip and reset electrode state
    function hideTooltip() {
      tooltip.style('display', 'none');
      
      // Reset previous electrode if any
      if (currentHoveredElectrode) {
        if (currentHoveredElectrode.userData && currentHoveredElectrode.userData.interactive) {
          currentHoveredElectrode.userData.isHovered = false;
          currentHoveredElectrode.material.emissiveIntensity = 0.4; // Reset to default
        }
        currentHoveredElectrode = null;
      }
      
      // Reset all electrodes just to be sure
      Object.values(electrodes).forEach(electrode => {
        if (electrode.userData && electrode.userData.interactive) {
          electrode.userData.isHovered = false;
          electrode.material.emissiveIntensity = 0.4; // Reset to default
        }
      });
    }

    // Add event listeners
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseout', onMouseOut);
    
    // Add document level listener to ensure tooltip disappears
    document.addEventListener('mousemove', function(event) {
      // Check if mouse is inside renderer
      const rect = renderer.domElement.getBoundingClientRect();
      const isInside = (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
      
      // If mouse is outside renderer but tooltip is still shown
      if (!isInside && tooltip.style('display') !== 'none') {
        hideTooltip();
      }
    });
    
    // Hide tooltip on window blur and scroll
    window.addEventListener('blur', hideTooltip);
    document.addEventListener('scroll', hideTooltip);

    function onMouseMove(event) {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      
      // Early exit if outside renderer
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        hideTooltip();
        return;
      }
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the raycaster
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with electrodes
      const intersects = raycaster.intersectObjects(Object.values(electrodes));
      
      if (intersects.length > 0) {
        const electrode = intersects[0].object;
        
        if (electrode.userData && electrode.userData.interactive) {
          // If hovering a new electrode, reset the previous one
          if (currentHoveredElectrode && currentHoveredElectrode !== electrode) {
            currentHoveredElectrode.userData.isHovered = false;
            currentHoveredElectrode.material.emissiveIntensity = 0.4;
          }
          
          // Update current hovered electrode
          currentHoveredElectrode = electrode;
          
          // Mark as hovered to prevent animation from changing appearance
          electrode.userData.isHovered = true;
          
          // Highlight the electrode
          electrode.material.emissiveIntensity = 1.0;
          
          // Get current signal value
          let signalValue = "N/A";
          let signalClass = "";
          
          if (window.brainViewerEEGData && window.brainViewerCurrentIndex !== undefined) {
            const currentData = window.brainViewerEEGData[window.brainViewerCurrentIndex];
            if (currentData) {
              signalValue = currentData[electrode.userData.label];
              if (signalValue !== undefined) {
                // Determine signal strength class
                if (signalValue > 200) {
                  signalClass = "signal-high";
                } else if (signalValue > 0) {
                  signalClass = "signal-medium";
                } else {
                  signalClass = "signal-low";
                }
                
                signalValue = signalValue.toFixed(2);
              } else {
                signalValue = "N/A";
              }
            }
          }
          
          // Position tooltip near the mouse
          tooltip
            .style('left', (event.clientX + 15) + 'px')
            .style('top', (event.clientY - 20) + 'px')
            .style('display', 'block')
            .html(`
              <strong>${electrode.userData.label}</strong><br>
              ${electrode.userData.description}<br>
              <div class="signal-value ${signalClass}">
                Current value: ${signalValue}
              </div>
            `);
        }
      } else {
        // No intersection found, hide tooltip
        hideTooltip();
      }
    }

    function onMouseOut(event) {
      // Hide tooltip when mouse leaves the canvas
      hideTooltip();
    }

    // Add real-time EEG value display
    function updateElectrodeInfoPanel() {
      if (!window.brainViewerEEGData || window.brainViewerCurrentIndex === undefined) {
        return;
      }
      
      const currentData = window.brainViewerEEGData[window.brainViewerCurrentIndex];
      if (!currentData) return;
      
      // Update electrode info in sidebar
      Object.entries(electrodes).forEach(([label, mesh]) => {
        // Find electrode items using D3 instead of querySelector with :contains
        const electrodeItems = d3.selectAll('.electrode-item')
          .filter(function() {
            return d3.select(this).select('span:not(.electrode-dot)').text() === label;
          });
        
        if (!electrodeItems.empty()) {
          const electrodeItem = electrodeItems.node();
          const signalValue = currentData[label];
          
          if (signalValue !== undefined) {
            // Add value display to the electrode item
            let valueDisplay = d3.select(electrodeItem).select('.value-display').node();
            
            if (!valueDisplay) {
              valueDisplay = document.createElement('span');
              valueDisplay.className = 'value-display';
              valueDisplay.style.marginLeft = 'auto';
              valueDisplay.style.fontSize = '0.8rem';
              electrodeItem.appendChild(valueDisplay);
            }
            
            // Update value and color
            valueDisplay.textContent = signalValue.toFixed(2);
            
            // Color based on value
            if (signalValue > 200) {
              valueDisplay.style.color = '#ff0000';
            } else if (signalValue > 0) {
              valueDisplay.style.color = '#ffff00';
            } else {
              valueDisplay.style.color = '#00ffff';
            }
          }
        }
      });
    }
    
    // Update electrode info every 100ms
    setInterval(updateElectrodeInfoPanel, 100);

    console.log('D3 tooltips initialized successfully');
  }

  // Start initialization process
  initializeTooltips();
});