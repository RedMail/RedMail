var N3 = require("./n3").N3,
    MessageStore = require("./messagestore").MessageStore,

    server_name = "fw.node.ee";

var markdown = require("node-markdown").Markdown;

// runs after the user is successfully authenticated
MessageStore.prototype.registerHook = function(){

    // Add a new message to the users inbox (MessageStore)
    var curtime = new Date().toLocaleString(),
        message = "Tere ÕÜÄÖŠ!\n------------------\n\n"+
                  "Kell on praegu **"+curtime+"**\n"+
                  "\n"+
                  "Vaata ka:\n"+
                  "\n"+
                  "  * [Delfi](http://www.delfi.ee)\n" +
                  "  * [NETI](http://www.neti.ee)\n" +
                  "  * [EPL](http://www.epl.ee)\n" +
                  "\n"+
                  "*Koodiblokk*\n"+
                  "\n"+
                  "    for(var i=0;i<100;i++){\n"+
                  "        alert(i+5);\n"+
                  "    }\n"+
                  "\n\n"+
                  "Parimat,  \nKellamees";

    this.addMessage({
        toName:         "Andris Reinman",
        toAddress:      "andris.reinman@gmail.com",
        fromName:       "Ämblik Kämbu",
        fromAddress:    "amblik.kambu@node.ee",
        subject:        "Muti metroo on nüüd avatud!",
        text:           message,
        html:           markdown(message)
    });
}

// Currenlty any user with password "12345" will be authenticated successfully
function AuthStore(user, auth){
    var password;
    if(user){
        password = 12345;
    }
    return auth(password);
}

// Setup servers for both port 110 (standard) and 995 (secure)

// listen on standard port 110
N3.startServer(110, server_name, AuthStore, MessageStore);
// console.log(11)

// Custom authentication method: FOOBAR <user> <pass>
N3.extendAUTH("FOOBAR",function(authObj){
    var params = authObj.params.split(" "),
        user = params[0],
        pass = params[1];

    if(!user) // username is not set
        return "-ERR Authentication error. FOOBAR expects <user> <password>"

    authObj.user = user;
    return authObj.check(user, pass);
});
