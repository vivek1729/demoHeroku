var express = require('express');
var router = express.Router();
var path = require('path');
var UPLOAD_PATH = path.join(__basedir, 'configs');

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
