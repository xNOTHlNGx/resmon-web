const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const filePath = path.join('/proc/meminfo');

app.set("view engine", "ejs");
app.use(express.static('static'));

app.get('/', (req, res) => {
  res.render("index");
});

//info page (will be removed, created for demonstration for frontend)
app.get('/test', (req, res) => {
  res.render("test");
});

// SSE route to stream memory data
app.get('/sse/meminfo', (req, res) => {
    // Set the appropriate headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sendMemInfo = () => {
        fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data) {
            if (!err) {
                let memraw = data.split(/\r\n|\r|\n/); // get separated lines
                let memTotal = (parseInt(memraw[0].replace(/[^0-9]/g, ""))/1048576).toFixed(2); // get Total physical memory, divide by 1,048,576 (kb to gb), round to 2 symbols
                let memFree = (parseInt(memraw[1].replace(/[^0-9]/g, ""))/1048576).toFixed(2); // get Free physical memory, divide by 1,048,576 (kb to gb), round to 2 symbols
                const memInfo = {
                    "memTotal": memTotal,
                    "memFree": memFree,
                    "memUsed": memTotal - memFree
                };
                // Send data to the client
                res.write(`data: ${JSON.stringify(memInfo)}\n\n`);
            } else {
                console.log(err);
            }
        });
    };

    // Send memory info every 1 second
    const interval = setInterval(sendMemInfo, 1000);

    // Close the connection when the client disconnects
    req.on('close', () => {
        clearInterval(interval);
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
