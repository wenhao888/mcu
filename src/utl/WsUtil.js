class WsUtil {
    static getRoomUrl() {
        var loc = window.location, url="";

        if (loc.protocol === "https:") {
            url = "wss:";
        } else {
            url = "ws:";
        }
        url += "//" + loc.host + "/rooms";
        return url;
    }

}


export default WsUtil;