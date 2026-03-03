import { useState, useEffect } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role ? String(user.role).toLowerCase() : null);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen xl:flex">
      {!isAdmin && (
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
      )}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${!isAdmin ? (isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]") : ""
          } ${isMobileOpen && !isAdmin ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
