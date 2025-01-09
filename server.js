const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');

app.set("view engine", "ejs");
app.use(express.static('static'));
app.use("/bs", express.static("./node_modules/bootstrap/dist/"));

app.get('/', (req, res) => {
    res.render("index");
});

app.get('/test', (req, res) => {
    res.render("test");
});

// SSE route to stream memory data
app.get('/sse/meminfo', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendMemInfo = () => {
        fs.readFile('/proc/meminfo', { encoding: 'utf-8' }, (err, data) => {
            if (!err) {
                const memraw = data.split(/\r\n|\r|\n/);
                const memTotalKb = parseInt(memraw[0].replace(/[^0-9]/g, ""), 10);
                const memFreeKb = parseInt(memraw[1].replace(/[^0-9]/g, ""), 10);
                const memAvailableKb = parseInt(memraw[2].replace(/[^0-9]/g, ""), 10);
                const cachedKb = parseInt(memraw[4].replace(/[^0-9]/g, ""), 10);

                const memUsedKb = memTotalKb - memAvailableKb;

                const memInfo = {
                    memTotalKb: memTotalKb,
                    memFreeKb: memFreeKb,
                    memAvailableKb: memAvailableKb,
                    memCachedKb: cachedKb,
                    memUsedKb: memUsedKb,
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

// SSE route to stream CPU usage
app.get('/sse/cpuinfo', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let prevIdle = 0, prevTotal = 0;

    const calculateCpuUsage = () => {
        fs.readFile('/proc/stat', { encoding: 'utf-8' }, (err, data) => {
            if (!err) {
                const cpuLine = data.split('\n')[0]; // Read the first line for "cpu"
                const cpuTimes = cpuLine.match(/\d+/g).map(Number);

                const idle = cpuTimes[3];
                const total = cpuTimes.reduce((acc, time) => acc + time, 0);

                if (prevTotal !== 0 && prevIdle !== 0) {
                    const idleDelta = idle - prevIdle;
                    const totalDelta = total - prevTotal;
                    const cpuUsage = ((1 - idleDelta / totalDelta) * 100).toFixed(2);

                    res.write(`data: ${JSON.stringify({ cpuUsage: `${cpuUsage}%` })}\n\n`);
                }

                prevIdle = idle;
                prevTotal = total;
            } else {
                console.log(err);
            }
        });
    };

    const interval = setInterval(calculateCpuUsage, 1000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

// SSE route to stream bandwidth usage
app.get('/sse/bandwidth', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let prevReceived = 0, prevTransmitted = 0, totalReceived = 0, totalTransmitted = 0;

    const calculateBandwidth = () => {
        fs.readFile('/proc/net/dev', { encoding: 'utf-8' }, (err, data) => {
            if (!err) {
                const lines = data.split('\n').slice(3); // Skip the first three lines (headers+lo)
                let received = 0, transmitted = 0;

                lines.forEach(line => {
                    const fields = line.trim().split(/\s+/);
                    if (fields.length > 9) {
                        received += parseInt(fields[1], 10); // RX bytes
                        transmitted += parseInt(fields[9], 10); // TX bytes
                    }
                });

                if (prevReceived !== 0 && prevTransmitted !== 0) {
                    const currentReceived = (received - prevReceived) / 1024; // KB/s
                    const currentTransmitted = (transmitted - prevTransmitted) / 1024; // KB/s
                    totalReceived += currentReceived;
                    totalTransmitted += currentTransmitted;

                    res.write(`data: ${JSON.stringify({
                        currentReceivedKb: currentReceived.toFixed(2),
                        currentTransmittedKb: currentTransmitted.toFixed(2),
                        totalReceivedKb: totalReceived.toFixed(2),
                        totalTransmittedKb: totalTransmitted.toFixed(2)
                    })}\n\n`);
                }

                prevReceived = received;
                prevTransmitted = transmitted;
            } else {
                console.log(err);
            }
        });
    };

    const interval = setInterval(calculateBandwidth, 1000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
