var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var http = require("http");
var moment = require("moment");

var api = require('./api');

var app = express();

app.use(bodyParser.json());
app.use(compression());

// Create link to Angular build directory
var distDir = __dirname + "/../dist/";
app.use(express.static(distDir));

app.use('/api', api);

app.get('*',function(req, res) {
  res.sendFile('index.html', {root: __dirname+'/../dist/'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Initialize the app.
var server = app.listen(process.env.PORT || 4200, function () {
var port = server.address().port;
console.log("App now running on port", port);
});

if(process.env.NODE_ENV === 'production'){
  setInterval(function () {
    http.get("http://uoftstudyspot.com/api/ping");
  }, 300000); //every 5 mins, to prevent heroku host from putting app to sleep

  setInterval(function () {
    http.get("http://uoftstudyspot.com/api/optimize?code=DH&time=" + moment().format("YYYY-MM-DD::HH") + "&campus=UTM");
  }, 3600000); //every 60 mins, to rehydrate UTM cache since it takes very long to load on cache-miss
}

module.exports = app;
