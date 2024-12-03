import React, { useEffect, useRef, useState } from "react";

function App() {
  const [status, setStatus] = useState("Idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const combinedStreamRef = useRef(null);
  const tokenClientRef = useRef(null); // <-- Add this line
  const [accessToken, setAccessToken] = useState(null);

  const initializeTokenClient = () => {
    if (!window.google || !window.google.accounts) {
      console.error("Google Identity Services library not loaded.");
      return;
    }

    return window.google.accounts.oauth2.initTokenClient({
      client_id:
        "307813090600-kldsd3d345j4vgm07t1tsruoujfeqa6u.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          console.log("Access Token:", response.access_token);
        } else {
          console.error("Failed to retrieve access token:", response);
        }
      },
    });
  };

  useEffect(() => {
    const tokenClient = initializeTokenClient();
    tokenClientRef.current = tokenClient; // <-- Store the token client
  }, []);

  const startRecording = async () => {
    try {
      setStatus("Starting...");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const [screenTrack] = screenStream.getVideoTracks();
      const screenSettings = screenTrack.getSettings();
      canvas.width = screenSettings.width || 640;
      canvas.height = screenSettings.height || 360;

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.play();

      const webcamVideo = document.createElement("video");
      webcamVideo.srcObject = webcamStream;
      webcamVideo.play();

      function draw() {
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(webcamVideo, 10, 10, 200, 150);
        requestAnimationFrame(draw);
      }
      draw();

      const canvasStream = canvas.captureStream(10);
      const combinedStream = new MediaStream([
        ...canvasStream.getTracks(),
        ...screenStream.getAudioTracks(),
        ...webcamStream.getAudioTracks(),
      ]);
      combinedStreamRef.current = combinedStream;

      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);
        setStatus("Recording stopped");

        if (accessToken) {
          await uploadToGoogleDrive(blob);
        } else {
          console.error("Access token not available. Please authenticate.");
        }
      };

      mediaRecorder.start();
      setStatus("Recording...");
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("Error");
    }
  };

  const stopRecording = () => {
    setStatus("Stopping...");
    mediaRecorderRef.current?.stop();
    combinedStreamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const uploadToGoogleDrive = async (blob) => {
    try {
      const metadata = {
        name: `Recording-${Date.now()}.webm`,
        mimeType: "video/webm",
        parents: ["1lTtaHPpuHfTAashopX4gkf20ZgrhPRuf"], // Replace with your folder ID
      };

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", blob);

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        }
      );

      if (response.ok) {
        alert("Recording uploaded successfully!");
      } else {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        alert("Failed to upload recording.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file.");
    }
  };

  return (
    <div>
    <h1>Screen and Webcam Recorder</h1>
    <p>Status: {status}</p>
    <button onClick={startRecording} disabled={status === "Recording..."}>
      Start new Recording
    </button>
    <button onClick={stopRecording} disabled={status !== "Recording..."}>
      Stop Recording
    </button>
    {mediaBlobUrl && (
      <video
        src={mediaBlobUrl}
        controls
        autoPlay
        loop
        style={{ width: "100%" }}
      ></video>
    )}
  </div>
  );
}

export default App;
