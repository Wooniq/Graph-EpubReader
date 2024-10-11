const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const iconv = require('iconv-lite');  // 인코딩 변환을 위한 라이브러리

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb', type: 'application/json', charset: 'utf-8' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, charset: 'utf-8' }));

app.post('/run-query', (req, res) => {
    let message = req.body.message;
    console.log(`message : ${message}`);
    message += "한국어로 번역해주세요. 읽기 쉽고 자연스럽게 전달되도록, 가독성을 최우선으로 생각해주세요.";

    // Python 실행 환경에 UTF-8 인코딩 적용
    const pythonCommand = `python -m graphrag.query --root ./src/parquet --method global "${message}"`;
    //--response_type "Single Paragraph" 생략함.

    exec(pythonCommand, { encoding: 'buffer', env: { ...process.env, LANG: 'ko_KR.UTF-8' } }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: stderr || error.message });
        }

        let output = stdout.toString('utf-8');
        
        console.log(output);

        // SUCCESS: Global Search Response 또는 SUCCESS: Local Search Response 이후의 텍스트 추출
        // const regex = /SUCCESS: (Global|Local) Search Response:\s*(.*)/;
        const regex = /SUCCESS: (Global|Local) Search Response:\s*([\s\S]+?)(?=\[(Data|데이터)|\n*$)/;

        // 정규 표현식을 사용하여 앞뒤 제거된 메시지를 추출
        const match = output.match(regex);
        let answer;

        if (match) {
            answer = match[2].trim(); // 실제 메시지 부분만 추출
            console.log(`Extracted answer: ${answer}`); // 추출된 답변 출력
        } else {
            console.log("No match found.");
            answer = "No valid response found."; // 매칭이 되지 않으면 기본 메시지 설정
        }

        res.json({ result: answer });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
