import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../services/auth.js';
import UserDetailsModal from './UserDetailsModal';
import useAuth from '../hooks/useAuth';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersData = await getAllUsers();
            setUsers(usersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleDeleteUser = async (userId) => {
        if (userId === currentUser.id) {
            alert('No puedes eliminar tu propia cuenta');
            return;
        }

        try {
            await deleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
            setDeleteConfirm(null);
        } catch (err) {
            alert('Error al eliminar usuario: ' + err.message);
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setUsers(users.map(user => 
            user.id === updatedUser.id ? updatedUser : user
        ));
        setShowModal(false);
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

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-danger" role="alert">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="row">
                <div className="col-12">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="fas fa-users me-2"></i>
                                Gestión de Usuarios
                            </h4>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Email</th>
                                            <th>Rol</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>
                                                    <span 
                                                        className="text-primary cursor-pointer text-decoration-underline"
                                                        onClick={() => handleUserClick(user)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {user.email}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleUserClick(user)}
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        {user.id !== currentUser.id && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => setDeleteConfirm(user.id)}
                                                                title="Eliminar usuario"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {users.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-muted">No hay usuarios registrados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar Eliminación</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setDeleteConfirm(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Estás seguro de que deseas eliminar este usuario?</p>
                                <p className="text-danger">
                                    <strong>Esta acción no se puede deshacer.</strong>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setDeleteConfirm(null)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={() => handleDeleteUser(deleteConfirm)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showModal && selectedUser && (
                <UserDetailsModal 
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                    onUserUpdate={handleUserUpdate}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default UsersList;
