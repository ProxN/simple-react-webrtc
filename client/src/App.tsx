import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import Peer, { SignalData } from 'simple-peer';
import { io, Socket } from 'socket.io-client';

const endpoint = 'http://localhost:5000';

const Video = styled.video`
  border: 1px solid orangered;
  width: 30%;
  height: 30%;
`;

function App() {
  const [stream, setStream] = useState<MediaStream>();
  const [yourId, setYourId] = useState('');
  const [users, setUsers] = useState([]);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [signalCaller, setSignalCaller] = useState<SignalData | string>();

  const socket = useRef<Socket>();
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    socket.current = io(endpoint);
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.current.on('yourId', (id: string) => {
      setYourId(id);
    });

    socket.current.on('allUsers', (users: []) => {
      setUsers(users);
    });

    socket.current.on('hey', (data: any) => {
      setReceivingCall(true);
      setCaller(data.from);
      setSignalCaller(data.signal);
    });
  }, []);

  const callPeer = (id: string) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.current?.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: yourId,
      });
    });

    peer.on('stream', (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current?.on('callAccepted', (signal: any) => {
      peer.signal(signal);
    });
  };

  const acceptCall = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      socket.current?.emit('acceptCall', { signal: data, to: caller });
    });

    peer.on('stream', (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    if (signalCaller) {
      peer.signal(signalCaller);
    }
  };

  return (
    <div className="App">
      <div style={{ display: 'flex' }}>
        <Video playsInline muted ref={userVideo} autoPlay />
        <Video playsInline muted ref={partnerVideo} autoPlay />
      </div>
      <h1>My ID: {yourId}</h1>
      {receivingCall && (
        <div>
          <h2>{caller} is Calling you</h2>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}
      {users &&
        Object.values(users).map(
          (el) =>
            el !== yourId && (
              <button onClick={() => callPeer(el)} key={el}>
                call {el}
              </button>
            )
        )}
    </div>
  );
}

export default App;
