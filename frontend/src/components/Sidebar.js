import React from 'react';
import useAuth from '../hooks/useAuth';
import Logo from '../assets/icons/Logo.png';

import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isSuperUser = user.role === 'superuser';

  const menuItems = [
    { to: "/", icon: "columns", text: "Owners List" },
    isSuperUser && { to: "/add-new-user", icon: "user-plus", text: "Add User" },
    { to: "/owner-registration", icon: "user-plus", text: "Owner Registration" },
    {to:"/owner_histories", icon: "columns", text: "Owners History List"},
    { to: "/vehicles", icon: "columns", text: "Vehicles List" },
      {to:"/vehicle_histories", icon: "columns", text: "Vehicle History List"},
    isSuperUser && { to: "/add-subscription-type", icon: "user-plus", text: "Subscription Type" },
    isSuperUser && { to: "/subscription-type-list", icon: "columns", text: "Subscription Type List" },
      isSuperUser && {to:"/parking-lot-config", icon: "user-plus", text: "Parking Lot Config "},
      isSuperUser && {to:"/parking-lot-stats", icon:"chart-line", text: "Parking Lot Stats" },
    { to: "/add-subscription", icon: "user-plus", text: "Subscription" },
    { to: "/subscription-list", icon: "columns", text: "Subscription List" },
    { to: "/subscription_histories", icon: "columns", text: "Subscription Histories" },
    // { to: "/vehicle_counts", icon: "chart-line", text: "Vehicle Counts" },
    { to: "/cancel-subscription-list", icon: "columns", text: "Canceled Subscriptions List" },
  ].filter(Boolean);

  return (

    <div style={{ display: 'flex', height: '100vh', overflow: 'scroll initial' }}>
      <CDBSidebar textColor="#fff" backgroundColor="#212529">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large"></i>}>
          <a href="/" className="text-decoration-none" style={{color: 'inherit'}}>
            <img src={Logo} alt="Logo" style={{width: '30px', height: '30px', marginRight: '10px'}}/>
            AMGEVICESA
          </a>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
        <CDBSidebarMenu>
            {menuItems.map((item, index) => (
              <NavLink key={index} to={item.to} className={({ isActive }) => (isActive ? 'activeClicked' : '')}>
                <CDBSidebarMenuItem icon={item.icon}>{item.text}</CDBSidebarMenuItem>
              </NavLink>
            ))}
          </CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center' }}>
          <div style={{ padding: '20px 5px' }}>
            AMGEVICESA
          </div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
};

export default Sidebar;