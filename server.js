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
    
    // SSE route to stream memory data
app.get('/sse/meminfo', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendMemInfo = () => {
        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
            if (!err) {
                let memraw = data.split(/\r\n|\r|\n/); // get separated lines
                let memTotalKb = parseInt(memraw[0].replace(/[^0-9]/g, ""), 10); // Total in KB
                let memFreeKb = parseInt(memraw[1].replace(/[^0-9]/g, ""), 10); // Free in KB
                let memUsedKb = memTotalKb - memFreeKb;

                // Helper function to format memory in MB or GB
                const formatMemory = (kb) => {
                    if (kb >= 1048576) {
                        return { value: (kb / 1048576).toFixed(2), unit: 'GB' }; // Convert to GB
                    } else {
                        return { value: (kb / 1024).toFixed(2), unit: 'MB' }; // Convert to MB
                    }
                };

                const memTotal = formatMemory(memTotalKb);
                const memFree = formatMemory(memFreeKb);
                const memUsed = formatMemory(memUsedKb);

                const memInfo = {
                    memTotal: memTotal,
                    memFree: memFree,
                    memUsed: memUsed,
                };

                res.write(`data: ${JSON.stringify(memInfo)}\n\n`);
            } else {
                console.log(err);
            }
        });
    };

    const interval = setInterval(sendMemInfo, 1000);

    req.on('close', () => {
        clearInterval(interval);
    });
});


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
