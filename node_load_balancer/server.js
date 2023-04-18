require("dotenv").config();
const cluster = require("cluster");
const available_cores = require("os").cpus().length;

const balancerHost = process.env.BALANCER_HOST || "0.0.0.0";
const balancerPort = process.env.BALANCER_PORT || 3000;


if (cluster.isMaster) {

    const serverHealth = require("./balancer/server/health");
    const dataSync = require("./balancer/sync/data_sync");

    var processes = [];
    for (let i = 0; i < available_cores; i++) {
        const subprocess = cluster.fork();
        processes.push(subprocess);
        subprocess.send({ main_subprocess: processes[0].id });
    }
    serverHealth.setProcesses(processes);
    serverHealth.checker();

    dataSync.setClusters(processes);

    cluster.on("exit", (worker) => {
        const subprocess = cluster.fork();
        processes.splice(processes.indexOf(worker), 1);
        processes.push(subprocess);
        serverHealth.setProcesses(processes);

        dataSync.unsetCluster(worker.id);
        dataSync.setClusters(processes);

        for (let i = 0; i < processes.length; i++) {
            processes[i].send({ main_subprocess: processes[0].id });
        }
    });
}
else {
    const balancer = require("./balancer");

    balancer.listen(balancerPort, balancerHost, () => {
        console.log("NodeJs Balancer server has started.");
    });
}