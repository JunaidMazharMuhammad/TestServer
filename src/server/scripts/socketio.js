var sql = require("mssql");
var isTokenValid = (token) => {
  //authenticat encryption or user record in database
  return true;
};
/** Variables */
var connectedUsers = 0;

module.exports = (server) => {
  var io = require("socket.io")(server);

  // middleware to verify on Connecting and Reconnecting
  io.use((socket, next) => {
    let token = socket.handshake.query.token;
    if (true || isTokenValid(token)) {
      return next();
    }
    return next(new Error("authentication error"));
  });

  io.on("connection", function (socket) {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on("new message", function (data) {
        console.log(connectedUsers, socket.username)
      // we tell the client to execute 'new message'
      socket.broadcast.emit("new message", {
        username: socket.username,
        message: data,
      });

      var con = {
        user: "TradeIT",
        password: "lotus123",
        server: "localhost",
        database: "TradeIt",
      };
      sql.connect(con, function (err) {
        if (err) console.log(err);

       // create Request object
       var request = new sql.Request();

        // query to the database and get the records\
        var message = "'"+data+"'"
        var username= "'"+socket.username.toString()+"'"
        console.log(`INSERT INTO chats (content, recipient, sender, type) VALUES (${message}, 'Highway 37', ${username}, 'CHAT')`)
        request.query(`INSERT INTO chats (content, recipient, sender, type) VALUES (${message}, 'Highway 37', ${username}, 'CHAT')`, function (err, recordset) {
          if (err) console.log(err);

          // send records as a response
          console.log("done");
        });
      });
      // var con = {
      //     user: 'TradeIT',
      //     password: 'lotus123',
      //     server: 'localhost',
      //     database: 'TradeIt'
      //   };

      //   sql.connect(con, function (err) {
      //     if (err) throw err;
      //     console.log("Connected!");
      //     var request = new sql.Request();
      //     // var sql = "INSERT INTO chats (content, recipient, sender, type) VALUES ('Company Inc', 'Highway 37', 'abc', 'asdasd')";
      //     // request.query(sql, function (err, result) {
      //     //   if (err) throw err;
      //     //   console.log("1 record inserted");
      //     // });
      //   });
    });

    // when the client emits 'add user', this listens and executes
    socket.on("add user", function (username) {
      if (addedUser) return;

      // we store the username in the socket session for this client
      socket.username = username;
      ++connectedUsers;
      addedUser = true;
      socket.emit("login", {
        connectedUsers: connectedUsers,
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit("user joined", {
        username: socket.username,
        connectedUsers: connectedUsers,
      });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on("typing", function () {
      socket.broadcast.emit("typing", {
        username: socket.username,
      });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on("stop typing", function () {
      socket.broadcast.emit("stop typing", {
        username: socket.username,
      });
    });

    // when the user disconnects.. perform this
    socket.on("disconnect", function () {
      if (addedUser) {
        --connectedUsers;

        // echo globally that this client has left
        socket.broadcast.emit("user left", {
          username: socket.username,
          connectedUsers: connectedUsers,
        });
      }
    });
  });
};
