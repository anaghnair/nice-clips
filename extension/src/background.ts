import { API_BASE_URL } from './config';

chrome.runtime.onInstalled.addListener(() => {
  console.log("Nice Clips extension installed");
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url) return;
  
  if (tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_CLIP_CREATOR",
      videoUrl: tab.url,
    });
  } else {
    chrome.tabs.create({
      url: "https://youtube.com",
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CREATE_CLIP") {
    const { videoId, title, startTime, endTime, originalTitle } = message.data;
    
    fetch(`${API_BASE_URL}/api/process-clip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId,
        title,
        startTime,
        endTime,
        originalTitle,
      }),
    })
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, clipId: data.clipId });
      })
      .catch(error => {
        console.error("Error creating clip:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

export {};