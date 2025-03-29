// Function to convert KB to MB/GB dynamically
const convertToDynamicUnit = (kb) => {
    if (kb >= 1024 * 1024) {
        return (kb / 1024 / 1024).toFixed(2) + " GB";
    } else if (kb >= 1024) {
        return (kb / 1024).toFixed(2) + " MB";
    } else {
        return kb + " KB";
    }
}

// Memory Info SSE
const memInfoSource = new EventSource('/sse/meminfo');
memInfoSource.onmessage = function (event) {
    const memInfo = JSON.parse(event.data)
    // Update memory information
    document.getElementById('used-memory').textContent = convertToDynamicUnit(memInfo.memUsedKb);
    document.getElementById('available-memory').textContent = convertToDynamicUnit(memInfo.memAvailableKb);
    document.getElementById('total-memory').textContent = convertToDynamicUnit(memInfo.memTotalKb);
    document.getElementById('free-memory').textContent = convertToDynamicUnit(memInfo.memFreeKb);
    document.getElementById('cached-memory').textContent = convertToDynamicUnit(memInfo.memCachedKb);
}
memInfoSource.onerror = function (error) {
    console.error('Memory SSE connection error:', error);
    memInfoSource.close();
}

// CPU Usage SSE
const cpuInfoSource = new EventSource('/sse/cpuinfo');
cpuInfoSource.onmessage = function (event) {
    const cpuInfo = JSON.parse(event.data)
    // Update CPU usage
    document.getElementById('cpu-usage').textContent = cpuInfo.cpuUsage;
}
cpuInfoSource.onerror = function (error) {
    console.error('CPU SSE connection error:', error);
    cpuInfoSource.close();
}

// Bandwidth Usage SSE
const bandwidthInfoSource = new EventSource('/sse/bandwidth');
bandwidthInfoSource.onmessage = function (event) {
    const bandwidthInfo = JSON.parse(event.data)
    // Update bandwidth information
    document.getElementById('current-received').textContent = convertToDynamicUnit(bandwidthInfo.currentReceivedKb);
    document.getElementById('current-transmitted').textContent = convertToDynamicUnit(bandwidthInfo.currentTransmittedKb);
    document.getElementById('total-received').textContent = convertToDynamicUnit(bandwidthInfo.totalReceivedKb);
    document.getElementById('total-transmitted').textContent = convertToDynamicUnit(bandwidthInfo.totalTransmittedKb);
}
bandwidthInfoSource.onerror = function (error) {
    console.error('Bandwidth SSE connection error:', error);
    bandwidthInfoSource.close();
};