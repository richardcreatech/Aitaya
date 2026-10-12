import Aside from "../components/Aside";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <main
      id="my_main_app"
      className={sidebarCollapsed ? "sidebar-collapsed" : ""}
    >
      <Aside collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <Outlet />
    </main>
  );
}

export default Dashboard;
