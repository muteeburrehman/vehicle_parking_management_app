import React from 'react';
import { CDBSidebarMenuItem } from 'cdbreact';

const CustomSidebarMenuItem = ({ icon, children, ...props }) => {
  return (
    <CDBSidebarMenuItem {...props}>
      {icon && (
        <i
          className={`fa fa-${icon}`}
          style={{
            marginRight: '8px',
            minWidth: '20px',
            display: 'inline-block',
            textAlign: 'center'
          }}
        />
      )}
      <span>{children}</span>
    </CDBSidebarMenuItem>
  );
};

export default CustomSidebarMenuItem;