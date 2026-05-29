document.addEventListener('DOMContentLoaded', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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

function scrapeArticle() {
  let headline = document.querySelector('h1')?.innerText || "No headline found";
  let bodyText = "";
  document.querySelectorAll('p').forEach(p => bodyText += p.innerText + " ");
  bodyText = bodyText.substring(0, 2000); 
  return { headline, bodyText };
}

async function analyzeArticle(articleData) {
  const WORKER_URL = "https://ondho-backend.amanatabrar213.workers.dev/"; // YOUR URL HERE

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });

    const data = await response.json();
    
    // LOG THE DATA SO WE CAN SEE EXACTLY WHAT THE AI SENT
    console.log("AI Response:", data);

    document.getElementById('loading-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';

    // SMART EXTRACTION: If the AI uses a different key name, we catch it!
    // (e.g., if it uses "score" instead of "trust_score")
    const score = data.trust_score || data.score || data.trustScore || "N/A";
    const bias = data.bias_direction || data.bias || data.biasDirection || "N/A";
    const sens = data.sensationalism_level || data.sensationalism || data.sensationalismLevel || "N/A";
    const match = data.headline_body_match || data.match || data.headlineMatch || "N/A";
    const reason = data.ai_reasoning || data.reasoning || data.reason || data.ai_insight || "N/A";

    document.getElementById('trust-score').innerText = score;
    document.getElementById('bias-dir').innerText = bias;
    document.getElementById('sens-level').innerText = sens;
    document.getElementById('headline-match').innerText = match;
        // TEMPORARY: Show the whole AI response on screen so we can see it
    document.getElementById('ai-reason').innerText = JSON.stringify(data);

  } catch (error) {
    document.getElementById('loading-section').innerText = "Error connecting to AI: " + error.message;
    console.error(error);
  }
}
