'''WebRTC 시그널링 서버 구현: 클라이언트 간의 P2P 연결을 위한 중개 역할 수행
- 클라이언트 연결 및 방 참여 관리
- 통신 채널 설정 및 최적화
'''

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import logging

# 로깅 설정 - 서버 동작 추적을 위한 INFO 레벨 로깅
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask 애플리케이션 및 SocketIO 인스턴스 생성
# cors_allowed_origins="*"로 모든 도메인에서의 접근 허용
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# 연결된 사용자 정보를 저장하는 딕셔너리
# 구조: {user_id: {'room': room_name, 'type': client_type}}
connected_users = {}

# 클라이언트 연결 시 호출되는 이벤트 핸들러
@socketio.on('connect')
def handle_connect():
    user_id = request.sid
    # 현재 연결된 모든 사용자 수를 확인
    existing_users = len(connected_users)
    
    # 첫 번째 연결자는 'A', 두 번째 연결자는 'B' 타입으로 지정
    client_type = 'A' if existing_users == 0 else 'B'
    
    # 사용자 정보 저장
    connected_users[user_id] = {'room': None, 'type': client_type}
    
    logger.info(f'클라이언트 연결 완료. ID: {user_id}, 타입: {client_type}')
    emit('connected', {'clientType': client_type})

# 방 참여 요청 처리
@socketio.on('join_room')
def handle_join_room(data):
    logger.info(f'방 참여 요청 수신. 내용: {data}')
    room = data['room']
    user_id = request.sid
    # Socket.IO의 room에 사용자 추가
    join_room(room)
    # 현재 방의 사용자 수 확인하여 클라이언트 타입 결정
    room_users = [user for user in connected_users.values() if user['room'] == room]
    client_type = 'A' if len(room_users) == 0 else 'B'
    # 사용자 정보 업데이트
    connected_users[user_id] = {'room': room, 'type': client_type}
    logger.info(f'사용자 정보 업데이트 및 방 참여 완료. 내용: {connected_users[user_id]}')
    # 방의 모든 사용자에게 새 참여자 알림
    emit('user_joined', {'userId': user_id, 'clientType': client_type}, room=room) 

# WebRTC Offer 처리 (P2P 연결 초기화)
@socketio.on('offer')
def handle_offer(data):
    logger.info(f'offer 수신. 내용: {data}')
    room = connected_users[request.sid]['room']
    client_type = connected_users[request.sid]['type']
    logger.info(f'{client_type}가 {room} 방에서 offer 수신')
    # 같은 방의 다른 사용자에게 offer 전달
    emit('offer', data, room=room, skip_sid=request.sid)
    logger.info(f'{client_type}가 {room} 방에서 offer 전달 완료')

# WebRTC Answer 처리 (P2P 연결 응답)
@socketio.on('answer')
def handle_answer(data):
    room = connected_users[request.sid]['room']
    client_type = connected_users[request.sid]['type']
    logger.info(f'Received answer from {client_type} in room {room}')
    # offer를 보낸 사용자에게 answer 전달
    emit('answer', data, room=room, skip_sid=request.sid)

# ICE candidate 교환 처리 (P2P 연결 최적화)
@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    room = connected_users[request.sid]['room']
    client_type = connected_users[request.sid]['type']
    logger.info(f'Received ICE candidate from {client_type} in room {room}')
    # 상대방에게 ICE candidate 정보 전달
    emit('ice_candidate', data, room=room, skip_sid=request.sid)

# 방 나가기 처리
@socketio.on('leave_room')
def handle_leave_room(data):
    room = data['room']
    user_id = request.sid
    # Socket.IO room에서 사용자 제거
    leave_room(room)
    # 사용자 정보에서 방 정보 제거
    connected_users[user_id]['room'] = None
    # 방의 다른 사용자에게 퇴장 알림
    emit('user_left', {'userId': user_id}, room=room)

# 연결 종료 처리
@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    if user_id in connected_users:
        room = connected_users[user_id]['room']
        if room:
            # 방에서 사용자 제 및 다른 사용자에게 알림
            leave_room(room)
            emit('user_left', {'userId': user_id}, room=room)
        # 연결된 사용자 목록에서 제거
        del connected_users[user_id]

# 서버 실행 설정
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)