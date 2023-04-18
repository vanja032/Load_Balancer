const ping = require("ping");
const urls = require("../data/urls");

var subprocesses = [];
var trackingHealth = {};

const pingOptions = {
    timeout: 2 // Timeout in seconds (optional, default is 5 seconds)
};

const setProcesses = (processes) => {
    subprocesses = processes;
};

const healthChecker = () => {
    updateHealth();
};

const updateHealth = async () => {
    for (const url in urls) {
        const startTime = performance.now();
        await new Promise(resolve => {
            ping.sys.probe(`${urls[url]["ip"]}`, (isAlive) => {
                const stopTime = performance.now();
                const perf = stopTime - startTime;
                trackingHealth[url] = {
                    alive: isAlive,
                    performance: perf,
                    health_status: (perf < 500) ? "good" : (perf < 1000) ? "medium" : "bad"
                };
                resolve();
            }, pingOptions);
        });
    }
    if (subprocesses.length) {
        for (let i = 0; i < subprocesses.length; i++) {
            subprocesses[i].send({ servers_health: trackingHealth });
        }
    }
    setTimeout(updateHealth, 15000);
};


module.exports = {
    setProcesses: setProcesses,
    checker: healthChecker
};