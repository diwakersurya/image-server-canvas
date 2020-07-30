const express = require("express");
const app = express();
const { createCanvas, loadImage } = require("canvas");
const messages = require("./messages");
//https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
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
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
}

app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/image", nocache, async (request, response) => {
  const {
    user="user"/*username*/,
    avatarUrl=`https://github.com/${user}.png`/*avatar url*/,
    bg=getRandomColor()/* canvas background*/,
    w=1200/*image width*/,
    h=630/*image height*/
  }=request.query;
  const canvas = createCanvas(w, h);
  const context = canvas.getContext("2d");

  context.fillStyle = bg;
  context.fillRect(0, 0, w, h);

  /* setting the font and text alignment*/
  context.font = "bold 70pt Menlo";
  context.textAlign = "center";
  context.textBaseline = "top";
  /* getting randome message if random language*/
  const randomIndex = getRandomInt(0, 50);
  const language = Object.keys(messages)[randomIndex];
  const text = messages[language];
  const textWidth = context.measureText(text).width;
  /*drawing text on canvas*/
  context.fillStyle = "#fff";
  context.fillText(text, 600, 170);
  context.font = "bold 15pt Menlo";
  context.fillText(`(${language})`, 600, 280);

  context.fillStyle = "#fff";
  context.font = "bold 30pt Menlo";
  context.fillText("diwakersurya", 600, 540);

  context.beginPath();

  /* loading image from github url*/
  const myimg = await loadImage(
    "https://avatars3.githubusercontent.com/u/7386665?s=400&u=aaff658cd860d5f886775a293c58e73fa57e7bf9&v=4"
  );
  context.arc(600, 500, 50, 0, 2 * Math.PI);
  context.clip();
  context.drawImage(myimg, 530, 450, myimg.width * 0.3, myimg.height * 0.3);

  /*sending as response to client*/
  const buffer = canvas.toBuffer("image/png");
  response.contentType("image/jpeg");
  response.send(buffer);
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
