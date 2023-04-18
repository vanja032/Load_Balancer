interface Performance {
    alive: boolean;
    performance: number;
    health_status: string;
}

// "<url>": { requests: 0, max_requests: 10, protocol: "https:", dns: "<dns>", ip: "<ip>", active: true }
interface Server {
    dns: string;
    ip: string;
    protocol: string;
    requests: number;
    max_requests: number;
    active: boolean;
    performance_health?: Performance;
}

interface Servers {
    [key: string]: Server;
}

interface Clusters {
    [key: string]: Servers;
}