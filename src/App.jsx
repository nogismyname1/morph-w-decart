import React, { useEffect, useRef, useState } from 'react';
import { createDecartClient, models } from '@decartai/sdk';
import './App.css';

function App() {
  const videoInputRef = useRef(null);
  const videoOutputRef = useRef(null);
  const realtimeClientRef = useRef(null);
  const [prompt, setPrompt] = useState('Anime style');
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    const setupDecart = async () => {
      try {
        setStatus('Requesting camera...');
        const model = models.realtime("lucy_v2v_720p_rt");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            frameRate: model.fps,
            width: model.width,
            height: model.height,
          }
        });
        
        if (videoInputRef.current) {
          videoInputRef.current.srcObject = stream;
        }

        setStatus('Connecting to Decart...');
        const client = createDecartClient({
          apiKey: import.meta.env.VITE_DECART_API_KEY
        });

        const realtimeClient = await client.realtime.connect(stream, {
          model,
          onRemoteStream: (editedStream) => {
            if (videoOutputRef.current) {
              videoOutputRef.current.srcObject = editedStream;
              setStatus('Connected and Streaming');
            }
          }
        });
        
        realtimeClientRef.current = realtimeClient;
        realtimeClient.setPrompt(prompt);

      } catch (error) {
        console.error("Failed to setup Decart:", error);
        setStatus(`Error: ${error.message}`);
      }
    };

    setupDecart();

    return () => {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
        console.log("Decart client disconnected.");
      }
    };
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const applyPrompt = () => {
    if (realtimeClientRef.current) {
      realtimeClientRef.current.setPrompt(prompt);
      console.log(`Applied new prompt: ${prompt}`);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Decart Real-Time Video</h1>
        <p>Status: {status}</p>
      </header>
      <main>
        <div className="video-container">
          <div className="video-box">
            <h2>Your Camera</h2>
            <video ref__={videoInputRef} autoPlay playsInline muted></video>
          </div>
          <div className="video-box">
            <h2>Edited Output</h2>
            <video ref__={videoOutputRef} autoPlay playsInline muted></video>
          </div>
        </div>
        <div className="controls">
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter a style prompt..."
          />
          <button onClick={applyPrompt}>Apply Style</button>
        </div>
      </main>
    </div>
  );
}

export default App;
