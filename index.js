const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const User = require('./models/User')
const Exercise = require('./models/Exercise')
const https = require('https');
const fs = require('fs');
require('./mongoose') // activate and connect DB, at Mongo Atlas or whatever
require('dotenv').config()

const options = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
} 

// middlewares and more 
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// endpoints

app.post('/api/users', (req, res) => {
  async function registerNewUser (name) {
    const newUser = new User({
      username: name
    });
    
    const userSaved = await newUser.save();
    //console.log(userSaved);
    return userSaved
  }
  
  const userName = req.body.username;
  registerNewUser(userName)
      .then(registeredUser => {
        const { username, _id } = registeredUser
        res.json({
          "username":username,
          "_id": _id
        })
      });
});

app.get('/api/users', (req, res) => {
  async function requestAllUsers () {
    const allUsers = await User.find({}, 'username _id');
    //console.log(allUsers);
    return allUsers
  }

  requestAllUsers()
    .then(arrayOfUsers => {
      res.json(arrayOfUsers);
    });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  async function addExerciseToAUser (userID, exerciseData) {
    const user = await User.findById(userID);
    const stringDate = exerciseData.date ? new Date(exerciseData.date).toDateString() : new Date().toDateString();
    const exercise = await Exercise.create({
      description: exerciseData.description,
      duration: exerciseData.duration,
      date: stringDate
    });

    user.log.push(exercise);
    user.count = user.log.length;
    await user.save()

    const jsonResponse = {
      _id: user._id,
      username: user.username,
      date: exercise.date,
      duration: exercise.duration,
      description: exercise.description
    };

    return jsonResponse;
  }

  const userID = req.params._id;
  const exerciseData = req.body;
  addExerciseToAUser(userID, exerciseData)
    .then(exercise => {
      res.json(exercise);
    });
});

app.get('/api/users/:_id/logs', (req, res) => {
  async function obtainUsersLog (userID, reqFrom, reqTo, reqLimit) {
    const from = reqFrom;
    const to = reqTo;    
    const limit = reqLimit;
    const user = await User.findById(userID, '_id username count log')
      .populate({ path: 'log', select: 'description date duration', limit: limit });
      
    return user;
  }

  const userID = req.params._id;
  const { from, to, limit } = req.query;
  obtainUsersLog(userID, from, to, limit)
    .then(userAndLogs => {
      if (from && to){
        const unixFrom = new Date(from).getTime()
        const unixTo = new Date(to).getTime()
        const requiredLog = [];
        for (let i=1; i > user.log.length; i++){
          const logDate = user.log[i-1];
          const date = new Date(logDate).getTime()
          if ((date >= unixFrom) && (date <= unixTo)) {
            requiredLog.push(date)
          }
        }
      }

      console.log(req.query)
      res.json(userAndLogs);
    });
});

https.createServer(options, app).listen(process.env.PORT || 3100, console.log('--Server running somewhere-- 👍👍'))
/*
const listener = app.listen(process.env.PORT || 3100, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
*/