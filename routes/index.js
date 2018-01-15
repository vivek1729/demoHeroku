var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/find', function(req, res) {
  var user_collection = req.app.get('user_collection');
  var group_id = req.query.group_id; 
  var users = user_collection.find({'group_id':group_id});
  res.send({'users':users, 'status':'OK', 'count':user_collection.count()});
});

router.post('/create', function(req, res) {
  var user_collection = req.app.get('user_collection');
  var user_obj = req.body;
  user_obj['timestamp'] = Math.floor(Date.now() / 1000);
  user_collection.insert(user_obj);
  res.send({'status':'OK', 'count':user_collection.count()});
});

module.exports = router;
