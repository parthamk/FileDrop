import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { saveAs } from "file-saver";

const sockets = io("http://localhost:8000");

function App() {
  const [signalStatus, setSignalStatus] = useState("Not accepted");
  const [myID, setMyID] = useState<string>("no");
  const [partnerId, setPartnerId] = useState<string>("no");
  const [acceptCaller, setAcceptCaller] = useState(false);
  const [signalingData, setSignalingData] = useState<any>({});
  const [fileInput, setFileInput] = useState<any>();
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const peerRef = useRef<any>();
  const [rawData, setRawData] = useState<any>();
  const [fileNameState, setFileNameState] = useState<any>("");
  const [transferProgress, setTransferProgress] = useState<number>(0);

  useEffect(() => {
    sockets.on("signaling", (data) => {
      console.log(data);
      setAcceptCaller(true);
      setSignalingData(data);
      setPartnerId(data.from);
    });

    // Cleanup function when the component unmounts
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        setAcceptCaller(false);
        setSignalStatus("Not accepted");
        setReceivedFiles([]);
      }
    };
  }, []);

  const setUserID = () => {
    sockets.emit("details", {
      socketId: sockets.id,
      uniqueId: myID,
    });
  };

  const callUser = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
    });

    peerRef.current = peer;

    peer.on("signal", (data) => {
      console.log("Signal data:", data);
      sockets.emit("send-signal", {
        from: myID,
        signalData: data,
        to: partnerId,
      });
    });

    peer.on("data", (data) => {
      console.log("Received data:", data);
      handleReceivingData(data);
    });

    sockets.on("callAccepted", (data) => {
      peer.signal(data.signalData);
      setSignalStatus("Signal accepted");
    });
  };

  const acceptCall = () => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    peerRef.current = peer;

    peer.on("signal", (data) => {
      sockets.emit("accept-signal", {
        signalData: data,
        to: partnerId,
      });
    });

    peer.signal(signalingData.signalData);

    peer.on("data", (data) => {
      console.log("Accept call fnc");
      handleReceivingData(data);
    });
  };

  function handleReceivingData(data: any) {
    if (data.toString().includes("done")) {
      const parsed = JSON.parse(data);
      setFileNameState(parsed.fileName);
    } else {
      setRawData(data);
    }
  }

  const downloadFile = (fileRawData: any, fileName: any) => {
    const blob = new Blob([fileRawData]);
    saveAs(blob, fileName);
  };

  const selectFiles = () => {
    const peer = peerRef.current;
    const file = fileInput[0];

    const chunkSize = 16 * 1024; // 16 KB chunks (you can adjust this size)
    let offset = 0;

    const readAndSendChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          const chunkData = event.target.result;

          // Convert chunkData to a Uint8Array
          const uint8ArrayChunk = new Uint8Array(chunkData);

          peer.write(uint8ArrayChunk);

          offset += chunkSize;

          const progress = (offset / file.size) * 100;
          setTransferProgress(progress);

          if (offset < file.size) {
            readAndSendChunk(); // Continue reading and sending chunks
          } else {
            peer.write(JSON.stringify({ done: true, fileName: file.name }));
          }
        }
      };

      reader.readAsArrayBuffer(chunk);
    };

    readAndSendChunk();
  };

  return (
    <>
      <input onChange={(e) => setMyID(String(e.target.value))} />
      <button onClick={setUserID}>ID</button>
      <br />
      <input onChange={(e) => setPartnerId(e.target.value)} />
      <button onClick={callUser}>Call</button>
      <br />

      <input type="file" onChange={(e: any) => setFileInput(e.target.files)} />
      <button onClick={selectFiles}>Send files</button>
      <br />
      <br />
      {signalStatus}
      {acceptCaller ? (
        <>
          <p>{signalingData?.from} is calling you</p>
          <button onClick={acceptCall}>Accept</button>
        </>
      ) : null}
      <br />
      {receivedFiles.map((file, index) => (
        <div key={index}>
          <button onClick={() => downloadFile(rawData, fileNameState)}>
            Download {file.name}
          </button>
        </div>
      ))}
      {fileNameState ? (
        <>
          <button onClick={() => downloadFile(rawData, fileNameState)}>
            Download {fileNameState}
          </button>
        </>
      ) : null}
      <br />
      {transferProgress > 0 && transferProgress < 100 && (
        <p>Transfer Progress: {transferProgress.toFixed(2)}%</p>
      )}
    </>
  );
}

export default App;