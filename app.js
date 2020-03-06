var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var gamesRouter = require('./routes/games');
var developersRouter = require('./routes/developers');
var publishersRouter = require('./routes/publishers');
var gameRouter = require('./routes/game');
var developerRouter = require('./routes/developer');
var publisherRouter = require('./routes/publisher');
var aboutRouter = require('./routes/about');
var broadcastsRouter = require('./routes/broadcasts');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/games', gamesRouter);
app.use('/developers', developersRouter);
app.use('/publishers', publishersRouter);
app.use('/game', gameRouter);
app.use('/about', aboutRouter);
app.use('/developer', developerRouter);
app.use('/publisher', publisherRouter);
app.use('/broadcasts', broadcastsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
