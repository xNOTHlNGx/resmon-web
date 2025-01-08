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
        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
            if (!err) {
                // get separated lines
                let memraw = data.split(/\r\n|\r|\n/); 

                // Parse memory values (in KB)
                let memTotalKb = parseInt(memraw[0].replace(/[^0-9]/g, ""), 10); // MemTotal
                let memFreeKb = parseInt(memraw[1].replace(/[^0-9]/g, ""), 10); // MemFree
                let memAvailableKb = parseInt(memraw[2].replace(/[^0-9]/g, ""), 10); // MemAvailable
                let cachedKb = parseInt(memraw[4].replace(/[^0-9]/g, ""), 10); // Cached

                // Calculate used memory
                let memUsedKb = memTotalKb - memAvailableKb;

                // Helper function to convert KB to GB
                const convertToGB = (kb) => {
                    return (kb / 1024 / 1024).toFixed(2); // Convert KB to GB
                };

                // Convert all memory values to GB
                const memTotal = convertToGB(memTotalKb);
                const memFree = convertToGB(memFreeKb);
                const memAvailable = convertToGB(memAvailableKb);
                const memCached = convertToGB(cachedKb);
                const memUsed = convertToGB(memUsedKb);

                // Prepare memory info object
                const memInfo = {
                    memTotal: { value: memTotal, unit: 'GB' },
                    memFree: { value: memFree, unit: 'GB' },
                    memAvailable: { value: memAvailable, unit: 'GB' },
                    memCached: { value: memCached, unit: 'GB' },
                    memUsed: { value: memUsed, unit: 'GB' },
                };

                // Send the data
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
