import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {getSubscriptions, getSubscriptionTypes, exportSubscriptions} from '../services/subscriptionService';
import {Table, Button, Spinner, Alert, Container, Form, Badge, Modal} from 'react-bootstrap';
import {fetchOwnerByDNI} from "../services/getOwnerService";

const SubscriptionList = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [owners, setOwners] = useState({});
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFields, setExportFields] = useState([]);
    const navigate = useNavigate();

    const fetchOwnerInfo = async (ownerId) => {
        try {
            const ownerData = await fetchOwnerByDNI(ownerId);
            setOwners(prevOwners => ({
                ...prevOwners,
                [ownerId]: ownerData
            }));
        } catch (err) {
            console.error('Failed to fetch owner info:', err.message);
        }
    };

    useEffect(() => {
        const fetchSubscriptionsAndTypes = async () => {
            setLoading(true);
            setError(null);
            try {
                const [subs, types] = await Promise.all([getSubscriptions(), getSubscriptionTypes()]);
                setSubscriptions(subs);
                setSubscriptionTypes(types);

                // Fetch owner info for each subscription
                subs.forEach(sub => fetchOwnerInfo(sub.owner_id));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionsAndTypes();
    }, []);

    const handleRowClick = (id) => {
        navigate(`/subscription/edit/${id}`);
    };

    const handleAddNew = () => {
        navigate('/add-subscription');
    };

    const handleFilter = (filterName) => {
        setActiveFilters(prevFilters => {
            const filterIndex = prevFilters.indexOf(filterName);
            if (filterIndex !== -1) {
                return prevFilters.filter(f => f !== filterName);
            } else {
                return [...prevFilters, filterName];
            }
        });
    };

    const clearFilters = () => {
        setActiveFilters([]);
    };

    const normalizeString = (str) => {
        if (!str || typeof str !== 'string') return '';
        return str.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    };

    const matchesFilter = useCallback((subscription, filterString) => {
        const subType = subscriptionTypes.find(type => type.id === subscription.subscription_type_id);
        const normalizedSubTypeName = subType ? normalizeString(subType.name) : '';
        const normalizedOwnerType = normalizeString(subscription.owner_type);

        const locationFilters = {
            'GRAN VÍA': ['GRAN VIA', 'GRAN VÍA'],
            'CAPITÁN RAMOS': ['CAPITAN RAMOS', 'CAPITÁN RAMOS'],
            'REVELLÍN': ['REVELLIN', 'REVELLÍN'],
            'POLÍGONO 1': ['POLIGONO 1', 'POLÍGONO 1'],
            'POLÍGONO 2': ['POLIGONO 2', 'POLÍGONO 2'],
            'SAN JOSÉ': ['SAN JOSE', 'SAN JOSÉ'],
            'TERRONES ARRIBA': ['TERRONES ARRIBA'],
            'TERRONES ABAJO': ['TERRONES ABAJO'],
        };

        const filterComponents = normalizeString(filterString)
            .match(/\([^)]+\)|\S+/g) || [];

        return filterComponents.every(component => {
            component = component.replace(/^\(|\)$/g, '');

            const locationFilter = Object.entries(locationFilters).find(([key, variants]) =>
                normalizeString(key) === component || variants.includes(component)
            );

            if (locationFilter) {
                return locationFilter[1].some(variant =>
                    normalizedSubTypeName.includes(variant)
                );
            }

            switch (component) {
                case 'AUTORIZADO':
                    return normalizedSubTypeName.includes('AUTORIZADO');
                case '24H':
                    return normalizedSubTypeName.includes('24H');
                case '12H':
                    return normalizedSubTypeName.includes('12H');
                case 'MOTO':
                    return normalizedSubTypeName.includes('MOTO');
                case 'COCHE':
                    return normalizedSubTypeName.includes('COCHE');
                case 'PROPIETARIO':
                    return normalizedOwnerType.includes('PROPIETARIO');
                case 'PROPIETARIO(SERV.DEPASO)':
                case 'PROPIETARIO SERV. DE PASO':
                    return normalizedOwnerType.includes('PROPIETARIO') && normalizedOwnerType.includes('SERV DE PASO');
                default:
                    return normalizedSubTypeName.includes(component) || normalizedOwnerType.includes(component);
            }
        });
    }, [subscriptionTypes]);

    const filteredSubscriptions = useMemo(() => {
        let result = [...subscriptions];

        if (searchTerm.trim() !== '') {
            const lowerSearchTerm = searchTerm.toLowerCase();
            result = result.filter(subscription => {
                const licensePlates = [subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]
                    .filter(Boolean)
                    .join(', ')
                    .toLowerCase();

                return (
                    subscription.owner_id.toString().toLowerCase().includes(lowerSearchTerm) ||
                    licensePlates.includes(lowerSearchTerm)
                );
            });
        }

        if (activeFilters.length > 0) {
            const combinedFilterString = activeFilters.join(' ');
            result = result.filter(subscription => matchesFilter(subscription, combinedFilterString));
        }

        return result;
    }, [activeFilters, searchTerm, subscriptions, matchesFilter]);

    const handleExport = async () => {
        try {
            // Directly receive the Blob from exportSubscriptions
            const blob = await exportSubscriptions(filteredSubscriptions.map(s => s.id), exportFields);

            // Create a URL for the Blob
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'subscriptions_export.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (err) {
            setError('Failed to export subscriptions: ' + err.message);
        }
    };

    const headingTranslation = {
        'id': 'ID',
        'owner_id': 'ID del Propietario',
        'access_card': 'Tarjeta de Acceso',
        'lisence_plate1': 'Placa de Licencia 1',
        'lisence_plate2': 'Placa de Licencia 2',
        'lisence_plate3': 'Placa de Licencia 3',
        'documents': 'Documentos',
        'tique_x_park': 'Tique X Parque',
        'remote_control_number': 'Número de Control Remoto',
        'observations': 'Observaciones',
        'parking_spot': 'Puesto de Estacionamiento',
        'registration_date': 'Fecha de Registro',
        'created_by': 'Creado Por',
        'modified_by': 'Modificado Por',
        'modification_time': 'Hora de Modificación',
        'owner_email': 'Correo Electrónico del Propietario',
        'owner_phone_number': 'Número de Teléfono del Propietario',
        'subscription_type_name': 'Nombre del Tipo de Suscripción',
        'subscription_type_parking_code': 'Código de Estacionamiento'
    };


    const toggleExportField = (field) => {
        setExportFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const filterButtons = [
        'GRAN VÍA',
        'CAPITÁN RAMOS',
        'REVELLÍN',
        'POLÍGONO 1',
        'POLÍGONO 2',
        'SAN JOSÉ',
        'TERRONES ARRIBA',
        'TERRONES ABAJO',
        '24H',
        '12H',
        'AUTORIZADO',
        'PROPIETARIO',
        'PROPIETARIO (SERV. DE PASO)',
        'MOTO',
        'COCHE'
    ];

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

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Subscriptions</h2>
            <Button className="mb-3 me-2" variant="primary" onClick={handleAddNew}>
                Add New Subscription
            </Button>
            <Button className="mb-3" variant="secondary" onClick={() => setShowExportModal(true)}>
                Export Selected
            </Button>

            <Form className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="Search by Owner ID or License Plate"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Form>

            {activeFilters.length > 0 && (
                <div className="mb-3">
                    <span className="me-2">Active Filters:</span>
                    {activeFilters.map((filterName) => (
                        <Badge key={filterName} bg="secondary" className="me-2">
                            {filterName} <Button variant="light" size="sm"
                                                 onClick={() => handleFilter(filterName)}>×</Button>
                        </Badge>
                    ))}
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        Clear All
                    </Button>
                </div>
            )}

            <div className="mb-3">
                {filterButtons.map((filterName) => (
                    <Button
                        key={filterName}
                        className="mb-2 me-2"
                        variant={activeFilters.includes(filterName) ? 'secondary' : 'info'}
                        onClick={() => handleFilter(filterName)}
                    >
                        {filterName}
                    </Button>
                ))}
            </div>

            {loading && (
                <div className="d-flex justify-content-center my-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            )}

            {error && <Alert variant="danger">Error: {error}</Alert>}

            {!loading && !error && (
                filteredSubscriptions.length === 0 ? (
                    <Alert variant="info">No subscriptions available.</Alert>
                ) : (
                    <Table striped bordered hover>
                        <thead>
                        <tr>
                            <th>DNI</th>
                            <th>Name</th>
                            <th>Last Name</th>
                            <th>Subscription Type</th>
                            <th>Email</th>
                            <th>Telephone</th>
                            <th>Observations</th>
                            <th>Registration Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredSubscriptions.map((subscription) => {
                            const subType = subscriptionTypes.find((type) => type.id === subscription.subscription_type_id);
                            const owner = owners[subscription.owner_id] || {};

                            return (
                                <tr
                                    key={subscription.id}
                                    onClick={() => handleRowClick(subscription.id)}
                                    style={{cursor: 'pointer'}}
                                >
                                    <td>{subscription.owner_id}</td>
                                    <td>{owner.first_name || 'Loading...'}</td>
                                    <td>{owner.last_name}</td>
                                    <td>{subType ? subType.name : 'Unknown'}</td>
                                    <td>{owner.email || 'Loading...'}</td>

                                    <td>{owner.phone_number || 'N/A'}</td>
                                    {/*<td>*/}
                                    {/*    {subscription.lisence_plate1}*/}
                                    {/*    {subscription.lisence_plate2 && `, ${subscription.lisence_plate2}`}*/}
                                    {/*    {subscription.lisence_plate3 && `, ${subscription.lisence_plate3}`}*/}
                                    {/*</td>*/}
                                    <td>{subscription.observations}</td>
                                    <td>{formatDate(subscription.registration_date)}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </Table>
                )
            )}

            <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Export Subscriptions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {Object.entries(headingTranslation).map(([field, translation]) => (
                            <Form.Check
                                key={field}
                                type="checkbox"
                                id={`export-${field}`}
                                label={translation}
                                checked={exportFields.includes(field)}
                                onChange={() => toggleExportField(field)}
                            />
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleExport} disabled={exportFields.length === 0}>
                        Export
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SubscriptionList;