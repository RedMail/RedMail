var net = require('net'), // Enables to start the server
    crypto = require('crypto'), // MD5
    fs = require("fs"), // Enables to load the certificate keys
    sasl_methods = require("./sasl").AUTHMethods; // Extensions to the SASL-AUTH

/**
 * N3
 *
 * POP3 Server for Node.JS
 *
 * Usage:
 *     N3.startServer(port, server_name, AuthStore, MessageStore);
 *     - port (Number): Port nr to listen, 110 for unencrypted POP3
 *     - server_name (String): server domain name, ie. "node.ee"
 *     - AuthStore (Function): Function to authenticate users, see pop3_server.js for example
 *     - MessageStore (Constructor): See messagestore.js or pop3_server.js for example
 *
 **/
var N3 = {

    /**
     * N3.server_name -> String
     *
     * Domain name of the server. Not really important, mainly used for generating
     * unique tokens (ie: <unique_str@server_name>) and for logging
     **/
    server_name: "localhost",

    /**
     * N3.States -> Object
     *
     * Constants for different states of the current connection. Every state has
     * different possibilities, ie. APOP is allowed only in AUTHENTICATION state
     **/
    States:{
        AUTHENTICATION: 1,
        TRANSACTION:2,
        UPDATE: 3
    },

    /**
     * N3.COUNTER -> Number
     *
     * Connection counter, every time a new connection to the server is made, this
     * number is incremented by 1. Useful for generating connection based unique tokens
     **/
    COUNTER: 0,

    /**
     * N3.authMethods -> Object
     *
     * Houses different authentication methods for SASL-AUTH as extensions. See
     * N3.extendAuth for additional information
     **/
    authMethods: {},

    /**
     * N3.capabilities -> Object
     *
     * Prototype object for individual servers. Contains the items that will
     * be listed as an answer to the CAPA command. Individual server will add
     * specific commands to the list by itself.
     **/
    capabilities: {
        // AUTHENTICATION
        1: ["UIDL", "USER", "RESP-CODES", "AUTH-RESP-CODE"],
        // TRANSACTION
        2: ["UIDL", "EXPIRE NEVER", "LOGIN-DELAY 0", "IMPLEMENTATION N3 node.js POP3 server"],
        // UPDATE
        3: []
    },

    /**
     * N3.connected_users -> Object
     *
     * Keeps a list of all users that currently have a connection. Users are added
     * as keys with a value of TRUE to the list and deleted when disconnecting
     *
     * Login:
     *     N3.connected_users[username] = true;
     * Logout:
     *     delete N3.connected_users[username]
     * Check state:
     *     if(N3.connected_users[username]);
     **/
    connected_users:{},

    /**
     * N3.startServer(port, server_name, AuthStore, MessageStore) -> Boolean
     * - port (Number): Port nr to listen, 110 for unencrypted POP3
     * - server_name (String): server domain name, ie. "node.ee"
     * - AuthStore (Function): Function to authenticate users, see pop3_server.js for example
     * - MessageStore (Constructor): See messagestore.js or pop3_server.js for example
     *
     * Creates a N3 server running on specified port.
     **/
    startServer: function(port, server_name, auth, MsgStore, callback){

        // try to start the server
        net.createServer(this.createInstance.bind(
                this, server_name, auth, MsgStore)
            ).listen(port, function(err){
                if(err){
                    //console.log("Failed starting server");
                    return callback(err);
                }else{
                    //console.log("POP3 Server running on port "+port)
                    return callback && callback(null);
                }
            });

    },

    /**
     * N3.createInstance(server_name, auth, MsgStore, socket) -> Object
     *
     * Creates a dedicated server instance for every separate connection. Run by
     * net.createServer after a user tries to connect to the selected port.
     **/
    createInstance: function(server_name, auth, MsgStore, socket){
        new this.POP3Server(socket, server_name, auth, MsgStore);
    },

    /**
     * N3.extendAUTH(name, action) -> undefined
     * - name (String): name for the authentication method, will be listed with SASL
     * - action (Function): Validates the authentication of an user
     *
     * Enables extending the SALS AUTH by adding new authentication method.
     * action gets a parameter authObject and is expected to return TRUE or FALSE
     * to show if the validation succeeded or not.
     *
     * authObject has the following structure:
     *   - wait (Boolean): initially false. If set to TRUE, then the next response from
     *                     the client will be forwarded directly back to the function
     *   - user (String): initially false. Set this value with the user name of the logging user
     *   - params (String): Authentication parameters from the client
     *   - history (Array): an array of previous params if .wait was set to TRUE
     *   - n3 (Object): current session object
     *   - check (Function): function to validate the user, has two params:
     *     - user (String): username of the logging user
     *     - pass (Function | String): password or function(pass){return pass==pass}
     *
     * See sasl.js for some examples
     **/
    extendAUTH: function(name, action){
        name = name.trim().toUpperCase();
        this.authMethods[name] = action;
    }
}

/**
 * new n3.POP3Server(socket, server_name, auth, MsgStore)
 *
 * Creates a dedicated server instance for every separate connection. Run by
 * N3.createInstance after a user tries to connect to the selected port.
 **/
N3.POP3Server = function(socket, server_name, auth, MsgStore){
    this.server_name = server_name || N3.server_name;
    this.socket   = socket;
    this.state    = N3.States.AUTHENTICATION;
    this.connection_id = ++N3.COUNTER;
    this.UID      = this.connection_id + "." + (+new Date());
    this.authCallback = auth;
    this.MsgStore = MsgStore;
    this.connection_secured = false;

    // Copy N3 capabilities info into the current object
    this.capabilities = {
        1: Object.create(N3.capabilities[1]),
        2: Object.create(N3.capabilities[2]),
        3: Object.create(N3.capabilities[3])
    }

    //console.log("New connection from "+socket.remoteAddress);
    this.response("+OK POP3 Server ready <"+this.UID+"@"+this.server_name+">");

    socket.on("data", this.onData.bind(this));
    socket.on("end", this.onEnd.bind(this));
}

/**
 * N3.POP3Server#destroy() -> undefined
 *
 * Clears the used variables just in case (garbage collector should
 * do this by itself)
 **/
N3.POP3Server.prototype.destroy = function(){
    if(this.timer)clearTimeout(this.timer);
    this.timer = null;
    this.socket = null;
    this.state = null;
    this.authCallback = null;
    this.user = null;
    this.MsgStore = null;
}

/**
 *
 **/
// kill client after 10 min on inactivity
N3.POP3Server.prototype.updateTimeout = function(){
    if(this.timer)clearTimeout(this.timer);
    this.timer = setTimeout((function(){
        if(!this.socket)
            return;
        if(this.sate==N3.States.TRANSACTION)
            this.state = N3.States.UPDATE;
        //console.log("Connection closed for client inactivity\n\n");
        if(this.user && N3.connected_users[this.user.trim().toLowerCase()])
            delete N3.connected_users[this.user.trim().toLowerCase()];
        this.socket.end();
        this.destroy();
    }).bind(this),10*60*1000);
}

N3.POP3Server.prototype.response = function(message){
    var response;
    if(typeof message == "string"){
        response = new Buffer(message + "\r\n", "utf-8");
    }else{
        response = Buffer.concat([message, new Buffer("\r\n", "utf-8")]);
    }

    //console.log("SERVER: "+message);
    this.socket.write(response);
}

N3.POP3Server.prototype.afterLogin = function(){
    var messages = false;

    if(this.user && N3.connected_users[this.user.trim().toLowerCase()]){
        this.user = false; // to prevent clearing it with exit
        return "-ERR [IN-USE] You already have a POP session running";
    }

    if(typeof this.MsgStore!="function")
        return false;

    if(this.user && (messages = new this.MsgStore(this.user))){
        this.messages = messages;
        N3.connected_users[this.user.trim().toLowerCase()] = true;
        return true;
    }
    return false;
}

N3.POP3Server.prototype.onData = function(data){
    var request = data.toString("ascii", 0, data.length);
    //console.log("CLIENT: "+request.trim());
    this.onCommand(request);
}

N3.POP3Server.prototype.onEnd = function(data){
    if(this.state===null)
        return;
    this.state = N3.States.UPDATE;
    if(this.user){
        //console.log("Closing: "+this.user)
    }
    if(this.user && N3.connected_users[this.user.trim().toLowerCase()])
        delete N3.connected_users[this.user.trim().toLowerCase()];
    //console.log("Connection closed\n\n");
    this.socket.end();
    this.destroy();
}

N3.POP3Server.prototype.onCommand = function(request){
    var cmd = request.match(/^[A-Za-z]+/),
        params = cmd && request.substr(cmd[0].length+1);

    this.updateTimeout();

    if(this.authState){
        params = request.trim();
        return this.cmdAUTHNext(params);
    }

    if(!cmd)
        return this.response("-ERR");
    if(typeof this["cmd"+cmd[0].toUpperCase()]=="function"){
        return this["cmd"+cmd[0].toUpperCase()](params && params.trim());
    }

    return this.response("-ERR");
}

// Universal commands

// CAPA - Reveals server capabilities to the client
N3.POP3Server.prototype.cmdCAPA = function(params){

    if(params && params.length){
        return this.response("-ERR Try: CAPA");
    }

    params = (params || "").split(" ");
    this.response("+OK Capability list follows");
    for(var i=0;i<this.capabilities[this.state].length; i++){
        this.response(this.capabilities[this.state][i]);
    }
    if(N3.authMethods){
        var methods = [];
        for(var i in N3.authMethods){
            if(N3.authMethods.hasOwnProperty(i))
                methods.push(i);
        }
        if(methods.length && this.state==N3.States.AUTHENTICATION)
            this.response("SASL "+methods.join(" "));
    }
    this.response(".");
}

// QUIT - Closes the connection
N3.POP3Server.prototype.cmdQUIT = function(){
    if(this.state==N3.States.TRANSACTION){
        this.state = N3.States.UPDATE;
        this.messages.removeDeleted();
    }
    this.response("+OK N3 POP3 Server signing off");
    this.socket.end();
}

// AUTHENTICATION commands

// AUTH auth_engine - initiates an authentication request
N3.POP3Server.prototype.cmdAUTH = function(auth){
    if(this.state!=N3.States.AUTHENTICATION) return this.response("-ERR Only allowed in authentication mode");

    if(!auth)
        return this.response("-ERR Invalid authentication method");

    var parts = auth.split(" "),
        method = parts.shift().toUpperCase().trim(),
        params = parts.join(" "),
        response;

    this.authObj = {wait: false, params: params, history:[], check: this.cmdAUTHCheck.bind(this), n3: this};

    // check if the asked auth methid exists and if so, then run it for the first time
    if(typeof N3.authMethods[method]=="function"){
        response = N3.authMethods[method](this.authObj);
        if(response){
            if(this.authObj.wait){
                this.authState = method;
                this.authObj.history.push(params);
            }else if(response===true){
                response = this.cmdDoAUTH();
            }
            this.response(response);
        }else{
            this.authObj = false;
            this.response("-ERR [AUTH] Invalid authentication");
        }
    }else{
        this.authObj = false;
        this.response("-ERR Unrecognized authentication type");
    }
}

N3.POP3Server.prototype.cmdDoAUTH = function(){
    var response;
    this.user = this.authObj.user;
    if((response = this.afterLogin())===true){
        this.state = N3.States.TRANSACTION;
        response = "+OK You are now logged in";
    }else{
        response = response || "-ERR [SYS] Error with initializing";
    }
    this.authState = false;
    this.authObj = false;
    return response;
}

N3.POP3Server.prototype.cmdAUTHNext = function(params){
    if(this.state!=N3.States.AUTHENTICATION) return this.response("-ERR Only allowed in authentication mode");
    this.authObj.wait = false;
    this.authObj.params = params;
    this.authObj.n3 = this;
    var response = N3.authMethods[this.authState](this.authObj);
    if(!response){
        this.authState = false;
        this.authObj = false;
        return this.response("-ERR [AUTH] Invalid authentication");
    }
    if(this.authObj.wait){
        this.authObj.history.push(params);
    }else if(response===true){
        response = this.cmdDoAUTH();
    }
    this.response(response);
}

N3.POP3Server.prototype.cmdAUTHCheck = function(user, passFn){
    if(user) this.authObj.user = user;
    if(typeof this.authCallback=="function"){
        if(typeof passFn=="function")
            return !!this.authCallback(user, passFn);
        else if(typeof passFn=="string" || typeof passFn=="number")
            return !!this.authCallback(user, function(pass){return pass==passFn});
        else return false;
    }
    return true;
}


// Add extensions from auth_pop3.js

for(var i=0, len=sasl_methods.length; i < len; i++){
    N3.extendAUTH(sasl_methods[i].name, sasl_methods[i].fn);
}

// APOP username hash - Performs an APOP authentication
// http://www.faqs.org/rfcs/rfc1939.html #7

// USAGE:
//   CLIENT: APOP user MD5(salt+pass)
//   SERVER: +OK You are now logged in

N3.POP3Server.prototype.cmdAPOP = function(params){
    if(this.state!=N3.States.AUTHENTICATION) return this.response("-ERR Only allowed in authentication mode");

    params = params.split(" ");
    var user = params[0] && params[0].trim(),
        hash = params[1] && params[1].trim().toLowerCase(),
        salt = "<"+this.UID+"@"+this.server_name+">",
        response;

    if(typeof this.authCallback=="function"){
        if(!this.authCallback(user, function(pass){
            return md5(salt+pass)==hash;
        })){
            return this.response("-ERR [AUTH] Invalid login");
        }
    }

    this.user = user;

    if((response = this.afterLogin())===true){
        this.state = N3.States.TRANSACTION;
        return this.response("+OK You are now logged in");
    }else
        return this.response(response || "-ERR [SYS] Error with initializing");
}

// USER username - Performs basic authentication, PASS follows
N3.POP3Server.prototype.cmdUSER = function(username){
    if(this.state!=N3.States.AUTHENTICATION) return this.response("-ERR Only allowed in authentication mode");

    this.user = username.trim();
    if(!this.user)
        return this.response("-ERR User not set, try: USER <username>");
    return this.response("+OK User accepted");
}

// PASS - Performs basic authentication, runs after USER
N3.POP3Server.prototype.cmdPASS = function(password){
    if(this.state!=N3.States.AUTHENTICATION) return this.response("-ERR Only allowed in authentication mode");
    if(!this.user) return this.response("-ERR USER not yet set");

    if(typeof this.authCallback=="function"){
        if(!this.authCallback(this.user, function(pass){
            return pass==password;
        })){
            delete this.user;
            return this.response("-ERR [AUTH] Invalid login");
        }
    }

    var response;
    if((response = this.afterLogin())===true){
        this.state = N3.States.TRANSACTION;
        return this.response("+OK You are now logged in");
    }else
        return this.response(response || "-ERR [SYS] Error with initializing");
}

// TRANSACTION commands

// NOOP - always responds with +OK
N3.POP3Server.prototype.cmdNOOP = function(){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");
    this.response("+OK");
}

// STAT Lists the total count and bytesize of the messages
N3.POP3Server.prototype.cmdSTAT = function(){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");

    this.messages.stat((function(err, length, size){
        if(err){
            this.response("-ERR STAT failed")
        }else{
            this.response("+OK "+length+" "+size);
        }
    }).bind(this));

}

// LIST [msg] lists all messages
N3.POP3Server.prototype.cmdLIST = function(msg){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");

    this.messages.list(msg, (function(err, list){
        if(err){
            return this.response("-ERR LIST command failed")
        }
        if(!list)
            return this.response("-ERR Invalid message ID");

        if(typeof list == "string"){
            this.response("+OK "+list);
        }else{
            this.response("+OK");
            for(var i=0;i<list.length;i++){
                this.response(list[i]);
            }
            this.response(".");
        }
    }).bind(this));
}

// UIDL - lists unique identifiers for stored messages
N3.POP3Server.prototype.cmdUIDL = function(msg){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");

    this.messages.uidl(msg, (function(err, list){
        if(err){
            return this.response("-ERR UIDL command failed")
        }

        if(!list)
            return this.response("-ERR Invalid message ID");

        if(typeof list == "string"){
            this.response("+OK "+list);
        }else{
            this.response("+OK");
            for(var i=0;i<list.length;i++){
                this.response(list[i]);
            }
            this.response(".");
        }
    }).bind(this));
}

// RETR msg - outputs a selected message
N3.POP3Server.prototype.cmdRETR = function(msg){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");

    this.messages.retr(msg, (function(err, message){
        if(err){
            return this.response("-ERR RETR command failed")
        }
        if(!message){
            return this.response("-ERR Invalid message ID");
        }
        this.response("+OK "+message.length+" octets");
        this.response(message);
        this.response(".");
    }).bind(this));

}

// DELE msg - marks selected message for deletion
N3.POP3Server.prototype.cmdDELE = function(msg){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");

    this.messages.dele(msg, (function(err, success){
        if(err){
            return this.response("-ERR RETR command failed")
        }
        if(!success){
            return this.response("-ERR Invalid message ID");
        }else{
            this.response("+OK msg deleted");
        }
    }).bind(this));

}

// RSET - resets DELE'ted message flags
N3.POP3Server.prototype.cmdRSET = function(){
    if(this.state!=N3.States.TRANSACTION) return this.response("-ERR Only allowed in transaction mode");
    this.messages.rset();
    this.response("+OK");
}


// UTILITY FUNCTIONS

// Creates a MD5 hash
function md5(str){
    var hash = crypto.createHash('md5');
    hash.update(str);
    return hash.digest("hex").toLowerCase();
}

// EXPORT

export default N3;
