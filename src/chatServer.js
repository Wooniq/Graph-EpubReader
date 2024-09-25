const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const iconv = require('iconv-lite');  // 인코딩 변환을 위한 라이브러리

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb', type: 'application/json', charset: 'utf-8' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, charset: 'utf-8' }));

app.post('/run-query', (req, res) => {
    let message = req.body.message;
    console.log(`message : ${message}`);
    message += " 한국어로 번역해줘.";

    // Python 실행 환경에 UTF-8 인코딩 적용
    const pythonCommand = `python -m graphrag.query --root ./src/parquet --response_type "single sentence" --method global "${message}"`;

    exec(pythonCommand, { encoding: 'buffer', env: { ...process.env, LANG: 'ko_KR.UTF-8' } }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: stderr || error.message });
        }

        let output = iconv.decode(stdout, 'euc-kr');
        
        console.log(output);

        // SUCCESS: Global Search Response 또는 SUCCESS: Local Search Response 이후의 텍스트 추출
        const regex = /SUCCESS: (?:Global|Local) Search Response:\s*(.*?)\s*(?:\[.*?\])?$/;

        // 정규 표현식을 사용하여 앞뒤 제거된 메시지를 추출
        const match = output.match(regex);
        let preanswer;

        if (match) {
            preanswer = match[1].trim(); // 실제 메시지 부분만 추출
            console.log(`Extracted answer: ${preanswer}`); // 추출된 답변 출력
        } else {
            console.log("No match found.");
            preanswer = "No valid response found."; // 매칭이 되지 않으면 기본 메시지 설정
        }

        // [Data: ...] 부분 제거
        preanswer = preanswer.replace(/\[Data:.*?\]/g, '').trim(); // [Data: ...] 형식의 부분을 제거하고 trim
        console.log(`Cleaned answer: ${preanswer}`); // 정제된 답변 출력

        res.json({ result: preanswer });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
