import React, { useEffect, useRef } from 'react';

interface EvercastPlayerProps {
  width?: string;
  serverId?: number;
}

export default function EvercastPlayer({ width = "1000px", serverId = 1 }: EvercastPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPlayer = async () => {
      if (!containerRef.current) return;

      // Load Vue.js first if not available
      if (!window.Vue) {
        const vueScript = document.createElement('script');
        vueScript.src = 'https://unpkg.com/vue@2/dist/vue.js';
        vueScript.async = true;
        document.head.appendChild(vueScript);
        
        await new Promise((resolve) => {
          vueScript.onload = resolve;
        });
      }

      // Load Everestcast player script
      if (!window.scPlayer) {
        const playerScript = document.createElement('script');
        playerScript.src = 'https://ec1.everestcast.host:2750/media/static/js/sc_player/sc_player.js';
        playerScript.async = true;
        document.head.appendChild(playerScript);
        
        await new Promise((resolve) => {
          playerScript.onload = resolve;
        });
      }

      // Set the HTML content
      containerRef.current.innerHTML = `
        <div
          is="player"
          lang="en" 
          api-url="https://ec1.everestcast.host:2750/api/v2"
          server-id="${serverId}"
          station-name=""
          station-url=""
          imagecontainer="bottom"
          imagecontainer-bg="#f79e02"
          imagecontainer-bg-opacity="1"
          controlscontainer="bottom"
          controlscontainer-bg="#000000"
          controlscontainer-bg-opacity="1"
          controlscontainer-bg-img="https://ec1.everestcast.host:2750/media/widgets/blob.jpeg"
          historycontainer="bottom"
          historycontainer-bg="#cdd8e5"
          historycontainer-bg-opacity="1"
          :show-history="true"
          history-limit="5"
          sharecontainer="both"
          sharecontainer-bg="#ffffff"
          sharecontainer-bg-opacity="1"
          :show-share="false"
          share-url=""
          :share="['facebook','telegram','twitter']"
          :show-dj="false"
          default-dj-img="https://ec1.everestcast.host:2750/media/djs/dj.png"
          :show-image="false"
          default-cover-image="https://ec1.everestcast.host:2750/media/tracks/default_track_img.png"
          play-button-color="#35495e"
          play-button-bg="null"
          visualizer-outline-color="#37679a"
          visualizer-bar-width="1"
          :channels-displayed="[1,2,3,4]"
          channels-switch-bg="#ffbf0f"
          channels-switch-color="#ffffff"
          channels-switch-bg-active="#dddddd"
          channels-switch-color-active="#000000"
          :show-vote="true"
          vote-buttons-color="#35495e"
          vote-buttons-opacity="1"
          vote-results-font-color="#FFFFFF"
          vote-results-font-size="16"
          :progress-show="true"
          progress-bar-color="#35495e"
          progress-bar-bg-color="#41b883"
          progress-bar-bg-opacity="0.1"
          progress-bar-bg-height="25"
          progress-bar-opacity="1"
          progress-font-color="#FFFFFF"
          progress-font-size="12"
          progress-bar-bg-radius="10"
          progress-bar-bg-border="#F5F5F5"
          player-width="${width}"
        >
        </div>
      `;

      // Initialize Vue app if available
      if (window.Vue && containerRef.current) {
        try {
          new window.Vue({
            el: containerRef.current.querySelector('div[is="player"]') || containerRef.current
          });
        } catch (error) {
          console.error('Vue initialization error:', error);
        }
      }
    };

    loadPlayer();
  }, [serverId, width]);

  return (
    <div 
      ref={containerRef}
      style={{ width, minHeight: "400px" }}
      id="sc-player"
    />
  );
}