module.exports = function (socket) {
  //socket functions go here...
  socket.emit('welcome', { hello: 'world' });

  socket.on('join_group', function (data) {
    console.log(data);
    socket.join(data.group_id,function(){
      console.log('Group joined successfully');
      var app = require('../app');
      var user_collection = app.get('user_collection');
      var users = user_collection.find({'group_id':data.group_id});
      socket.emit('join_success',{'users':users, 'status':'OK', 'count':user_collection.count()});
      console.log('Sent the join_success event');
    });
    
  });

  socket.on('match', function (data) {
    //Find if another user has unmatched group_id
    var user_obj = {user_id:data.user_id};
    //user_obj.socket = socket;
    var app = require('../app');
    app.socket_hash[data.user_id] = socket;
    var user_collection = app.get('user_collection');
    var user_assoc = app.get('user_assoc');
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
    if(unmatched_user){
      socket.join(tmp_group_id,function(){
        console.log('Group joined successfully');
        socket.emit('join_success',
          {'users':[], 'group_id':tmp_group_id, 'role':1, 'status':'OK', 'count':user_collection.count()});
        console.log('Sent the join_success event');
      });
     app.socket_hash[unmatched_user.user_id].join(tmp_group_id,function(){
        console.log('Group joined successfully');
        app.socket_hash[unmatched_user.user_id].emit('join_success',
          {'users':[], 'group_id':tmp_group_id, 'role':2, 'status':'OK', 'count':user_collection.count()});
        console.log('Sent the join_success event');
      });

    } 
  });

  socket.on('group_message',function(data){
    console.log('receieved group_message event');
    console.log('Data received is',data);
    var app = require('../app');
    var user_collection = app.get('user_collection');
  	var user_obj = data;
  	user_obj['timestamp'] = Math.floor(Date.now() / 1000);
  	user_collection.insert(user_obj);
  	//console.log(user_collection);
    socket.to(data.group_id).emit('message_broadcast',user_obj);
    socket.emit('message_broadcast',user_obj);
  });
};