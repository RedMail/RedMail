// SASL AUTH methods

// var mime = require("./mime")
import mime from './mime'
var crypto = require("crypto");

/**
 * sasl.AUTHMethods -> Array
 *
 * Array of objects containing information about the authentication functions
 * Struncture: {name: NAME_OF_THE_METHOD, fn: authentication_function(authObject)}
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
 *     returns TRUE if successful or FALSE if not
 **/
exports.AUTHMethods = [
    {
        name:"PLAIN",
        fn:  PLAIN
    },
    {
        name:"CRAM-MD5",
        fn:  CRAM_MD5
    }
]

// AUTH PLAIN

// SCENARIO 1:
// STEP 1
//   CLIENT: AUTH PLAIN
//   SERVER: +
// STEP 2
//   CLIENT: BASE64(<NULL>username<NULL>password)
//   SERVER: +OK logged in

// SCENARIO 2:
// STEP 1
//   CLIENT: AUTH PLAIN BASE64(<NULL>username<NULL>password)
//   SERVER: +OK logged in

function PLAIN(authObj){

    // Step 1
    if(!authObj.params){
        authObj.wait = true;
        return "+ ";
    }

    // Step 2
    var login = mime.decodeBase64(authObj.params),
        parts = login.split("\u0000");

    if(parts.length!=3 || !parts[1])
        return "-ERR Invalid authentication data";

    if(parts[0].length) // try to log in in behalf of some other user
        return "-ERR [AUTH] Not authorized to requested authorization identity";

    return authObj.check(parts[1], parts[2]);
}

// AUTH CRAM-MD5

// STEP 1
//   CLIENT: AUTH CRAM-MD5
//   SERVER: + BASE64(secret)
// STEP 2
//   CLIENT: BASE64(user HMAC-MD5(secret, password))
//   SERVER: +OK Logged in

function CRAM_MD5(authObj){

    // Step 1
    if(!authObj.params){
        authObj.wait = true;
        return "+ "+mime.encodeBase64("<"+authObj.n3.UID+"@"+authObj.n3.server_name+">");
    }

    // Step 2
    var params = mime.decodeBase64(authObj.params).split(" "), user, challenge,
        salt = "<"+authObj.n3.UID+"@"+authObj.n3.server_name+">";
    console.log("CRAM-MD5 Unencoded: "+params);
    user = params && params[0];
    challenge = params && params[1];
    if(!user || !challenge)
        return "-ERR Invalid authentication";

    return authObj.check(user, function(pass){
            var hmac = crypto.createHmac("md5", pass), digest;
            hmac.update(salt);
            digest = hmac.digest("hex");
            return digest==challenge;
        });
}
