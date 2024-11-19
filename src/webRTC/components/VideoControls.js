// 화상 통화 제어를 위한 버튼 컴포넌트
import React from 'react';
import '../styles/video.css';

const VideoControls = ({ onStartCall, onEndCall, isCalling }) => {
    return (
        <div className="video-controls">
            {/* 통화 상태에 따라 다른 버튼 표시 */}
            {!isCalling ? (
                <button onClick={onStartCall} className="start-call">
                    통화 시작
                </button>
            ) : (
                <button onClick={onEndCall} className="end-call">
                    통화 종료
                </button>
            )}
        </div>
    );
};

export default VideoControls;