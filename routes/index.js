var express = require('express');
var router = express.Router();
var path = require('path');
var UPLOAD_PATH = path.join(__basedir, 'configs');


router.get('/', function(req, res) {
  var user_assoc = req.app.get('user_assoc');
  var user_data = user_assoc.find();
  var view_info = [];
  var period_entry,group_entry,period_idx,group_idx;
  for (record in user_data){
    period_idx = view_info.map(function(x){return x.period;}).indexOf(record.period);
    if(period_idx === -1){
      //Insert new period
      period_entry = {'period':record.period,'groups':[]};
      group_entry = {'group_id':record.group_id,'pay_off':record.pay_off,'users':[{'user_id':record.user_id,'choice':record.choice}]};
      period_entry.groups.push(group_entry);
      view_info.push(period_entry);
    }
    else{
      group_idx = view_info[period_idx]['groups'].map(function(x) {return x.period; }).indexOf(record.period);
      if(group_idx === -1){
        view_info[period_idx]['groups'][group_idx]['users'].push({'user_id':record.user_id,'choice':record.choice});
      }
      else{
        group_entry = {'group_id':record.group_id,'pay_off':record.pay_off,'users':[{'user_id':record.user_id,'choice':record.choice}]};
        view_info[period_idx].groups.push(group_entry);
      }
    }
  };
  console.log('View info formed..');
  console.log(view_info);
  res.render('index', { title: 'Experiment', message: 'Dashboard' })
});

router.get('/upload', function(req, res) {
  console.log('App config');
  var app = require('../app');
  console.log(app.experiment_config);
  res.render('file_upload', { title: 'Experiment Configuration', message: 'Upload new file' })
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
  var result = 'Experiment config uploaded successfully';
  console.log(file_upload_path);
  sampleFile.mv(file_upload_path, function(err) {
    if (err){
      console.log(err);
      result = err.toString();
    }  
  });
  req.flash('info', result);
  res.redirect('/');
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
  req.flash('info', 'Experiments have been restarted..');
  //res.send({'status':'OK', 'cnf':req.app.experiment_config});
  console.log('Should redirect now..');
  res.redirect('/');
});



module.exports = router;
