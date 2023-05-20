const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const User = require('./models/User')
const Exercise = require('./models/Exercise')
const https = require('https');
const path = require('path')
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
  async function obtainUsersLog (userID) {
    const user = await User.findById(userID, '_id username count log')
      .populate({ path: 'log', select: 'description date duration' });
    
    return user;
  }
  
  const userID = req.params._id;
  const { from, to, limit } = req.query;
  obtainUsersLog(userID)
  .then(user => {
    const reqFrom = new Date(from).getTime() || null;
    const reqTo = new Date(to).getTime() || null;    
    const reqLimit = Number(limit) || 0;
    console.log(req.query)

    if (from && to) {
        let logRequired = user.log.reduce((newArry, currentLog) => {
          const logDate = new Date(currentLog.date).getTime()
          if (logDate >= reqFrom && logDate <= reqTo) {
            const logFixed = { // for a strange reason, log._id appears in resulted array
              description: currentLog.description,
              date: new Date(currentLog.date).toDateString(),
              duration: currentLog.duration
            }
            newArry.push(logFixed); 
          }
          return newArry;
        }, []);

        if (reqLimit) logRequired = logRequired.slice(0, reqLimit);

        const jsonUser = {
          _id: user._id,
          username: user.username,
          count: user.count,
          log: logRequired
        };
  
        return res.json(jsonUser);
      }

    if (reqLimit) { 
      let logRequired = user.log.slice(0, reqLimit)
      logRequired = logRequired.map(currentLog => {
        currentLog.date = new Date(currentLog.date).toDateString()
      })
      const jsonUser = {
        _id: user._id,
        username: user.username,
        count: user.count,
        log: logRequired
      };

      return res.json(jsonUser)
    }

      res.json(user);
    });
});

https.createServer(options, app).listen(process.env.PORT || 3100, console.log('--Server running somewhere-- 👍👍'))
/*
const listener = app.listen(process.env.PORT || 3100, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
*/