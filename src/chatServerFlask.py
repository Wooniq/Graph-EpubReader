import re
import shlex
from flask import Flask, request, jsonify
from flask_cors import CORS 
import subprocess
import os

app = Flask(__name__)
CORS(app)

@app.route('/run-query', methods=['POST'])
def run_query():
    message = request.json.get('message', '')
    print(f'message: {message}')
    message += " 한국어로 말해줘."

    # Python 실행 환경에 UTF-8 인코딩 적용
    python_command = [
        'python',
        '-m',
        'graphrag.query',
        '--root',
        './src/parquet',
        '--response_type',
        shlex.quote('single sentence'),
        '--method',
        'global',
        message
    ]

    # subprocess.run을 사용하여 명령어 실행
    result = subprocess.run(
        python_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, 'LANG': 'ko_KR.UTF-8'},
        encoding=None  # 바이트로 읽기 위해 encoding을 None으로 설정
    )

    if result.returncode != 0:
        print(f'exec error: {result.stderr}')
        return jsonify({'error': result.stderr or 'Error occurred during execution'}), 500

    # 바이트 스트림을 euc-kr로 디코드 (또는 다른 인코딩으로 변경)
    output = result.stdout.decode('euc-kr', errors='replace')  # euc-kr로 디코딩하고 오류가 발생한 바이트는 대체

    print(output)

    # SUCCESS: Global Search Response 또는 SUCCESS: Local Search Response 이후의 텍스트 추출
    regex = r'SUCCESS: (Global|Local) Search Response:\s*([\s\S]+?)(?=\[(Data|데이터)|\n*$)'
    match = re.search(regex, output)

    if match:
        answer = match.group(2).strip()  # 실제 메시지 부분만 추출
        print(f'Extracted answer: {answer}')  # 추출된 답변 출력
    else:
        print("No match found.")
        answer = "No valid response found."  # 매칭이 되지 않으면 기본 메시지 설정

    return jsonify({'result': answer})

if __name__ == '__main__':
    app.run(port=3000)
