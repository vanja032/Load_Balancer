import server_icon from "../assets/media/server_icon2.png";
import "../types/interfaces";

interface Props extends Server {
  url: string;
  onChangeActiveStatus: (url: string, activeState: boolean) => void;
}

const ServerCard = (server: Props) => {
  return (
    <div className="card bg-dark2" style={{ height: 100 + "%" }}>
      <div className="card-header">
        <div className="d-flex align-items-center">
          <img src={server_icon} className="server-icon" />
          <div
            className={
              "server-status border border-4 ms-auto " +
              (server.active ? "border-success" : "border-danger")
            }
          ></div>
        </div>
      </div>
      <div className="card-body d-flex flex-column justify-content-between">
        <h5 className="card-title mb-3 tx-yellow">{server.url}</h5>
        <ul className="list-group">
          <li className="list-group-item bg-dark3 tx-white">
            Requests: {server.requests}
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            Status:{" "}
            {server.active ? (
              <span className="text-success">Active</span>
            ) : (
              <span className="text-danger">Inactive</span>
            )}
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            Alive:{" "}
            {server.performance_health?.alive ? (
              <span className="text-success">True</span>
            ) : (
              <span className="text-danger">False</span>
            )}
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            Performance:{" "}
            <span
              className={
                server.performance_health?.performance != undefined
                  ? server.performance_health?.performance < 500
                    ? "text-success"
                    : server.performance_health?.performance < 1000
                    ? "text-warning"
                    : "text-danger"
                  : "text-light"
              }
            >
              {server.performance_health?.performance != undefined
                ? Number((server.performance_health?.performance).toFixed(2))
                : server.performance_health?.performance}
            </span>
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            Health status:{" "}
            <span
              className={
                server.performance_health?.performance != undefined
                  ? server.performance_health?.performance < 500
                    ? "text-success"
                    : server.performance_health?.performance < 1000
                    ? "text-warning"
                    : "text-danger"
                  : "text-light"
              }
            >
              {server.performance_health?.health_status}
            </span>
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            IP address: <span className="tx-yellow">{server.ip}</span>
          </li>
          <li className="list-group-item bg-dark3 tx-white">
            DNS: <span className="text-info">{server.dns}</span>
          </li>
        </ul>
        <div></div>
        <button
          className={
            "btn activate-button mt-3 " +
            (server.active ? "btn-danger" : "btn-success")
          }
          onClick={() => {
            server.onChangeActiveStatus(server.url, !server.active);
          }}
        >
          {server.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
};

export default ServerCard;
