const express = require("express");
const app = express();
const upload = require('express-fileupload');
const fs = require('fs');

// info that needs to be filled out
const key = 'put something here';
const url = 'link to server without /';

let filelist = [];

async function refreshFiles() {
  filelist = [];
  fs.readdir('./files/', async (err, files) => {
    if(err){
      return console.log('An error occured when checking the commands folder for commands to load: ' + err);
    }
    files.forEach(async (file) => {
      filelist.push({
        filelocation: `./${file}`,
        name: file.split('.')[0],
        fname: file
      });
    });
  });
}
refreshFiles();

app.use(express.static('public'));
app.use(upload({
  limits: { fileSize: 50 * 1024 * 1024 }
}));

async function createid(size) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  let findfile = filelist.findIndex((file) => file.name === result);
  if(findfile != -1) return await createid(size);
  return result;
}

app.use(express.json());

app.post('/', async (req, res) => {
  if(req.body.key !== key) return res.send('NO_PERMISION');
  if(!req.files.file) return res.send('NO_FILE');
  let id = await createid(7);
  let extension = req.files.file.name.split('.')[1];
  req.files.file.mv(`./files/${id}.${extension}`);
  res.send(`${url}/${id}`);
  refreshFiles();
});

app.get('/:filename', async (req, res) => {
  let filename = req.params.filename;
  if(!filename) return res.send('FILE_NOT_FOUND');
  let findfile = filelist.findIndex((file) => file.name === filename);
  if(findfile == -1) findfile = filelist.findIndex((file) => file.fname === filename);
  if(findfile == -1) return res.send('FILE_NOT_FOUND');
  res.sendFile(__dirname + '/files/' + filelist[findfile].filelocation);
});

app.post('/delete/:filename', async (req, res) => {
  if(req.body.key !== key) return res.send('NO_PERMISION');
  let filename = req.params.filename;
  if(!filename) return res.send('FILE_NOT_FOUND');
  let findfile = filelist.findIndex((file) => file.name === filename);
  if(findfile == -1) findfile = filelist.findIndex((file) => file.fname === filename);
  if(findfile == -1) return res.send('FILE_NOT_FOUND');
  fs.unlink(__dirname + '/files/' + filelist[findfile].filelocation);
  res.send('Done');
});

const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
