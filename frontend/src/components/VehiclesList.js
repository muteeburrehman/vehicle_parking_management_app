import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Container, Spinner, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { useGetVehicles } from "../hooks/useGetVehicles"; // Custom hook to fetch vehicle data
import { useNavigate } from "react-router-dom";
import { fetchOwnerByDNI } from "../services/getOwnerService"; // Fetch owner service

const VehicleList = () => {
    const { vehicles, loading, error } = useGetVehicles(); // Fetch vehicles data
    const [owners, setOwners] = useState({}); // State to hold owners info
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Fetch owner info by DNI
    const fetchOwnerInfo = useCallback(async (ownerId) => {
        try {
            if (!owners[ownerId]) {  // Fetch only if not already fetched
                const ownerData = await fetchOwnerByDNI(ownerId);
                setOwners(prevOwners => ({
                    ...prevOwners,
                    [ownerId]: ownerData // Store owner data by owner ID
                }));
            }
        } catch (err) {
            console.error('Fallo al conector información del propietario:', err.message);
        }
    }, [owners]); // Memoize with owners dependency

    // UseEffect to fetch owner info for each vehicle owner
    useEffect(() => {
        vehicles.forEach(vehicle => {
            if (vehicle.owner_id) {
                fetchOwnerInfo(vehicle.owner_id);
            }
        });
    }, [vehicles, fetchOwnerInfo]); // Add fetchOwnerInfo to the dependency array

    const handleRowClick = (licensePlate) => {
    navigate(`/vehicle/edit/${licensePlate.trim()}`);
};
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // Filter vehicles based on the search term (license plate or owner ID)
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle =>
            vehicle.lisence_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.owner_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vehicles, searchTerm]);

    return (
        <Container className="mt-5">
            <h2 className="vehicle_h2" style={{ textTransform: "uppercase" }}>Registro de Vehículos</h2>

            {/* Search bar */}
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Buscar por Matrícula o DNI"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            {loading && (
                <div className="text-center">
                    <Spinner className="vehicle_spinner" animation="border" variant="primary" />
                </div>
            )}
            {error && <Alert className="vehicle_alert" variant="danger">Error al acceder al registro de vehículos: {error.message}</Alert>}
            {!loading && !error && filteredVehicles.length === 0 && (
                <Alert className="vehicle_alert" variant="info">No hay vehiculos registrados.</Alert>
            )}
            {!loading && !error && filteredVehicles.length > 0 && (
                <Table className="vehicle_table" striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>DNI</th>
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>Telefono</th>
                            <th>Email</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Fecha de registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehicles.map((vehicle) => {
                            const owner = owners[vehicle.owner_id] || {};  // Get owner info
                            return (
                                <tr
                                    key={vehicle.lisence_plate}
                                    onClick={() => handleRowClick(vehicle.lisence_plate)}
                                    style={{ cursor: "pointer" }}
                                    tabIndex="0"  // Makes the row focusable for keyboard users
                                    onKeyPress={(e) => e.key === 'Enter' && handleRowClick(vehicle.lisence_plate)}  // Trigger click on 'Enter'
                                >
                                    <td>{vehicle.lisence_plate}</td>
                                    <td>{vehicle.owner_id}</td>
                                    <td>{owner.first_name || 'N/A'}</td>
                                    <td>{owner.last_name || 'N/A'}</td>
                                    <td>{owner.phone_number || 'N/A'}</td>
                                    <td>{owner.email || 'N/A'}</td>
                                    <td>{vehicle.brand}</td>
                                    <td>{vehicle.model}</td>
                                    <td>{formatDate(vehicle.registration_date)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default VehicleList;
