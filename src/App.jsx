import React, { useEffect, useRef, useState } from 'react';
import { createDecartClient, models } from '@decartai/sdk';
import './App.css';

function App() {
  const videoInputRef = useRef(null);
  const videoOutputRef = useRef(null);
  const realtimeClientRef = useRef(null);
  const [prompt, setPrompt] = useState('Anime style');
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // This is a self-invoking async function
    (async () => {
      try {
        // STEP 1: Fetch the API Key from our new endpoint
        setStatus('Fetching API Key...');
        const response = await fetch('/api/get-key');
        const data = await response.json();

        if (!response.ok || !data.apiKey) {
          throw new Error(data.error || 'Failed to fetch API Key.');
        }
        
        const decartApiKey = data.apiKey;

        // STEP 2: Request camera access
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

        // STEP 3: Connect to Decart with the fetched key
        setStatus('Connecting to Decart...');
        const client = createDecartClient({ apiKey: decartApiKey });
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
        console.error("Failed during setup:", error);
        setStatus(`Error: ${error.message}`);
      }
    })(); // End of self-invoking async function

    return () => {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
        console.log("Decart client disconnected.");
      }
    };
  }, []); // The empty array means this effect runs only once

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
