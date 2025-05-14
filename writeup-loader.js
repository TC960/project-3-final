// writeup-loader.js - Updated to match the screenshot exactly
document.addEventListener('DOMContentLoaded', function() {
  const writeupContainer = document.getElementById('writeup-content-container');
  
  if (!writeupContainer) {
    console.error('Writeup container not found!');
    return;
  }
  
  loadWriteup();
  
  async function loadWriteup() {
    try {
      // Fetch the writeup JSON
      const response = await fetch('project-writeup.json');
      if (!response.ok) {
        throw new Error('Failed to load writeup data');
      }
      
      const writeupData = await response.json();
      
      // Clear loading indicator
      writeupContainer.innerHTML = '';
      
      // Process each section
      writeupData.sections.forEach((section, sectionIndex) => {
        // Create section container
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'writeup-section';
        
        // Add section heading with accent style - exactly like screenshots
        const headingEl = document.createElement('div'); // Using div instead of h3 for exact match
        headingEl.className = 'section-heading';
        
        // Create a circle element for the heading
        const circle = document.createElement('span');
        circle.className = 'heading-circle';
        headingEl.appendChild(circle);
        
        const headingText = document.createElement('span');
        headingText.textContent = section.heading;
        headingEl.appendChild(headingText);
        
        sectionContainer.appendChild(headingEl);
        
        // Process paragraphs based on the section
        section.paragraphs.forEach((paragraph, paragraphIndex) => {
          // Handle each section according to screenshots
          
          // Special case for Design Rationale - first paragraph in a card
          if (section.heading === "Design Rationale" && paragraphIndex === 0) {
            const cardEl = document.createElement('div');
            cardEl.className = 'content-card';
            
            const paragraphEl = document.createElement('p');
            paragraphEl.textContent = paragraph;
            paragraphEl.style.marginBottom = '0'; // No bottom margin in card
            cardEl.appendChild(paragraphEl);
            
            sectionContainer.appendChild(cardEl);
          }
          // Development Process - last paragraph is challenges
          else if (section.heading === "Development Process" && paragraphIndex === 2) {
            // Just a regular paragraph - simple formatting like in screenshot
            const paragraphEl = document.createElement('p');
            paragraphEl.className = 'challenge-text';
            paragraphEl.textContent = paragraph;
            sectionContainer.appendChild(paragraphEl);
          }
          // All other paragraphs get regular styling
          else {
            const paragraphEl = document.createElement('p');
            paragraphEl.textContent = paragraph;
            sectionContainer.appendChild(paragraphEl);
          }
        });
        
        // Add the section container to the main container
        writeupContainer.appendChild(sectionContainer);
        
        // Add a divider between sections (except after the last section)
        if (sectionIndex < writeupData.sections.length - 1) {
          const divider = document.createElement('div');
          divider.className = 'section-divider';
          writeupContainer.appendChild(divider);
        }
      });
      
      console.log('Writeup rendered successfully');
      
    } catch (error) {
      console.error('Error loading writeup:', error);
      writeupContainer.innerHTML = '<p class="error-message">Failed to load project writeup. Please try refreshing the page.</p>';
    }
  }
});