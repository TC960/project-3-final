document.addEventListener('DOMContentLoaded', function() {
  const writeupContainer = document.getElementById('writeup-content-container');
  
  // Function to create the writeup content
  function createWriteup(data) {
    // Clear loading indicator
    writeupContainer.innerHTML = '';
    
    // Create summary section
    const summarySection = document.createElement('div');
    summarySection.className = 'project-summary';
    summarySection.innerHTML = `
      <p class="writeup-paragraph">An interactive visualization of EEG data, making brain activity more tangible and intuitive through animated 3D representations and multi-channel analysis.</p>
      <div class="tag-container">
        <span class="writeup-tag">EEG Data</span>
        <span class="writeup-tag">3D Visualization</span>
        <span class="writeup-tag">Interactive</span>
        <span class="writeup-tag">D3.js</span>
        <span class="writeup-tag">Three.js</span>
      </div>
    `;
    writeupContainer.appendChild(summarySection);
    
    // Process each section
    data.sections.forEach((section, index) => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'writeup-section';
      
      // Add heading
      const heading = document.createElement('h3');
      heading.className = 'writeup-heading';
      heading.textContent = section.heading;
      sectionDiv.appendChild(heading);
      
      // Add paragraphs
      section.paragraphs.forEach((paragraph, paragraphIndex) => {
        // Check if this is the last paragraph in Development Process for highlight box
        const isHighlight = section.heading === "Development Process" && 
                           paragraphIndex === section.paragraphs.length - 1;
        
        if (isHighlight) {
          const highlightBox = document.createElement('div');
          highlightBox.className = 'highlight-box';
          
          const para = document.createElement('p');
          para.className = 'writeup-paragraph';
          para.textContent = paragraph;
          
          highlightBox.appendChild(para);
          sectionDiv.appendChild(highlightBox);
        } else {
          const para = document.createElement('p');
          para.className = 'writeup-paragraph';
          para.textContent = paragraph;
          sectionDiv.appendChild(para);
        }
      });
      
      writeupContainer.appendChild(sectionDiv);
    });
  }
  
  // Attempt to fetch JSON data
  fetch('writeup.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Create the writeup with a slight delay for smoother transitions
      setTimeout(() => createWriteup(data), 300);
    })
    .catch(error => {
      console.error('Error loading writeup data:', error);
      
      // Use static data if fetch fails (for demo/testing purposes)
      const staticData = {
        "title": "Project 3 Writeup",
        "sections": [
          {
            "heading": "Motivation",
            "paragraphs": [
              "EEG data can feel abstract and difficult to interpret. We wanted to make brain activity more tangible and visually intuitive. By exploring the data ourselves, we noticed how understanding improved when we visualized it physically—so we designed an interface that helps users do the same, making neural patterns more accessible through interactive exploration."
            ]
          },
          {
            "heading": "Design Rationale",
            "paragraphs": [
              "We used animated bubbles on a 3D brain to represent channel intensity—bubbles grow or jitter more when signals vary rapidly. This movement-based encoding helped communicate activity levels more intuitively than static color or size alone. Color was kept consistent across all views to preserve recognition, and we emphasized interaction: users can rotate the brain and zoom into any view. We skipped a legend for bubble size because zooming made it context-dependent.",
              "In the second tab, we included a multi-line plot with confidence intervals. While complex, it supports deeper comparison across channels. We made this optional to keep the main view clean and user-friendly. Dropdown filters help narrow focus to relevant participants or channels."
            ]
          },
          {
            "heading": "Development Process",
            "paragraphs": [
              "We started by reviewing multiple datasets and picked EEG data based on team interest. Each member contributed exploratory visualizations for the checkpoint. Afterward, we switched to a new dataset for better creative flexibility.",
              "One member scaffolded the site, and tasks were split among frontend design, D3 implementation, and debugging. Each of us spent between 4-12 hours on the project. Time was mainly spent debugging interactivity and managing complex collaborative code.",
              "Major challenges included: designing interactions that add clarity (not clutter), managing large data and performance in D3, and fixing subtle visual or state bugs across tabs."
            ]
          }
        ]
      };
      
      // Create the writeup with static data
      createWriteup(staticData);
    });
  
  // Add tab transition effect
  const writeupTab = document.getElementById('project-writeup-tab');
  
  if (writeupTab) {
    writeupTab.addEventListener('click', () => {
      // Add a subtle refresh animation when switching to the writeup tab
      if (writeupContainer.querySelectorAll('.writeup-section').length > 0) {
        writeupContainer.querySelectorAll('.writeup-section').forEach((section, i) => {
          section.style.animation = 'none';
          section.offsetHeight; // Trigger reflow
          section.style.animation = `fadeIn 0.5s ease forwards ${0.1 + i * 0.1}s`;
          section.style.opacity = '0';
        });
      }
    });
  }
});