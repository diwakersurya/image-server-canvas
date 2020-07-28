const express = require("express");
const app = express();
const { createCanvas, loadImage } = require('canvas');
const messages = require("./messages");
//https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/image", nocache,async(request, response) => {
  /* width and height of canvas*/
const width = 1200 
const height = 630

const canvas = createCanvas(width, height)
const context = canvas.getContext('2d') 
/* random background color*/
const bgColor=getRandomColor();

context.fillStyle = bgColor;  
context.fillRect(0, 0, width, height)

/* setting the font and text alignment*/
context.font = 'bold 70pt Menlo'
context.textAlign = 'center'
context.textBaseline = 'top'
  
const randomIndex=getRandomInt(0,50);
const language=Object.keys(messages)[randomIndex];
const text = messages[language]

const textWidth = context.measureText(text).width
//context.fillRect(600 - textWidth / 2 - 10, 170 - 5, textWidth + 20, 120)
context.fillStyle = '#fff'
context.fillText(text, 600, 170)
context.font = 'bold 15pt Menlo'
context.fillText(`(${language})`, 600, 280)

context.fillStyle = '#fff'
context.font = 'bold 30pt Menlo'
context.fillText('diwakersurya', 600, 540)
  
context.beginPath();


const myimg = await loadImage('https://avatars3.githubusercontent.com/u/7386665?s=400&u=aaff658cd860d5f886775a293c58e73fa57e7bf9&v=4')
context.arc(600,500,50,0,2*Math.PI);
context.clip();
context.drawImage(myimg, 530, 450,myimg.width * 0.3, myimg.height * 0.3)
  
  
  
const buffer = canvas.toBuffer('image/png')
response.contentType('image/jpeg');
response.send(buffer);
});


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
