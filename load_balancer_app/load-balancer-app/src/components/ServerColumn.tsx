import ServerCard from "./ServerCard";
import "../types/interfaces";

interface Props extends Server {
  url: string;
  onChangeActiveStatus: (url: string, activeState: boolean) => void;
}

const ServerColumn = (server: Props) => {
  return (
    <div className="col-xl-3 col-lg-4 col-md-4 col-sm-6 col-12 p-2">
      <ServerCard
        url={server.url}
        dns={server.dns}
        ip={server.ip}
        requests={server.requests}
        max_requests={server.max_requests}
        protocol={server.protocol}
        active={server.active}
        performance_health={server.performance_health}
        onChangeActiveStatus={server.onChangeActiveStatus}
      />
    </div>
  );
};

export default ServerColumn;
