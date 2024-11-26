import os
import re
import shlex
import subprocess
import threading
import time

from flask import Flask, jsonify, request
from flask_cors import CORS
#from speaker import text_to_speech

app = Flask(__name__)
CORS(app)

recordText=""

@app.route('/run-query', methods=['POST'])
def run_query():
    message = request.json.get('message', '')
    resMethod = request.json.get('resMethod', '')

    print(f'message: {message}')
    print(f'resMethod: {resMethod}')

    message += " 영어 말고 한국어로 답변해줘."

    # Python 실행 환경에 UTF-8 인코딩 적용
    python_command = [
        'graphrag',
        'query',
        '--root',
        './parquet',
        '--response-type',
        'Single Sentence',
        '--method',
        resMethod,
        '--query',
        message
    ]
    
    # 명령어 실행 전에 시간 측정 시작
    start_time = time.time()  # 시작 시간 기록

    # subprocess.run을 사용하여 명령어 실행
    result = subprocess.run(
        python_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, 'LANG': 'ko_KR.UTF-8'},
        encoding='utf-8'  # 바이트로 읽기 위해 encoding을 None으로 설정
    )
    
    # 명령어 실행 후 시간 측정
    end_time = time.time()  # 종료 시간 기록
    execution_time = end_time - start_time  # 실행 시간 계산
    print(f'execution_time : {execution_time}')

    if result.returncode != 0:
        print(f'exec error: {result.stderr}')
        return jsonify({'error': result.stderr or 'Error occurred during execution'}), 500

    # 바이트 스트림을 euc-kr로 디코드 (또는 다른 인코딩으로 변경)
    output = result.stdout
    print(output)

    # 정규 표현식으로 [Data: {내용}], **.. **, # 부분을 제거
    answer = re.sub(r'.*SUCCESS: (Local|Global) Search Response:\s*', '', output, flags=re.DOTALL)  # SUCCESS 이후 내용만 남기기
    answer = re.sub(r'\[Data:.*?\]\s*|\[데이터:.*?\]\s*|\*.*?\*\s*|#', '', answer)  # [Data: ...] 및 *...* 제거
    print(answer)
  
    # #test용  answer
    # answer = "hi!!!!!!!"

    #global recordText
    #recordText = answer
    #text_to_speech(answer)
    return jsonify({'result': answer})



# @app.route('/get-record-text', methods=['GET'])
# def get_record_text():
#     print(f"Returning recordText: {recordText}")
#     return jsonify({'recordText': recordText})


# @app.route('/set-record-text', methods=['POST'])
# def set_record_text():
#     global recordText
#     data = request.json
#     recordText = data.get('recordText', '')
#     return jsonify({'message': 'recordText updated successfully', 'recordText': recordText})




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
    # app.run(host='0.0.0.0', port=5000, debug=True) # local 환경설정
