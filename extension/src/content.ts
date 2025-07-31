import React from 'react';
import { createRoot } from 'react-dom/client';
import ClipCreatorPopup from './components/ClipCreatorPopup';

let isPopupOpen = false;
let popupRoot: ReturnType<typeof createRoot> | null = null;
let popupContainer: HTMLDivElement | null = null;

function createPopupContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'nice-clips-popup-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999999;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  return container;
}

function openClipCreator() {
  if (isPopupOpen) return;
  
  const videoId = getVideoIdFromUrl();
  if (!videoId) {
    console.error('Could not extract video ID from URL');
    return;
  }
  
  const videoTitle = getVideoTitle();
  
  isPopupOpen = true;
  popupContainer = createPopupContainer();
  popupRoot = createRoot(popupContainer);
  
  popupRoot.render(
    React.createElement(ClipCreatorPopup, {
      videoId,
      videoTitle,
      onClose: closeClipCreator,
    })
  );
}

function closeClipCreator() {
  if (!isPopupOpen) return;
  
  isPopupOpen = false;
  if (popupRoot) {
    popupRoot.unmount();
    popupRoot = null;
  }
  if (popupContainer) {
    document.body.removeChild(popupContainer);
    popupContainer = null;
  }
}

function getVideoIdFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

function getVideoTitle(): string {
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
  return titleElement?.textContent || 'YouTube Video';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_CLIP_CREATOR') {
    openClipCreator();
    sendResponse({ success: true });
  }
});

export {};