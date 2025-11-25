import React, {useEffect, useState, useMemo, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {getSubscriptions, getSubscriptionTypes, exportSubscriptions} from '../services/subscriptionService';
import {fetchOwnerByDNI} from "../services/getOwnerService";
import './SubscriptionList.css';

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
    const [exportLoading, setExportLoading] = useState(false);
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
                subs.forEach(sub => fetchOwnerInfo(sub.owner_id));
            } catch (err) {
                setError(err.message);
                console.error("Error fetching subscriptions or types:", err);
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
                    return normalizedSubTypeName.includes('MOTOS');
                case 'COCHE':
                    return (normalizedSubTypeName.includes('24H') || normalizedSubTypeName.includes('12H'))
                        && !normalizedSubTypeName.includes('MOTOS');
                case 'PROPIETARIO':
                    return normalizedOwnerType.includes('PROPIETARIO');
                case 'PROPIETARIO(SERV.DEPASO)':
                case 'PROPIETARIO SERV. DE PASO':
                    return normalizedOwnerType.includes('PROPIETARIO') && normalizedOwnerType.includes('SERV DE PASO');
                case 'TRASTERO':
                    return normalizedSubTypeName.includes('TRASTERO');
                case 'CONVENIO/FAM.NUM.':
                case 'CONVENIO/FAM.NUM':
                    return normalizedSubTypeName.includes('CONVENIO') || 
                           normalizedSubTypeName.includes('FAM NUM') || 
                           normalizedSubTypeName.includes('FAMILIA NUMEROSA');
                case 'JUBILADO':
                    return normalizedSubTypeName.includes('JUBILADO');
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
                const owner = owners[subscription.owner_id] || {};
                const licensePlates = [subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]
                    .filter(Boolean)
                    .join(', ')
                    .toLowerCase();

                return (
                    subscription.owner_id.toString().toLowerCase().includes(lowerSearchTerm) ||
                    licensePlates.includes(lowerSearchTerm) ||
                    (owner.first_name || '').toLowerCase().includes(lowerSearchTerm) ||
                    (owner.last_name || '').toLowerCase().includes(lowerSearchTerm)
                );
            });
        }

        if (activeFilters.length > 0) {
            const combinedFilterString = activeFilters.join(' ');
            result = result.filter(subscription => matchesFilter(subscription, combinedFilterString));
        }

        return result;
    }, [activeFilters, searchTerm, subscriptions, matchesFilter, owners]);

    const handleExport = async () => {
        if (exportFields.length === 0) {
            setError("Por favor, seleccione al menos un campo para exportar.");
            return;
        }

        try {
            setExportLoading(true);
            const blob = await exportSubscriptions(filteredSubscriptions.map(s => s.id), exportFields);
            
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'subscriptions_export.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                setShowExportModal(false);
                setExportFields([]);
                setError(null);
            } else {
                setError('Falló la exportación de abonos: No se recibieron datos.');
            }
        } catch (err) {
            console.error('Error al exportar abonos:', err);
            setError('Falló la exportación de abonos: ' + (err.message || 'Ocurrió un error desconocido.'));
        } finally {
            setExportLoading(false);
        }
    };

    const headingTranslation = {
        'id': 'ID',
        'owner_id': 'DNI',
        'access_card': 'Nº de Tarjeta',
        'lisence_plate1': 'Matrícula 1',
        'lisence_plate2': 'Matrícula 2',
        'lisence_plate3': 'Matrícula 3',
        'documents': 'Documentos',
        'tique_x_park': 'TiqueXPARK',
        'remote_control_number': 'Número de Mando',
        'observations': 'Observaciones',
        'parking_spot': 'Plaza de Aparcamiento',
        'registration_date': 'Fecha de Registro',
        'created_by': 'Creado Por',
        'modified_by': 'Modificado Por',
        'modification_time': 'Hora de Modificación',
        'owner_email': 'Correo Electrónico del Propietario',
        'owner_phone_number': 'Número de Teléfono del Propietario',
        'subscription_type_name': 'Nombre del Tipo de Abono',
        'subscription_type_parking_code': 'Código SAGE abono',
        'large_family_expiration': 'Vencimiento Familia Numerosa'
    };

    const toggleExportField = (field) => {
        setExportFields(prev => {
            return prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field];
        });
    };

    const handleSelectAll = () => {
        const allFields = Object.keys(headingTranslation);
        setExportFields(exportFields.length === allFields.length ? [] : allFields);
    };

    const openExportModal = () => {
        setShowExportModal(true);
        setError(null);
        setExportFields([]);
    };

    const closeExportModal = () => {
        setShowExportModal(false);
        setExportFields([]);
        setError(null);
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
        'COCHE',
        'TRASTERO',
        'CONVENIO/FAM.NUM.',
        'JUBILADO'
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
        <div className="subscription-container">
            <h2 className="page-title">Abonos</h2>

            <div className="action-buttons">
                <button className="btn primary" onClick={handleAddNew}>
                    Añadir Nuevo Abono
                </button>
                <button 
                    className="btn secondary" 
                    onClick={openExportModal}
                    disabled={filteredSubscriptions.length === 0}
                >
                    Exportar a Excel ({filteredSubscriptions.length} registros)
                </button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Buscar por DNI, Nombre, Apellidos o Matrícula"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {activeFilters.length > 0 && (
                <div className="active-filters">
                    <span>Filtros Activos:</span>
                    <div className="filter-badges">
                        {activeFilters.map((filterName) => (
                            <span key={filterName} className="filter-badge">
                                {filterName}
                                <button className="remove-filter" onClick={() => handleFilter(filterName)}>×</button>
                            </span>
                        ))}
                        <button className="clear-filters" onClick={clearFilters}>
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            )}

            <div className="filter-buttons">
                {filterButtons.map((filterName) => (
                    <button
                        key={filterName}
                        className={`filter-btn ${activeFilters.includes(filterName) ? 'active' : ''}`}
                        onClick={() => handleFilter(filterName)}
                    >
                        {filterName}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span className="sr-only">Loading...</span>
                </div>
            )}

            {error && <div className="error-message">Error: {error}</div>}

            {!loading && !error && (
                filteredSubscriptions.length === 0 ? (
                    <div className="info-message">No hay Abonos Disponibles.</div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {['DNI', 'Nombre', 'Apellidos', 'Tipo de Abono', 'Matriculas', 'Email', 'Tlf', 'Observaciones', 'Fecha de Registro'].map((header) => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubscriptions.map((subscription) => {
                                    const subType = subscriptionTypes.find((type) => type.id === subscription.subscription_type_id);
                                    const owner = owners[subscription.owner_id] || {};

                                    return (
                                        <tr key={subscription.id} onClick={() => handleRowClick(subscription.id)}>
                                            <td>{subscription.owner_id}</td>
                                            <td>{owner.first_name || 'Loading...'}</td>
                                            <td>{owner.last_name}</td>
                                            <td>{subType ? subType.name : 'Unknown'}</td>
                                            <td>
                                                {[subscription.lisence_plate1, subscription.lisence_plate2, subscription.lisence_plate3]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </td>
                                            <td>{owner.email || 'Loading...'}</td>
                                            <td>{owner.phone_number || 'N/A'}</td>
                                            <td>{subscription.observations}</td>
                                            <td>{formatDate(subscription.registration_date)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={closeExportModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modal-header">
                            <h3 className="modal-title">
                                📊 Exportar a Excel
                            </h3>
                            <button 
                                onClick={closeExportModal}
                                className="modal-close-btn"
                                aria-label="Cerrar modal"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="modal-body">
                            <div className="export-info">
                                <p>📄 <strong>{filteredSubscriptions.length}</strong> registros serán exportados</p>
                                <p>✅ Selecciona los campos que deseas incluir en el archivo Excel:</p>
                            </div>

                            <div className="select-all-container">
                                <button 
                                    onClick={handleSelectAll}
                                    className="select-all-btn"
                                >
                                    {exportFields.length === Object.keys(headingTranslation).length 
                                        ? '❌ Deseleccionar todo' 
                                        : '✅ Seleccionar todo'
                                    }
                                </button>
                                <span className="selected-count">
                                    {exportFields.length} de {Object.keys(headingTranslation).length} campos seleccionados
                                </span>
                            </div>
                            
                            <div className="export-fields-grid">
                                {Object.entries(headingTranslation).map(([field, translation]) => (
                                    <label key={field} className={`field-checkbox ${exportFields.includes(field) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={exportFields.includes(field)}
                                            onChange={() => toggleExportField(field)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="field-name">{translation}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="modal-footer">
                            <button 
                                onClick={closeExportModal}
                                className="btn-secondary"
                                disabled={exportLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exportFields.length === 0 || exportLoading}
                                className="btn-primary"
                            >
                                {exportLoading ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Exportando...
                                    </>
                                ) : (
                                    <>
                                        📥 Exportar ({exportFields.length} campos)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionList;
