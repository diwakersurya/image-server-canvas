const express = require("express");
const app = express();
const { createCanvas, loadImage } = require("canvas");
const fabric=require("fabric").fabric;
var dataUriToBuffer = require('data-uri-to-buffer');
const messages = require("./messages");
const axios =require("axios")
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit();
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
function getGradientStops(stops) {
  // {
  //   0: "red",
  //   0.2: "orange",
  //   0.4: "yellow",
  //   0.6: "green",
  //   0.8: "blue",
  //   1: "purple"
  // }
  const gStop={};
  const stopInc=(1/stops).toFixed(1);
  let initStop=0;
  while(initStop<1){
    gStop[initStop]=getRandomColor();
    initStop+=stopInc;
  }
  if(initStop!==1){
    gStop[1]=getRandomColor();
  }
  return gStop;
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
  context.fillText(user, 600, 540);

  context.beginPath();

  /* loading image from github url*/
  const myimg = await loadImage(avatarUrl);
  context.arc(600, 500, 50, 0, 2 * Math.PI);
  context.clip();
  context.drawImage(myimg, 530, 450, myimg.width * 0.3, myimg.height * 0.3);

  /*sending as response to client*/
  const buffer = canvas.toBuffer("image/png");
  response.contentType("image/jpeg");
  response.send(buffer);
});
app.get("/github", nocache, async (request, response) => {
  const {
    user="user"/*username*/,
    avatarUrl=`https://github.com/${user}.png`/*avatar url*/,
    bg=getRandomColor()/* canvas background*/,
    w=1200/*image width*/,
    h=630/*image height*/
  }=request.query;
//   const userInfo=await octokit.request('GET /users/{username}', {
//   username: user
// })
  const userInfo={
    login: 'diwakersurya',
    id: 7386665,
    node_id: 'MDQ6VXNlcjczODY2NjU=',
    avatar_url: 'https://avatars3.githubusercontent.com/u/7386665?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/diwakersurya',
    html_url: 'https://github.com/diwakersurya',
    followers_url: 'https://api.github.com/users/diwakersurya/followers',
    following_url: 'https://api.github.com/users/diwakersurya/following{/other_user}',
    gists_url: 'https://api.github.com/users/diwakersurya/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/diwakersurya/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/diwakersurya/subscriptions',
    organizations_url: 'https://api.github.com/users/diwakersurya/orgs',
    repos_url: 'https://api.github.com/users/diwakersurya/repos',
    events_url: 'https://api.github.com/users/diwakersurya/events{/privacy}',
    received_events_url: 'https://api.github.com/users/diwakersurya/received_events',
    type: 'User',
    site_admin: false,
    name: 'Diwaker Singh',
    company: '@inmobi',
    blog: '',
    location: 'Bangalore',
    email: null,
    hireable: true,
    bio: 'Fullstack Developer with experience on ' +
      'node, express , react and javascript.',
    twitter_username: 'diwakersurya',
    public_repos: 51,
    public_gists: 12,
    followers: 8,
    following: 11,
    created_at: '2014-04-23T16:40:38Z',
    updated_at: '2020-07-28T12:47:10Z'
  }
 // const c = createCanvas(w, h);
  //const context = c.getContext("2d");
 //   context.fillStyle = bg;
  
  var canvas = new fabric.Canvas();
  canvas.setDimensions({width:w, height:h});
 // canvas.backgroundColor=getRandomColor();
  const rect=new fabric.Rect({
    width:w,
    height:h-100,
    top:100,
     rx: 20, 
  ry: 20,
    //strokeWidth: 1, stroke: 'rgb(255,255,255)',
     //strokeLineJoin: 'round',
  })
  rect.setGradient('fill', {
  x1: 0,
  y1: 0,
  x2: rect.width,
  y2: 0,
  colorStops: getGradientStops(1)
});
  canvas.add(rect);
  

  /*ribbon*/
  const ribbon=new fabric.Rect({
    width:400,
    height:50,
    fill:"yellow",
    angle:-45,
    left:-50,
    top:300
  })
  ribbon.setGradient('fill', {
  x1: 0,
  y1: 0,
  x2: ribbon.width,
  y2: 0,
    
  colorStops: getGradientStops(1)
});
 // canvas.add(ribbon);
    /* getting randome message if random language*/
  const randomIndex = getRandomInt(0, 50);
  const language = Object.keys(messages)[randomIndex];
  
   const salutationText = messages[language];
 // const textWidth = context.measureText(text).width;
  /*drawing text on canvas*/
  //context.fillStyle = "#fff";
 // context.fillText(text, 600, 170);
  //context.font = "bold 15pt Menlo";
 // context.fillText(`(${language})`, 600, 280);

  //context.fillStyle = "#fff";
  //context.font = "bold 30pt Menlo";
  //context.fillText(user, 600, 540);
  
var text = new fabric.Text(`${salutationText}`, {
            width:250,
            fill: 'rgb(255,255,255)',
  stroke:"#ffffff",
      fontSize: 50,
        });
  
  canvas.add(text)
  text.set({top:h/2-text.height/2,
            left:w/2-text.width/2})
  
  
  var languageText = new fabric.Text(`--(${language})--`, {
            width:250,
            fill: 'rgb(255,255,255)',
            stroke:"#ffffff",
            fontSize: 20,
            shadow: 'rgba(0,0,0,0.3) 5px 5px 5px'
        });
  
  canvas.add(languageText)
  languageText.set({top:h/2-languageText.height/2+70,
            left:w/2-languageText.width/2})

  
  /*user text*/
  var userText = new fabric.Text(`${userInfo.login}`, {
  //           width:250,
            fill: '#03A87C',
  // stroke:"#ffffff",
     //shadow: 'rgba(0,0,0,0.6) 5px 5px 5px',
       fontSize: 30,
      fontStyle: 'italic',
    // stroke: 'rgba(255, 255, 255, 0.5)',
  strokeWidth: 1
        });
  
  canvas.add(userText)
  userText.set({top:50,
            left:w-userText.width-80})
  
  
   var line = new fabric.Line( [ 50, 70-(userText.height/2), w-(80+userText.width10), 70-(userText.height/2)], {
  strokeWidth: 1,
  stroke: '#03A87C'
} );
  
  canvas.add(line)
  
  
var dataURL = canvas.toDataURL({
  format: 'png',
  quality: 1,
  enableRetinaScaling:true
});

  /*sending as response to client*/
  const buffer = dataUriToBuffer(dataURL);
  response.contentType("image/jpeg");
  response.send(buffer);
});

app.get("/pipe", async (request, response) => {
  const url="https://unsplash.com/photos/syT5FIH4Njc/download?force=true&w=640";
  const res = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  })
  res.data.pipe(response);
});
// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
