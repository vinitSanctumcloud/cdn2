(function () {
  // Configuration (to be passed when embedding or fetched from server)
  const config = {
    agentSlug: window.EarnLinksConfig?.agentSlug || 'default-agent',
    chatUrl: window.EarnLinksConfig?.chatUrl || 'https://example.com/chat',
    embedSize: {
      width: window.EarnLinksConfig?.embedSize?.width || '00px',
      height: window.EarnLinksConfig?.embedSize?.height || '600px',
    },
    apiUrl: 'https://api.tagwell.co/api/v4/ai-agent/get-agent/details/',
  };

  // Dynamic height and width adjustment
  const embedHeight =
    typeof config.embedSize.height === 'string'
      ? `${parseInt(config.embedSize.height)}px`
      : `${config.embedSize.height}px`;
  const embedWidth =
    typeof config.embedSize.width === 'string'
      ? config.embedSize.width
      : `${config.embedSize.width}px`;

  // Create container
  const container = document.createElement('div');
  container.className = 'chat-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    --chat-width: ${embedWidth}; /* Set initial width as CSS custom property */
  `;

  // CSS styles
  const styles = `
    .chat-label {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
      margin-right: 5px;
      color: #333;
      background: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chat-video {
      width: 150px;
      height: 150px;
      cursor: pointer;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }
    .chat-video:hover {
      transform: scale(1.05);
    }
    .chat-iframe {
      display: none;
      width: var(--chat-width); /* Use CSS custom property for width */
      height: ${embedHeight};
      border: none;
      border-radius: 10px;
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 1000;
    }
    .chat-iframe.active {
      display: block;
    }
    .close-button {
      display: none;
      position: fixed;
      bottom: calc(-6px + ${embedHeight});
      right: 8px;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 18px;
      font-weight: bold;
      line-height: 32px;
      text-align: center;
      cursor: pointer;
      z-index: 1001;
      transition: transform 0.2s ease;
    }
    .close-button:hover {
      transform: scale(1.1);
    }
    .close-button.active {
      display: block;
    }
    .chat-video.hidden {
      display: none;
    }
    .chat-loading {
      position: fixed;
      bottom: 180px;
      right: 20px;
      color: #333;
      font-size: 14px;
      z-index: 1000;
    }
    .error-message {
      position: fixed;
      bottom: 180px;
      right: 20px;
      color: #ff4d4f;
      font-size: 14px;
      z-index: 1000;
      display: none;
    }
  `;

  // Append styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create "Chat with me" label
  const chatLabel = document.createElement('div');
  chatLabel.className = 'chat-label';
  chatLabel.textContent = 'Chat with me';

  // Create elements
  const video = document.createElement('video');
  video.className = 'chat-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  const videoSource = document.createElement('source');
  videoSource.id = 'video-source';
  videoSource.type = 'video/mp4';
  video.appendChild(videoSource);

  const iframe = document.createElement('iframe');
  iframe.className = 'chat-iframe';
  iframe.src = config.chatUrl;
  iframe.setAttribute('allowtransparency', 'true');

  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.textContent = 'X';

  const loading = document.createElement('div');
  loading.className = 'chat-loading';
  loading.textContent = 'Loading...';
  loading.style.display = 'none';

  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = 'Failed to load video. Please try again later.';

  // Append elements
  container.appendChild(chatLabel);
  container.appendChild(loading);
  container.appendChild(video);
  container.appendChild(iframe);
  container.appendChild(closeButton);
  container.appendChild(errorMessage);
  document.getElementById('earnlinks-chat-widget').appendChild(container);

  // Fetch video URL
  loading.style.display = 'block';
  fetch(`${config.apiUrl}${config.agentSlug}`)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (data.data?.ai_agent?.greeting_media_url) {
        videoSource.src = data.data.ai_agent.greeting_media_url;
        video.load();
        loading.style.display = 'none';
      } else {
        throw new Error('No video URL found');
      }
    })
    .catch((error) => {
      console.error('Error fetching video URL:', error);
      loading.style.display = 'none';
      errorMessage.style.display = 'block';
      setTimeout(() => (errorMessage.style.display = 'none'), 5000);
    });

  // Event listeners
  video.addEventListener('click', () => {
    iframe.classList.add('active');
    closeButton.classList.add('active');
    video.classList.add('hidden');
    chatLabel.style.display = 'none';
  });

  closeButton.addEventListener('click', () => {
    iframe.classList.remove('active');
    closeButton.classList.remove('active');
    video.classList.remove('hidden');
    chatLabel.style.display = 'block';
  });

  // Handle window resize
  const updateIframeSize = () => {
    const currentWidth = container.style.getPropertyValue('--chat-width') || embedWidth;
    iframe.style.width = window.innerWidth < 300 ? '100%' : currentWidth;
    iframe.style.height = window.innerWidth < 300 ? '80vh' : embedHeight;
    closeButton.style.bottom = window.innerWidth < 300 ? 'calc(-6px + 80vh)' : `calc(-6px + ${embedHeight})`;
  };

  window.addEventListener('resize', updateIframeSize);

  // Expose a function to update the width dynamically
  window.EarnLinksChatWidget = {
    setWidth: (newWidth) => {
      const widthValue = typeof newWidth === 'string' ? newWidth : `${newWidth}px`;
      container.style.setProperty('--chat-width', widthValue);
      updateIframeSize();
    },
  };
})();