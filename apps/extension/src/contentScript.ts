// Content script for the Chrome extension
console.log('JobPilot content script loaded');

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  // Handle different message types
  switch (message.type) {
    case 'FILL_FORM':
      // Fill form with provided data
      console.log('Filling form with data:', message.payload);
      // In a real implementation, this would use the FormFiller logic
      sendResponse({ success: true, message: 'Form filled' });
      return true;

    case 'UPLOAD_RESUME':
      // Handle resume upload
      console.log('Uploading resume:', message.payload);
      sendResponse({ success: true, message: 'Resume uploaded' });
      return true;

    case 'GET_APPLICATION_QUESTIONS':
      // Extract application questions from the form
      console.log('Extracting application questions');
      const questions = extractApplicationQuestions();
      sendResponse({ success: true, data: questions });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return true;
  }
});

// Function to extract application questions from a form
function extractApplicationQuestions(): Array<{ question: string, type: string, required: boolean }> {
  const questions: Array<{ question: string, type: string, required: boolean }> = [];

  // Find all input, textarea, and select elements that seem to be part of an application form
  const formElements = document.querySelectorAll('input, textarea, select');

  formElements.forEach((element) => {
    const el = element as HTMLElement;
    let question = '';
    let type = element.tagName.toLowerCase();
    let required = el.hasAttribute('required');

    // Try to get the question/label from various sources
    // 1. Associated label element
    const id = el.id;
    if (id) {
      const labelElement = document.querySelector(`label[for="${id}"]`);
      if (labelElement) {
        question = labelElement.textContent.trim();
      }
    }

    // 2. Placeholder attribute
    if (!question && el.hasAttribute('placeholder')) {
      question = el.getAttribute('placeholder') || '';
    }

    // 3. Aria-label attribute
    if (!question && el.hasAttribute('aria-label')) {
      question = el.getAttribute('aria-label') || '';
    }

    // 4. Name attribute (last resort)
    if (!question && el.hasAttribute('name')) {
      question = el.getAttribute('name') || '';
    }

    // Only add if we found a question
    if (question) {
      questions.push({
        question,
        type,
        required
      });
    }
  });

  return questions;
}

// Add a simple UI indicator that the extension is active
function addExtensionIndicator() {
  const indicator = document.createElement('div');
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4f46e5;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    ">
      JobPilot Active
    </div>
  `;
  document.body.appendChild(indicator);
}

// Initialize the content script
addExtensionIndicator();