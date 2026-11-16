import React, { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import ProfileInfo from "./ProfileInformation";
import ChangePassword from "./ChangePassword";
import AddressManager from "./AddressManager";
import OrderManager from "./OrderManager";

type TabKey = "profile" | "addresses" | "orders" | "password";

const sidebarItems: { key: TabKey; label: string; icon: string }[] = [
  { key: "profile", label: "Thông tin cá nhân", icon: "person" },
  { key: "addresses", label: "Sổ địa chỉ", icon: "location_on" },
  { key: "orders", label: "Quản lý đơn hàng", icon: "receipt_long" },
  { key: "password", label: "Đổi mật khẩu", icon: "lock" },
];

const ProfileLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        {/* User Card */}
        <div className="flex items-center gap-4 mb-10 p-4 bg-white rounded-xl border border-outline-variant">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                className="w-full h-full object-cover"
                src={user.avatar_url}
                alt="Avatar"
              />
            ) : (
              <span className="material-symbols-outlined text-3xl text-outline">
                account_circle
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              {user?.full_name || "Người dùng"}
            </h3>
            <p className="text-xs text-outline">Khách hàng thân thiết</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="space-y-1">
          {sidebarItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-4 w-full p-4 rounded-lg transition-all text-sm font-semibold ${
                activeTab === key
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </button>
          ))}

          {/* Divider + Logout */}
          <div className="pt-6 mt-6 border-t border-outline-variant">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full p-4 text-error rounded-lg transition-all hover:bg-error-container text-sm font-semibold"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-grow min-w-0">
        {activeTab === "profile" && <ProfileInfo />}
        {activeTab === "addresses" && <AddressManager />}
        {activeTab === "orders" && <OrderManager />}
        {activeTab === "password" && <ChangePassword />}
      </div>
    </div>
  );
};

export default ProfileLayout;
