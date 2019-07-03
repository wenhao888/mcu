var kurento = require('kurento-client');


class KurentoUtil {
    static createClient(url) {
       return new Promise( function (resolve, reject) {

           kurento(url, function(error, _kurentoClient) {
               if (error) {
                   reject(error);

               } else {
                   resolve(_kurentoClient)
               }
           });
       });

    }
}


module.exports = KurentoUtil;