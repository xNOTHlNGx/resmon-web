const express = require('express')
const app = express()
const port = 3000
var fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, '/proc/meminfo');

app.set("view engine", "ejs")
app.use(express.static('static'));

app.get('/', (req, res) => {
  res.render("index")
})

app.get('/api/meminfo', (req, res) => {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            let memraw = data.split(/\r\n|\r|\n/); // get separated lines
            let memTotal = data[0].replace(/[^0-9]/g, "");
            let memFree = data[1].replace(/[^0-9]/g, "");
            res.json({
                "memTotal": memTotal,
                "memFree": memFree,
                "memUsed": memTotal-memFree
            })
        } else {
            console.log(err);
        }
    });
  })

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})