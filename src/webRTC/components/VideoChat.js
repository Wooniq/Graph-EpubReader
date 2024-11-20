// WebRTC 화상 통화를 위한 React 컴포넌트
import React, { useRef, useState } from 'react';
import WebRTCClient from '../utils/webRTCClient';
import '../styles/video.css';

const VideoChat = () => {
    // 로컬 비디오 엘리먼트를 참조하기 위한 ref
    /* useRef(null)
    - 컴포넌트의 생명주기 동안 지속되는 가변값을 저장하는 컨테이너
    - `.current` 프로퍼티를 통해 값에 접근/수정
    - 값이 변경되어도 컴포넌트는 재렌더링되지 않음 
    - DOM 요소에 직접 참조할 때 주로 사용
    */
    const localVideoRef = useRef(null);         // 로컬 비디오 엘리먼트를 참조하기 위한 ref
    const remoteVideoRef = useRef(null);    
    const webRTCRef = useRef(null);         
    const [callStatus, setCallStatus] = useState('ready');      // 통화 상태를 관리하는 state

    // 통화 시작 버튼 클릭 시 호출되는 함수
    const handleStartCall = async () => {
        try {
            setCallStatus('connecting');
            
            // WebRTCClient 인스턴스 생성 및 초기화
            if (!webRTCRef.current) {
                const webRTCInstance = new WebRTCClient();
                webRTCRef.current = webRTCInstance;
                
                // 통화 상태 변경 콜백 함수 설정
                webRTCRef.current.onStatusChange = (status) => {
                    if (status === 'connected') {   
                        setCallStatus('inCall');    
                    } else {
                        setCallStatus(status);
                    }
                };

                // 원격 스트림 처리를 위한 콜백 추가
                webRTCRef.current.onRemoteStream = (stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                };
                
                // 로컬 비디오 스트림 설정
                const localStream = await webRTCRef.current.initializeConnection();
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream;
                }
            }
            
            await webRTCRef.current.startCall();
        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus('ready');
        }
    };

    // 통화 종료 버튼 클릭 시 호출되는 함수
    const handleEndCall = async () => {
        try {
            await webRTCRef.current?.endCall();
            setCallStatus('ready');
            // WebRTCClient 인스턴스 정리
            if (webRTCRef.current) {
                webRTCRef.current.cleanup();
                webRTCRef.current = null;
            }
            // 비디오 스트림 정리
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
        } catch (error) {
            console.error('Failed to end call:', error);
        }
    };

    // 버튼 텍스트 결정 함수
    const getButtonText = () => {
        switch (callStatus) {
            case 'ready':
                return '통화 시작';
            case 'connecting':
                return '통화 연결 중';
            case 'inCall':
                return '통화 중';
            case 'ending':
                return '통화 종료';
            default:
                return '통화 시작';
        }
    };

    return (
        <div className="video-container">
            <div className="video-box">
                    <h3>나</h3>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        allow="autoplay; camera; microphone"
                        sandbox="allow-scripts"
                    />
                </div>
                <div className="video-box">
                    <h3>상대방</h3>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline
                        allow="autoplay; camera; microphone"
                        sandbox="allow-scripts"
                    />
                </div>
            <button 
                onClick={callStatus === 'inCall' ? handleEndCall : handleStartCall}
                className={callStatus === 'inCall' ? 'end-call' : 'start-call'}
            >
                {getButtonText()}
            </button>
        </div>
    );
};

export default VideoChat;