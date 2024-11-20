/* WebRTC 연결을 관리하는 클라이언트 클래스 
- 시그널링 서버와의 소켓 연결 설정
- WebRTC 연결 초기화
- 시그널링 서버와의 통신을 위한 소켓 이벤트 리스너 설정
- WebRTC 피어 연결 이벤트 리스너 설정
- 통화 시작 및 종료 메서드 제공
- WebRTC 인스턴스 정리 메서드 제공
*/

import { io } from 'socket.io-client';

class WebRTCClient {
    constructor() {
        // 시그널링 서버와의 소켓 연결 설정
        this.socket = io('http://localhost:5001', {
            transports: ['websocket'],  // 웹소켓 프로토콜만 사용
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        console.log('webRTCClient.js에서 socket 연결 설정 완료');
        // WebRTC 연결 객체
        this.peerConnection = null;
        // 로컬 미디어 스트림
        this.localStream = null;
        // 원격 미디어 스트림
        this.remoteStream = null;
        // 소켓 이벤트 리스너 설정
        this.setupSocketListeners();
        // 통화 상태 변경 콜백 
        this.onStatusChange = null;
        // 클라이언트 타입 변경 콜백
        this.onClientType = null;

        console.log('webRTCClient.js에서 각종 설정 완료');

        // 소켓 연결 시 클라이언트 타입 설정
        this.socket.on('connected', (data) => {
            if (this.onClientType) {
                this.onClientType(data.clientType);
            }
            console.log('webRTCClient.js에서 connected 이벤트 수신: ', data);
        });

        // 사용자가 방에 참여했을 때
        this.socket.on('user_joined', () => {
            if (this.onStatusChange) {
                this.onStatusChange('connecting');
            }
            console.log('webRTCClient.js에서 user_joined 이벤트 수신: ', this.onStatusChange);
        });
    }

    // WebRTC 연결 초기화
    async initializeConnection() {
        try {
            // 사용자에게 미디어 권한 요청 전에 상태 업데이트
            if (this.onStatusChange) {
                this.onStatusChange('requesting_permissions');
            }

            // 미디어 스트림 가져오기 시도
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.error('카메라/마이크 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
                    if (this.onStatusChange) {
                        this.onStatusChange('permission_denied');
                    }
                }
                throw error;
            });
            console.log('webRTCClient.js에서 localStream: ', this.localStream);

            // RTCPeerConnection 초기화
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }    // Google STUN 서버 사용 => 외부 서버를 사용하여 연결 설정
                ]
            });
            console.log('webRTCClient.js에서 peerConnection : ', this.peerConnection);
            // 로컬 스트림의 모든 트랙을 피어 커넥션에 추가 => 로컬 미디어 스트림을 피어 커넥션에 추가
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // peerConnection이 초기화된 후에 리스너 설정
            this.setupPeerConnectionListeners();

            return this.localStream;
        } catch (error) {
            console.error('Error initializing connection:', error);
            throw error;
        }
    }

    // 시그널링 서버와의 통신을 위한 소켓 이벤트 리스너 설정
    setupSocketListeners() {
        // 기존 리스너 제거
        this.socket.removeAllListeners();
        
        // 연결 성공 시
        this.socket.on('connected', (data) => {
            if (this.onClientType) {
                this.onClientType(data.clientType);
            }
            console.log('webRTCClient.js에서 connected 이벤트 수신. 내용은 ', data);
        });

        // 다른 사용자가 방에 참여했을 때
        this.socket.on('user_joined', () => {
            if (this.onStatusChange) {
                this.onStatusChange('connecting');
            }
            console.log('webRTCClient.js에서 user_joined 이벤트 수신. 상태는 ', this.onStatusChange);
        });

        // Offer를 받았을 때
        this.socket.on('offer', async (offer) => {
            try {
                await this.peerConnection.setRemoteDescription(offer);
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.socket.emit('answer', answer);
                this.onStatusChange?.('connected');
                console.log('webRTCClient.js에서 offer 수신. 상태는 ', this.onStatusChange);
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        // Answer를 받았을 때
        this.socket.on('answer', async (answer) => {
            try {
                await this.peerConnection.setRemoteDescription(answer);
                this.onStatusChange?.('connected');
                console.log('webRTCClient.js에서 answer 수신. 상태는 ', this.onStatusChange);
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });

        // ICE candidate를 받았을 때
        this.socket.on('ice_candidate', async (candidate) => {
            try {
                await this.peerConnection.addIceCandidate(candidate);
                console.log('webRTCClient.js에서 ice_candidate 후보 수신. 내용은 ', candidate);
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });
    }

    // WebRTC 피어 연결 이벤트 리스너 설정
    setupPeerConnectionListeners() {
        // ICE 후보가 생성되었을 때
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice_candidate', event.candidate);
                console.log('webRTCClient.js에서 ice_candidate 후보 전송. 내용은 ', event.candidate);
            }
        };

        // 원격 스트림이 추가되었을 때
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            // VideoChat 컴포넌트에 콜백 함수를 전달하여 비디오 엘리먼트 업데이트
            if (this.onRemoteStream) {
                this.onRemoteStream(this.remoteStream);
            }
            console.log('webRTCClient.js에서 ontrack 이벤트 수신. 원격 스트림은 ', this.remoteStream);
        };
    }

    // 통화 시작 - offer 생성 및 전송
    async startCall() {
        try {
            // 방에 참여
            this.socket.emit('join_room', { room: 'default-room' });
            console.log('webRTCClient.js에서 join_room 전송. 내용은 ', { room: 'default-room' });
            
            // 피어 커넥션이 없으면 초기화
            if (!this.peerConnection) {
                await this.initializeConnection();
            }
            
            console.log('Creating offer...');
            // Offer 생성
            const offer = await this.peerConnection.createOffer();
            console.log('Setting local description...');
            await this.peerConnection.setLocalDescription(offer);
            
            // Offer를 시그널링 서버로 전송
            console.log('Sending offer to signaling server...');
            this.socket.emit('offer', offer);
            
        } catch (error) {
            console.error('Error in startCall:', error);
            throw error;
        }
    }

    // 통화 종료
    async endCall() {
        // 로컬 스트림 정지
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        // 피어 커넥션 닫기
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        // 방 퇴장
        this.socket.emit('leave_room', { room: 'default-room' });
        this.onStatusChange?.('ready');
        console.log('end call');
    }

    // WebRTC 인스턴스 정리
    cleanup() {
        this.endCall();
        this.socket.disconnect();
        console.log('cleanup');
    }
}

export default WebRTCClient;