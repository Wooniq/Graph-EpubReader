import axios from "axios";

let mediaRecorder;
let audioChunks = [];

// Whisper API 설정
const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_API_KEY = "";


// 음성 녹음 시작
const startRecording = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Media devices are not supported by your browser.");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    return new Promise((resolve, reject) => {
      audioChunks = [];
     
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        try {
          const text = await transcribeAudio(audioBlob);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };

      mediaRecorder.start();
      console.log("Recording started. Speak now...");

      setTimeout(() => {
        mediaRecorder.stop();
        console.log("Recording stopped.");
      }, 5000); // 녹음 시간 제한 (5초)
    });
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
};

// Whisper API를 사용하여 음성을 텍스트로 변환
const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axios.post(WHISPER_API_URL, formData, {
      headers: {
        "Authorization": `Bearer ${WHISPER_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.text; // Whisper API의 결과 텍스트 반환
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export { startRecording };
