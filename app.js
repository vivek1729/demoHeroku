var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var loki = require('lokijs');
var routes = require('./routes/index');
var socketHandler = require('./routes/socket_handler');
var socket_io    = require( "socket.io" );

var app = express();
// Socket.io
var io           = socket_io();
app.io           = io;

var users = null;
var db = new loki('survey_data.json', {
  autoload: true,
  autoloadCallback : function(){
    users = db.getCollection('users');
    if (users === null) {
      users = db.addCollection('users');
    }
    user_assoc = db.addCollection('user_assoc');
    app.set('user_collection',users);
    app.set('user_assoc',user_assoc);
    console.log('Autosave successful');
  },
  autosave: true, 
  autosaveInterval: 40000 // save every four seconds for our example
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//DB set up
app.set('user_db',db);


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Set Access control headers to white list servers or something
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

io.on('connection', function (socket) {
  socketHandler(socket);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
