import React, { useState } from 'react'; // Importa React y useState
import { NavLink } from 'react-router-dom'; // Importa NavLink para la navegación
import useAuth from '../hooks/useAuth'; // Importa tu hook personalizado useAuth
import Logo from '../assets/icons/Logo blanco.png'; // Asegúrate de que la ruta sea correcta
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact'; // Importa los componentes necesarios de cdbreact

const Sidebar = () => {
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState({});

  if (!user) {
    return null;
  }

  const isSuperUser = user.role === 'superuser';

  // Definimos los elementos del menú según las condiciones
  const groupedMenuItems = {
    Clientes: [
      { to: "/", icon: "columns", text: "Lista de Clientes" },
      { to: "/owner-registration", icon: "user-plus", text: "+Añadir Cliente" },
      { to: "/owner_histories", icon: "columns", text: "Histórico de Clientes" },
    ],
    Vehículos: [
      { to: "/vehicles", icon: "columns", text: "Lista de Vehículos" },
      { to: "/vehicle_histories", icon: "columns", text: "Histórico de Vehículos" },
    ],
    ...(isSuperUser && {
      ConfiguraciónAPP: [
        { to: "/add-new-user", icon: "user-plus", text: "+Añadir Usuario" },
        { to: "/parking-lot/add", icon: "user-plus", text: "+Añadir Aparcamiento" },
        { to: "/parking-lot-list", icon: "columns", text: "Editar Aparcamiento" },
        { to: "/add-subscription-type", icon: "user-plus", text: "+Añadir Tipo de Abono" },
      ],
    }),
    Abonos: [
      ...(isSuperUser
        ? [
            { to: "/subscription-type-list", icon: "columns", text: "Tipos de Abono" },
          ]
        : []),
      { to: "/add-subscription", icon: "user-plus", text: "+Añadir Abono" },
      { to: "/subscription-list", icon: "columns", text: "Lista de Abonos" },
      { to: "/subscription_histories", icon: "columns", text: "Histórico de Abonos" },
      { to: "/cancel-subscription-list", icon: "columns", text: "Bajas Pendientes" },
      { to: "/approved-cancellation-list", icon: "columns", text: "Bajas de Abonos" },
    ],
    Estadísticas: [
      { to: "/parking-lots", icon: "columns", text: "Conteo de Plazas", end: true },
      { to: "/parking-lot-stats", icon: "chart-line", text: "Estadísticas Aparcamiento" },
    ],
    Vencimientos: [
      { to: "/owners/reduced-mobility", icon: "columns", text: "Movilidad Reducida" },
      { to: "/subscriptions/large-family", icon: "columns", text: "Familia Numerosa" },
    ],
  };

  // Función para alternar la visibilidad de las secciones
  const toggleSection = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'scroll initial' }}>
      <CDBSidebar textColor="#fff" backgroundColor="#212529">
        <CDBSidebarHeader>
          <a href="/" className="text-decoration-none" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <img
              src={Logo}
              alt="Logo"
              style={{
                width: '40px',
                height: '40px',
                marginRight: '10px',
                verticalAlign: 'middle',
              }}
            />
            <span style={{ fontSize: '22px', lineHeight: '40px', fontWeight: 'bold' }}>AMGEVICESA</span>
          </a>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>
            {Object.entries(groupedMenuItems).map(([section, items]) => (
              <div key={section}>
                <div
                  style={{ cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center' }}
                  onClick={() => toggleSection(section)}
                >
                  <i
                    className="fa fa-angle-right"
                    style={{
                      marginRight: '10px',
                      transform: openSections[section] ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  ></i>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>
                    {section.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </div>
                {openSections[section] &&
                  items.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => (isActive ? 'activeClicked' : '')}
                    >
                      <CDBSidebarMenuItem icon={item.icon}>{item.text}</CDBSidebarMenuItem>
                    </NavLink>
                  ))}
              </div>
            ))}
          </CDBSidebarMenu>
        </CDBSidebarContent>

        <CDBSidebarFooter style={{ textAlign: 'center' }}>
          <div style={{ padding: '20px 5px' }}>AMGEVICESA</div>
        </CDBSidebarFooter>
      </CDBSidebar>
    </div>
  );
};

export default Sidebar;
