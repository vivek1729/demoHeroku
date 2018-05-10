function generatePayOff(){
  var pay_off = [];
  for(var i=0;i<4;i++){
    var v1 = Math.floor(Math.random() * 10);
    var v2 = Math.floor(Math.random() * 10);
    pay_off.push([v1,v2]);
  }
  return pay_off;
}

function createStateForUser(socket,user_obj){
    var app = require('../app');
    var user_assoc = app.get('user_assoc');
    var unmatched_user = user_assoc.findOne({'group_id':-1});
    
    //Get highest group id
    var tmp_group_id = user_assoc.max('group_id');
    tmp_group_id = (tmp_group_id >= -1) ? tmp_group_id+1 : -1;
    //Update group_id for previous user and new user to be added
    user_obj.group_id = -1;
    if (unmatched_user){
      unmatched_user.group_id = tmp_group_id;
      unmatched_user.role_id = 2;
      user_assoc.update(unmatched_user);
      user_obj.group_id = tmp_group_id;
    } 
    //Persist changes to database
    user_assoc.insert(user_obj);

    //We found a match, here
    if(unmatched_user){
      /*
        This is where the matching happens
        We find another unmatched user
        Create pay-offs for a 2x2 grid and send the same values to both people.
      */
      var pay_off = generatePayOff();
      //Save the pay_off to database
      user_assoc.findAndUpdate({'group_id':tmp_group_id}, 
        function(obj){
          obj.payoff = pay_off;
          return obj;
      });

      //Send current state of matched users to them.
      socket.join(tmp_group_id,function(){
        console.log('Group joined successfully');
        socket.emit('join_success',
          {'status':'OK', 'state':user_obj});
        console.log('Sent the join_success event');
      });
      app.socket_hash[unmatched_user.user_id].join(tmp_group_id,function(){
        console.log('Group joined successfully');
        app.socket_hash[unmatched_user.user_id].emit('join_success',
          {'status':'OK', 'state':unmatched_user});
        console.log('Sent the join_success event');
      });

    }

}

function restoreStateForUser(socket,user_obj){
    //Send payoff and result to the matched users
    var user_group = user_obj.group_id;
    if(user_group >= 0){
      //That means the user was matched with someone else, join this socket to that group and send state
      socket.join(user_group,function(){
        console.log('Group rejoined');
        socket.emit('join_success',
          {'status':'OK', 'state':user_obj});
        console.log('Sent the join_success event');
      });
    }
    
};


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

    var user_obj = {user_id:data.user_id,role_id:1};
    var app = require('../app');
    app.socket_hash[data.user_id] = socket;
    var user_assoc = app.get('user_assoc');
    console.log('User association collection');
    console.log(user_assoc);
    var existing_user = user_assoc.findOne({'user_id':user_obj.user_id});
    console.log(existing_user);
    if(existing_user){
      //This user_id already exists in the Database, restore state
      restoreStateForUser(socket,existing_user);
    }
    else{
      //Create new state for user
      createStateForUser(socket,user_obj);
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
      //Save the result to the database too.
      user_assoc.findAndUpdate({'group_id':data.group_id}, 
        function(obj){
          obj.result = result.res;
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