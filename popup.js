document.addEventListener('DOMContentLoaded', async () => {
  // Get the current active tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Execute a script in the tab to grab the headline and body text
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeArticle,
  }, async (results) => {
    if (results && results[0] && results[0].result) {
      const articleData = results[0].result;
      await analyzeArticle(articleData);
    } else {
      document.getElementById('loading-section').innerText = "Could not read this page.";
    }
  });
});

// This function runs IN the webpage, not the extension
function scrapeArticle() {
  let headline = document.querySelector('h1')?.innerText || "No headline found";
  // Grab the first 2000 characters of paragraphs to avoid crashing
  let bodyText = "";
  document.querySelectorAll('p').forEach(p => bodyText += p.innerText + " ");
  bodyText = bodyText.substring(0, 2000); 
  
  return { headline, bodyText };
}

// This function sends the data to your Cloudflare Worker
async function analyzeArticle(articleData) {
  // ABRAR WILL UPDATE THIS URL LATER
  const WORKER_URL = "https://your-worker-url.workers.dev"; 

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });

    const data = await response.json();

    // Update the UI with the AI response
    document.getElementById('loading-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';

    document.getElementById('trust-score').innerText = data.trust_score;
    document.getElementById('bias-dir').innerText = data.bias_direction;
    document.getElementById('sens-level').innerText = data.sensationalism_level;
    document.getElementById('headline-match').innerText = data.headline_body_match;
    document.getElementById('ai-reason').innerText = data.ai_reasoning;

  } catch (error) {
    document.getElementById('loading-section').innerText = "Error connecting to AI.";
    console.error(error);
  }
}
