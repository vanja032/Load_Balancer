require("dotenv").config();

const balancer = require("./balancer");

const balancer_host = process.env.BALANCER_HOST || "0.0.0.0";
const balancer_port = process.env.BALANCER_PORT || 3000;

balancer.listen(balancer_port, balancer_host, () => {
    console.log("NodeJs Balancer server has started.");
});