import React, { useState, useMemo } from 'react';
import {Table, Container, Spinner, Alert, FormControl, InputGroup, Button} from 'react-bootstrap';
import { useGetOwners } from "../hooks/useGetOwners";
import { useNavigate } from "react-router-dom";

const OwnerList = () => {
    const { owners, loading, error } = useGetOwners();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleRowClick = (dni) => {
        navigate(`/owner/edit/${dni}`);
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

    // Filter the owners list based on the search term (DNI, first name, or last name)
    const filteredOwners = useMemo(() => {
        return owners.filter(owner =>
            owner.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [owners, searchTerm]);

    const handleAddNew = () => {
        navigate('/owner-registration');
    };

    return (
        <Container className="mt-5">
             <h2 className="vehicle_h2" style={{ textTransform: "uppercase" }}>Clientes</h2>

             <Button className="mb-3" variant="primary" onClick={handleAddNew}>
                Añadir Cliente
            </Button>

            {/* Search bar */}
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Buscar por DNI, Nombre o Apellidos"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            {loading && (
                <div className="text-center">
                    <Spinner className="owner_spinner" animation="border" variant="primary" />
                </div>
            )}
            {error && <Alert className="owner_alert" variant="danger">Error fetching owners: {error.message}</Alert>}
            {!loading && !error && filteredOwners.length === 0 && (
                <Alert className="owner_alert" variant="info">No hay Clientes Disponibles.</Alert>
            )}
            {!loading && !error && filteredOwners.length > 0 && (
                <Table className="owner_table" striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>DNI</th>
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Fecha de Registro</th>
                            {/*<th>Created By</th>*/}
                            {/*<th>Modified By</th>*/}
                            {/*<th>Modification Time</th>*/}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOwners.map((owner) => (
                            <tr
                                key={owner.dni}
                                onClick={() => handleRowClick(owner.dni)}
                                style={{cursor: "pointer"}}
                                tabIndex="0"
                                onKeyPress={(e) => e.key === 'Enter' && handleRowClick(owner.dni)}
                            >
                                <td>{owner.dni}</td>
                                <td>{owner.first_name}</td>
                                <td>{owner.last_name}</td>
                                <td>{owner.phone_number}</td>
                                <td>{owner.email}</td>
                                <td>{formatDate(owner.registration_date)}</td>
                                {/*<td>{owner.created_by}</td>*/}
                                {/*<td>{owner.modified_by || '-'}</td>*/}
                                {/*<td>{formatDate(owner.modification_time)}</td>*/}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default OwnerList;