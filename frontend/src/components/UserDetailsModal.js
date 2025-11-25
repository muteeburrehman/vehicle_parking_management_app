import React, { useState } from 'react';
import { updateUser } from '../services/auth.js';

const UserDetailsModal = ({ user, onClose, onUserUpdate, currentUser }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        email: user.email,
        role: user.role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (user.id === currentUser.id && formData.role !== currentUser.role) {
            setError('No puedes cambiar tu propio rol');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const updatedUser = await updateUser(user.id, formData);
            onUserUpdate(updatedUser);
            setEditMode(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            email: user.email,
            role: user.role
        });
        setEditMode(false);
        setError(null);
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'superuser':
                return 'bg-danger text-white';
            case 'admin':
                return 'bg-warning text-dark';
            default:
                return 'bg-secondary text-white';
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="fas fa-user me-2"></i>
                            Detalles del Usuario
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose}
                        ></button>
                    </div>
                    
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">ID de Usuario</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={user.id} 
                                            disabled 
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Estado</label>
                                        <div className="form-control d-flex align-items-center">
                                            <span className="badge bg-success">Activo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                {editMode ? (
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                ) : (
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={user.email} 
                                        disabled 
                                    />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Rol</label>
                                {editMode ? (
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        disabled={user.id === currentUser.id}
                                    >
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                        <option value="superuser">Super Usuario</option>
                                    </select>
                                ) : (
                                    <div className="form-control d-flex align-items-center">
                                        <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                            {user.role === 'superuser' ? 'Super Usuario' : 
                                             user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                        </span>
                                    </div>
                                )}
                                {user.id === currentUser.id && editMode && (
                                    <small className="text-muted">
                                        No puedes cambiar tu propio rol
                                    </small>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Fecha de Registro</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={new Date().toLocaleDateString('es-ES')} 
                                    disabled 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {editMode ? (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save me-2"></i>
                                            Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={onClose}
                                >
                                    Cerrar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={() => setEditMode(true)}
                                >
                                    <i className="fas fa-edit me-2"></i>
                                    Editar Usuario
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
