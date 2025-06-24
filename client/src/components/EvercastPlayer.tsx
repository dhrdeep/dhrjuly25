import React from 'react';

interface EvercastPlayerProps {
  width?: string;
  serverId?: number;
}

export default function EvercastPlayer({ width = "1000px", serverId = 1 }: EvercastPlayerProps) {
  return (
    <div style={{ width, minHeight: "400px" }}>
      <iframe
        src={`https://ec1.everestcast.host:2750/widgets/player?server=${serverId}&skin=default&theme=dark&history=true&vote=true&channels=[1,2,3,4]&imagecontainer-bg=%23f79e02&controlscontainer-bg=%23000000&historycontainer-bg=%23cdd8e5&visualizer-outline-color=%23ff6b35&channels-switch-bg=%23ffbf0f&progress-bar-color=%23f79e02`}
        width={width}
        height="400"
        frameBorder="0"
        style={{
          border: 'none',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        title="DHR1 Player"
        allowFullScreen
      />
    </div>
  );
}