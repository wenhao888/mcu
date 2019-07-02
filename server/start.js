let httpServer = require("./httpServer");
let messageServer = require("./messageServer");


run();

async function run () {
    let rawHttpServer = await  httpServer.start();
    await messageServer.start(rawHttpServer);
}