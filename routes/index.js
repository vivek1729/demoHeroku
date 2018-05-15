var express = require('express');
var router = express.Router();
var path = require('path');
var UPLOAD_PATH = path.join(__basedir, 'configs');

router.get('/', function(req, res) {
  console.log('App config');
  var app = require('../app');
  console.log(app.experiment_config);
  res.render('file_upload', { title: 'Hey', message: 'Hello there!' })
});

router.post('/upload', function(req, res) {
  console.log('Handler called?');
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
 
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  console.log(sampleFile);
  // Use the mv() method to place the file somewhere on your server
  var file_upload_path = `${UPLOAD_PATH}/experiment_config.json`;
  console.log(file_upload_path);
  sampleFile.mv(file_upload_path, function(err) {
    if (err){
      console.log(err);
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
  });
});

router.get('/restart_experiment', function(req, res) {
  //delete require.cache[require.resolve('./configs/experiment_config.json')];

  //RESET CONFIG
  delete require.cache[require.resolve('../configs/experiment_config.json')];
  //var config = require('config');
  req.app.experiment_config = require('../configs/experiment_config.json');

  //CLEAR DATA
  var user_assoc = req.app.get('user_assoc');
  var user_collection = req.app.get('user_collection');
  user_assoc.clear();
  user_collection.clear();
  //CLEAR SOCKETS
  req.app.socket_hash = {};
  console.log('Current config');
  res.send({'status':'OK', 'cnf':req.app.experiment_config});
});


/* GET home page. */
router.get('/find', function(req, res) {
  var user_collection = req.app.get('user_collection');
  var group_id = req.query.group_id; 
  var users = user_collection.find({'group_id':group_id});
  res.send({'users':users, 'status':'OK', 'count':user_collection.count()});
});

router.get('/status', function(req, res) {
  var user_assoc = req.app.get('user_assoc');
  var user_id = req.query.user_id; 
  var user = user_assoc.findOne({ user_id: user_id});
  console.log('Queried user is ',user);
  res.send({'status':'OK', 'msg':user.group_id});
});

router.post('/match', function(req, res) {
  //Adds user to user_assoc collection with default group_id of -1
  var user_obj = req.body;
  var user_assoc = req.app.get('user_assoc');
  var user = user_assoc.findOne({ user_id: user_obj.user_id});
  if(user){
  	res.send({'status':'OK', 'msg':'exists'});
  }
  else{
  	//Find if another user has unmatched group_id
  	var unmatched_user = user_assoc.findOne({'group_id':-1});
  	//Get highest group id
  	var tmp_group_id = user_assoc.max('group_id');
  	tmp_group_id = (tmp_group_id >= -1) ? tmp_group_id+1 : -1;
  	//Update group_id for previous user and new user to be added
  	user_obj.group_id = -1;
  	if (unmatched_user){
  		unmatched_user.group_id = tmp_group_id;
  		user_assoc.update(unmatched_user);
  		user_obj.group_id = tmp_group_id;
  	}	
  	//Persist changes to database
  	user_assoc.insert(user_obj);
  	
	res.send({'status':'OK', 'msg':'added'});
  }
  
});

router.post('/create', function(req, res) {
  var user_collection = req.app.get('user_collection');
  var user_obj = req.body;
  user_obj['timestamp'] = Math.floor(Date.now() / 1000);
  user_collection.insert(user_obj);
  res.send({'status':'OK', 'count':user_collection.count()});
});



module.exports = router;
