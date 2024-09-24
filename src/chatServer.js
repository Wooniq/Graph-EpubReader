const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/run-query', (req, res) => {
    const message = req.body.message; // 클라이언트로부터 메시지를 받음
    const pythonCommand = `python -m graphrag.query --root ./src/parquet --response_type "single sentence" --method global "${message}"`;

    exec(pythonCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: stderr || error.message });
        }

        // 응답 헤더에 Content-Type을 설정하여 UTF-8 인코딩을 명시
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({ result: stdout.trim() });
    });
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
