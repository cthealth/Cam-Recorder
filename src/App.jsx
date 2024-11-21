import React, { useRef, useState } from "react";



function App() {
  const [status, setStatus] = useState("Idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const combinedStreamRef = useRef(null);

  const startRecording = async () => {
    try {
      setStatus("Starting...");

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, 
      });
      


      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          sampleRate: 16000, 
          channelCount: 1,   
        } 
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);
        setStatus("Recording stopped");
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

  return (
    <>
    <div >
      <h1>Screen and Webcam Recorder</h1>
      <p>Status: {status}</p>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
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
    </>
  )
}

export default App
