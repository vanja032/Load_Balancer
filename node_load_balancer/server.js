require("dotenv").config();
const cluster = require("cluster");
const available_cores = require("os").cpus().length;

const balancer_host = process.env.BALANCER_HOST || "0.0.0.0";
const balancer_port = process.env.BALANCER_PORT || 3000;

const balancer = require("./balancer");

if(cluster.isMaster){
    for(let i = 0; i < available_cores; i++){
        cluster.fork();
    }
}
else{
    balancer.listen(balancer_port, balancer_host, () => {
        console.log("NodeJs Balancer server has started.");
    });
}
