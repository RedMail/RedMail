// see http://github.com/bnoordhuis/node-iconv for more info
var Iconv = require("iconv").Iconv;

/* mime related functions - encoding/decoding etc*/
/* TODO: Only UTF-8 and Latin1 are allowed with encodeQuotedPrintable */
/* TODO: Check if the input string even needs encoding                */
var mime = {}
/**
 * mime.foldLine(str, maxLength, foldAnywhere) -> String
 * - str (String): mime string that might need folding
 * - maxLength (Number): max length for a line, defaults to 78
 * - foldAnywhere (Boolean): can fold at any location (ie. in base64)
 * - afterSpace (Boolean): If [true] fold after the space
 *
 * Folds a long line according to the RFC 5322
 *   <http://tools.ietf.org/html/rfc5322#section-2.1.1>
 *
 * For example:
 *     Content-Type: multipart/alternative; boundary="----bd_n3-lunchhour1283962663300----"
 * will become
 *     Content-Type: multipart/alternative;
 *      boundary="----bd_n3-lunchhour1283962663300----"
 *
 **/
mime.foldLine = function(str, maxLength, foldAnywhere, afterSpace){
    var line=false, curpos=0, response="", lf;
    maxLength = maxLength || 78;

    // return original if no need to fold
    if(str.length<=maxLength)
        return str;

    // read in <maxLength> bytes and try to fold it
    while(line = str.substr(curpos, maxLength)){
        if(!!foldAnywhere){
            response += line;
            if(curpos+maxLength<str.length){
                response+="\r\n";
            }
        }else{
            lf = line.lastIndexOf(" ");
            if(lf<=0)
                lf = line.lastIndexOf("\t");
            if(line.length>=maxLength && lf>0){
                if(!!afterSpace){
                    // move forward until line end or no more \s and \t
                    while(lf<line.length && (line.charAt(lf)==" " || line.charAt(lf)=="\t")){
                        lf++;
                    }
                }
                response += line.substr(0,lf)+"\r\n";
                curpos -= line.substr(lf).length;
            }else
                response+=line;
        }
        curpos += line.length;
    }

    // return folded string
    return response;
}


/**
 * mime.encodeMimeWord(str, encoding, charset) -> String
 * - str (String): String to be encoded
 * - encoding (String): Encoding Q for quoted printable or B (def.) for base64
 * - charset (String): Charset to be used
 *
 * Encodes a string into mime encoded word format
 *   <http://en.wikipedia.org/wiki/MIME#Encoded-Word>
 *
 * For example:
 *     See on õhin test
 * Becomes with UTF-8 and Quoted-printable encoding
 *     =?UTF-8?q?See_on_=C3=B5hin_test?=
 *
 **/
mime.encodeMimeWord = function(str, encoding, charset){
    charset = charset || "UTF-8";
    encoding = encoding && encoding.toUpperCase() || "B";

    if(encoding=="Q"){
        str = mime.encodeQuotedPrintable(str, true, charset);
    }

    if(encoding=="B"){
        str = mime.encodeBase64(str);
    }

    return "=?"+charset+"?"+encoding+"?"+str+"?=";
}

/**
 * mime.decodeMimeWord(str, encoding, charset) -> String
 * - str (String): String to be encoded
 * - encoding (String): Encoding Q for quoted printable or B (def.) for base64
 * - charset (String): Charset to be used, defaults to UTF-8
 *
 * Decodes a string from mime encoded word format, see [[encodeMimeWord]]
 *
 **/

mime.decodeMimeWord = function(str){
    var parts = str.split("?"),
        charset = parts && parts[1],
        encoding = parts && parts[2],
        text = parts && parts[3];
    if(!charset || !encoding || !text)
        return str;
    if(encoding.toUpperCase()=="Q"){
        return mime.decodeQuotedPrintable(text, true, charset);
    }

    if(encoding.toUpperCase()=="B"){
        return mime.decodeBase64(text);
    }

    return text;
}


/**
 * mime.encodeQuotedPrintable(str, mimeWord, charset) -> String
 * - str (String): String to be encoded into Quoted-printable
 * - mimeWord (Boolean): Use mime-word mode (defaults to false)
 * - charset (String): Destination charset, defaults to UTF-8
 *   TODO: Currently only allowed charsets: UTF-8, LATIN1
 *
 * Encodes a string into Quoted-printable format.
 **/
mime.encodeQuotedPrintable = function(str, mimeWord, charset){
    charset = charset || "UTF-8";

    /*
     * Characters from 33-126 OK (except for =; and ?_ when in mime word mode)
     * Spaces + tabs OK (except for line beginnings and endings)
     * \n + \r OK
     */

    str = str.replace(/[^\sa-zA-Z\d]/gm,function(c){
        if(!!mimeWord){
            if(c=="?")return "=3F";
            if(c=="_")return "=5F";
        }
        if(c!=="=" && c.charCodeAt(0)>=33 && c.charCodeAt(0)<=126)
            return c;
        return c=="="?"=3D":(charset=="UTF-8"?encodeURIComponent(c):escape(c)).replace(/%/g,'=');
    });

    str = lineEdges(str);

    if(!mimeWord){
        // lines might not be longer than 76 bytes, soft break: "=\r\n"
        var lines = str.split(/\r?\n/);
        for(var i=0, len = lines.length; i<len; i++){
            if(lines[i].length>76){
                lines[i] = mime.foldLine(lines[i],76, false, true).replace(/\r\n/g,"=\r\n");
            }
        }
        str = lines.join("\r\n");
    }else{
        str = str.replace(/\s/g, function(a){
            if(a==" ")return "_";
            if(a=="\t")return "=09";
            return a=="\r"?"=0D":"=0A";
        });
    }

    return str;
}

/**
 * mime.deccodeQuotedPrintable(str, mimeWord, charset) -> String
 * - str (String): String to be decoded
 * - mimeWord (Boolean): Use mime-word mode (defaults to false)
 * - charset (String): Charset to be used, defaults to UTF-8
 *
 * Decodes a string from Quoted-printable format.
 **/
mime.decodeQuotedPrintable = function(str, mimeWord, charset){
    charset = charset && charset.toUpperCase() || "UTF-8";

    if(mimeWord){
        str = str.replace(/_/g," ");
    }else{
        str = str.replace(/=\r\n/gm,'');
    }
    if(charset == "UTF-8")
        str = decodeURIComponent(str.replace(/=/g,"%"));
    else{
        str = str.replace(/=/g,"%");
        if(charset=="ISO-8859-1" || charset=="LATIN1")
            str = unescape(str);
        else{
            str = decodeBytestreamUrlencoding(str);
            str = fromCharset(charset, str);
        }
    }
    return str;
}

/**
 * mime.encodeBase64(str) -> String
 * - str (String): String to be encoded into Base64
 * - charset (String): Destination charset, defaults to UTF-8
 *
 * Encodes a string into Base64 format. Base64 is mime-word safe.
 **/
mime.encodeBase64 = function(str, charset){
    var buffer;
    if(charset && charset.toUpperCase()!="UTF-8")
        buffer = toCharset(charset, str);
    else
        buffer = new Buffer(str, "UTF-8");
    return buffer.toString("base64");
}

/**
 * mime.decodeBase64(str) -> String
 * - str (String): String to be decoded from Base64
 * - charset (String): Source charset, defaults to UTF-8
 *
 * Decodes a string from Base64 format. Base64 is mime-word safe.
 * NB! Always returns UTF-8
 **/
mime.decodeBase64 = function(str, charset){
    var buffer = new Buffer(str, "base64");

    if(charset && charset.toUpperCase()!="UTF-8"){
        return fromCharset(charset, buffer);
    }

    // defaults to utf-8
    return buffer.toString("UTF-8");
}

/**
 * mime.parseHeaders(headers) -> Array
 * - headers (String): header section of the e-mail
 *
 * Parses header lines into an array of objects (see [[parseHeaderLine]])
 * FIXME: mime should probably not be here but in "envelope" instead
 **/
mime.parseHeaders = function(headers){
    var text, lines, line, i, name, value, cmd, header_lines = {};
    // unfold
    headers = headers.replace(/\r?\n([ \t])/gm," ");

    // split lines
    lines = headers.split(/\r?\n/);
    for(i=0; i<lines.length;i++){
        if(!lines[i]) // no more header lines
            break;
        cmd = lines[i].match(/[^\:]+/);
        if(cmd && (cmd = cmd[0])){
            name = cmd;
            value = lines[i].substr(name.length+1);
            if(!header_lines[name.toLowerCase()])header_lines[name.toLowerCase()] = [];
            header_lines[name.toLowerCase()].push(parseHeaderLine(name, value));
        }
    }

    return header_lines;
}

/* Helper functions */

/**
 * parseHeaderLine(name, value) -> Object
 * - name (String): Name of the header line
 * - value (String): Value of the header line
 *
 * Parses header line into separate parts. Fore example
 *     Content-type: text/plain; Charset = utf-8
 * becomes
 *     {
 *       "name"  : "Content-type",
 *       "value" : "text/plain",
 *       "params": [
 *         {
 *           "name" : "Charset",
 *           "value": "utf-8"
 *         }
 *       ]
 *     }
 **/
function parseHeaderLine(name, value){
    var header_line = {
        name: name,
        original: value.trim(),
        value: "",
        params: []
    }, parts = value.split(/;/g), i, line, m, n, v;

    for(i=0; i<parts.length;i++){
        line = parts[i].replace(/=\?([^\?]+)\?([^\?]+)\?([^\?]+)\?=/g, function(a){
            return exports.decodeMimeWord(a);
        }).trim();
        if(line){
            if(m = line.match(/^\w+s*=/)){
                n = m[0].substr(0,m[0].length-1).trim();
                v =  line.substr(m[0].length).trim();
                if(i==0)
                    header_line.value = {name:n, value:v};
                else
                    header_line.params.push({name:n, value:v});
            }else{
                if(i==0)
                    header_line.value = {value:line};
                else
                    header_line.params.push({value:line});
            }
        }
    }
    return header_line;
}

/**
 * lineEdges(str) -> String
 * - str (String): String to be processed
 *
 * Replaces all spaces and tabs in the beginning and end of the string
 * with quoted printable encoded chars. Needed by [[encodeQuotedPrintable]]
 **/
function lineEdges(str){
    str = str.replace(/^[ \t]+/gm, function(wsc){
        return wsc.replace(/ /g,"=20").replace(/\t/g,"=09");
    });

    str = str.replace(/[ \t]+$/gm, function(wsc){
        return wsc.replace(/ /g,"=20").replace(/\t/g,"=09");
    });
    return str;
}

/**
 * fromCharset(charset, buffer, keep_buffer) -> String | Buffer
 * - charset (String): Source charset
 * - buffer (Buffer): Buffer in <charset>
 * - keep_buffer (Boolean): If true, return buffer, otherwise UTF-8 string
 *
 * Converts a buffer in <charset> codepage into UTF-8 string
 **/
function fromCharset(charset, buffer, keep_buffer){
    var iconv = new Iconv(charset,'UTF-8'),
        buffer = iconv.convert(buffer);
    return keep_buffer?buffer:buffer.toString("utf-8");
}

/**
 * toCharset(charset, buffer) -> Buffer
 * - charset (String): Source charset
 * - buffer (Buffer): Buffer in UTF-8 or string
 *
 * Converts a string or buffer to <charset> codepage
 **/
function toCharset(charset, buffer){
    var iconv = new Iconv('UTF-8',charset);
    return iconv.convert(buffer);
}

/**
 * decodeBytestreamUrlencoding(encoded_string) -> Buffer
 * - encoded_string (String): String in urlencode coding
 *
 * Converts an urlencoded string into a bytestream buffer. If the used
 * charset is known the resulting string can be converted to UTF-8 with
 * [[fromCharset]].
 * NB! For UTF-8 use decodeURIComponent and for Latin 1 decodeURL instead
 **/
function decodeBytestreamUrlencoding(encoded_string){

    var c, i, j=0, buffer_length = encoded_string.length -
                            (encoded_string.match(/%/g).length*2),
        buffer = new Buffer(buffer_length);

    for(var i=0; i<encoded_string.length; i++){
        c = encoded_string.charCodeAt(i);
        if(c=="37"){ // %
            c = parseInt(encoded_string.substr(i+1,2), 16);
            i+=2;
        }
        buffer[j++] = c;
    }
    return buffer;
}
export default mime;
