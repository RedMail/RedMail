var SMTPServer = require('smtp-server').SMTPServer;


var server = new SMTPServer({
    // logger: true,
    banner: 'Welcome to My Awesome SMTP Server',
    disabledCommands: ['AUTH', 'STARTTLS'],
    authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],
    size: 10 * 1024 * 1024,
    useXClient: true,
    hidePIPELINING: true,
    useXForward: true
});



export default server
