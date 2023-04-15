require("dotenv").config();
const cluster = require("cluster");
const available_cores = require("os").cpus().length;

const balancer_host = process.env.BALANCER_HOST || "0.0.0.0";
const balancer_port = process.env.BALANCER_PORT || 3000;

const serverHealth = require("./balancer/server/health");

if(cluster.isMaster){
    var subprocesses = [];
    for(let i = 0; i < available_cores; i++){
        const subprocess = cluster.fork();
        subprocesses.push(subprocess);
    }
    serverHealth.setProcesses(subprocesses);
    serverHealth.checker();
}
else{
    const balancer = require("./balancer");

    balancer.listen(balancer_port, balancer_host, () => {
        console.log("NodeJs Balancer server has started.");
    });
}