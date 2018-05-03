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
      /*
        This is where the matching happens
        We find another unmatched user
        Create pay-offs for a 2x2 grid and send the same values to both people.
      */
      var pay_off = [];
      for(var i=0;i<4;i++){
        var v1 = Math.floor(Math.random() * 10);
        var v2 = Math.floor(Math.random() * 10);
        pay_off.push([v1,v2]);
      }
      //Save the pay_off to database
      user_assoc.findAndUpdate({'group_id':tmp_group_id}, 
        function(obj){
          obj.payoff = pay_off;
          return obj;
      });

      //Send payoff and result to the matched users
      socket.join(tmp_group_id,function(){
        console.log('Group joined successfully');
        socket.emit('join_success',
          {'users':[], 'group_id':tmp_group_id, 'role':1, 'pay_off':pay_off,  'status':'OK', 'count':user_collection.count()});
        console.log('Sent the join_success event');
      });
      app.socket_hash[unmatched_user.user_id].join(tmp_group_id,function(){
        console.log('Group joined successfully');
        app.socket_hash[unmatched_user.user_id].emit('join_success',
          {'users':[], 'group_id':tmp_group_id, 'role':2, 'pay_off':pay_off, 'status':'OK', 'count':user_collection.count()});
        console.log('Sent the join_success event');
      });

    } 
  });

  socket.on('make_choice', function (data) {

    var app = require('../app');
    var user_collection = app.get('user_collection');
    var user_assoc = app.get('user_assoc');
    var result_hash = {
      '02':0,
      '20':0,
      '22':2,
      '03':1,
      '30':1,
      '23':3,
      '32':3
    };

    var group_users = user_assoc.find({'group_id':data.group_id});
    var other_user = group_users.filter(
      function( item ){
        return item.user_id != data.user_id;
      });
    //Update this users choice into the database
    user_assoc.findAndUpdate({'user_id':data.user_id,'group_id':data.group_id}, 
        function(obj){
          obj.choice = data.message;
          return obj;
    });
    other_user = other_user[0];
    if(other_user.choice != undefined){
      var result = {'res':null};
      //We have a match
      console.log("Both the users have made their choice");
      console.log(data.message+' and '+other_user.choice);
      var comb_ans = data.message+''+other_user.choice;
      console.log('Based on choices, the result is '+result_hash[comb_ans]);
      console.log('I can now emit this event');
      result.res = result_hash[comb_ans];
      socket.to(data.group_id).emit('choice_result',result);
      socket.emit('choice_result',result);
      //Now unset the data from database
      user_assoc.findAndUpdate({'group_id':data.group_id}, 
        function(obj){
          obj.choice = undefined;
          return obj;
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