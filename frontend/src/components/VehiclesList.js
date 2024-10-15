import React, { useState, useMemo } from 'react';
import { Table, Container, Spinner, Alert, InputGroup, FormControl } from 'react-bootstrap';
import { useGetVehicles } from "../hooks/useGetVehicles"; // Custom hook to fetch vehicle data
import { useNavigate } from "react-router-dom";


const VehicleList = () => {
    const { vehicles, loading, error } = useGetVehicles();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleRowClick = (licensePlate) => {
        navigate(`/vehicle/edit/${licensePlate}`);
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
            <h2 className="vehicle_h2" style={{textTransform:"uppercase"}}>Vehicle List</h2>

            {/* Search bar */}
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Search by License Plate or Owner ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            {loading && (
                <div className="text-center">
                    <Spinner className="vehicle_spinner" animation="border" variant="primary" />
                </div>
            )}
            {error && <Alert className="vehicle_alert" variant="danger">Error fetching vehicles: {error.message}</Alert>}
            {!loading && !error && filteredVehicles.length === 0 && (
                <Alert className="vehicle_alert" variant="info">No vehicles available.</Alert>
            )}
            {!loading && !error && filteredVehicles.length > 0 && (
                <Table className="vehicle_table" striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>License Plate</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Vehicle Type</th>
                        <th>OwnerId (DNI)</th>
                        <th>Registration Date</th>
                        {/*<th>Created By</th>*/}
                        {/*<th>Modified By</th>*/}
                        {/*<th>Modification Time</th>*/}

                    </tr>
                    </thead>
                    <tbody>
                        {filteredVehicles.map((vehicle) => (
                            <tr
                                key={vehicle.lisence_plate}
                                onClick={() => handleRowClick(vehicle.lisence_plate)}
                                style={{cursor: "pointer"}}
                                tabIndex="0"  // Makes the row focusable for keyboard users
                                onKeyPress={(e) => e.key === 'Enter' && handleRowClick(vehicle.lisence_plate)}  // Trigger click on 'Enter'
                            >
                                <td>{vehicle.lisence_plate}</td>
                                <td>{vehicle.brand}</td>
                                <td>{vehicle.model}</td>
                                <td>{vehicle.vehicle_type}</td>
                                <td>{vehicle.owner_id}</td>

                                <td>{formatDate(vehicle.registration_date)}</td>

                                {/*<td>{vehicle.created_by}</td>*/}
                                {/*<td>{vehicle.modified_by || '-'}</td>*/}
                                {/*<td>{formatDate(vehicle.modification_time)}</td>*/}

                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default VehicleList;
