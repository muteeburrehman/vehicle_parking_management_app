import React from "react";
import {BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import {Container, Row, Col} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import {AuthProvider} from './context/AuthContext';

import Login from "./components/Login";
import Signup from "./components/Signup";
import CustomNavbar from "./components/NavBar";
import './App.css';
import Sidebar from "./components/Sidebar";
import OwnerRegistration from "./components/OwnerRegistration";
import {OwnerProvider} from "./context/OwnerContext";
import OwnerList from "./components/OwnersList";
import {GetOwnersProvider} from "./context/GetOwnersContext";
import OwnerEditForm from "./components/OwnerEditForm";
import VehicleRegisteration from "./components/VehicleRegisteration";
import ProtectedRoute from "./components/ProtectedRoute";
import VehiclesList from "./components/VehiclesList"
import {VehicleProvider} from "./context/VehicleContext";
import {GetVehiclesProvider} from "./context/GetVehiclesContext";
import VehicleEditForm from "./components/VehicleEditForm";
import AddSubscriptionType from "./components/AddSubscriptionType";
import {SubscriptionTypeProvider} from "./context/SubscriptionTypeContext";
import {SubscriptionProvider} from "./context/SubscriptionContext";
import AddSubscription from "./components/AddSubscription";
import SubscriptionList from "./components/SubscriptionList";
import SubscriptionTypeList from "./components/SubscriptionTypeList";
import EditSubscription from "./components/EditSubscription";
import EditSubscriptionType from "./components/EditSubscriptionType";
import SubscriptionHistoryList from "./components/SubscriptionHistoryList";
import CancellationList from "./components/CancellationList";
import CancellationForm from "./components/CancellationForm";
import AddNewUsers from "./components/AddNewUsers";
import CancellationDetail from "./components/CancellationDetailEdit";
import SubscriptionHistoryDetail from "./components/SubscriptionHistoryDetail";
import OwnerHistoryList from "./components/OwnerHistoryList";
import VehicleHistoryList from "./components/VehicleHistoryList";
import OwnerHistoryDetail from "./components/OwnerHistoryDetail";
import VehicleHistoryDetail from "./components/VehicleHistoryDetail";
import ParkingLotStats from "./components/ParkingLotStats";
import AddParkingLotForm from "./components/AddParkingLotForm";
import ParkingLotList from "./components/ParkingLotList";
import ParkingLotListAndEdit from "./components/ParkingLotListAndEdit";
import ApproveCancellationList from "./components/ApproveCancellationList";
import ApprovedCancellationDetail from "./components/ApprovedCancellationDetail";
import ReducedMobilityList from "./components/ReducedMobilityList";
import LargeFamilyList from "./components/LargeFamilyList";

const NotFound = () => (
    <Container className="mt-5">
        <Row>
            <Col>
                <h1>404 - Page Not Found</h1>
                <p>The page you are looking for does not exist.</p>
            </Col>
        </Row>
    </Container>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App" style={{display: 'flex', height: '100vh'}}>
                    <Sidebar/>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                        <CustomNavbar/>
                        <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
                            <Routes>
                                <Route path="/login" element={<Login/>}/>
                                <Route path="/signup" element={<Signup/>}/>

                                <Route path="/" element={<ProtectedRoute><Navigate to="/owners"/></ProtectedRoute>}/>

                                <Route path="/add-new-user" element={<ProtectedRoute><AddNewUsers/></ProtectedRoute>}/>

                                <Route path="/add-subscription-type" element={
                                    <ProtectedRoute>
                                        <SubscriptionTypeProvider>
                                            <AddSubscriptionType/>
                                        </SubscriptionTypeProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/subscription-list"
                                       element={<ProtectedRoute><SubscriptionList/></ProtectedRoute>}/>
                                <Route path="/subscription-type-list"
                                       element={<ProtectedRoute><SubscriptionTypeList/></ProtectedRoute>}/>
                                <Route path="/owner_histories"
                                       element={<ProtectedRoute><OwnerHistoryList/></ProtectedRoute>}/>
                                <Route path="/vehicle_histories"
                                       element={<ProtectedRoute><VehicleHistoryList/></ProtectedRoute>}/>

                                <Route path="/add-subscription" element={
                                    <ProtectedRoute>
                                        <SubscriptionProvider>
                                            <AddSubscription/>
                                        </SubscriptionProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/subscription/edit/:id" element={
                                    <ProtectedRoute>
                                        <SubscriptionProvider>
                                            <EditSubscription/>
                                        </SubscriptionProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/subscription_types/edit/:id" element={
                                    <ProtectedRoute>
                                        <SubscriptionProvider>
                                            <EditSubscriptionType/>
                                        </SubscriptionProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/subscription_histories"
                                       element={<ProtectedRoute><SubscriptionHistoryList/></ProtectedRoute>}/>
                                <Route path="/subscription-history/:historyId"
                                       element={<ProtectedRoute><SubscriptionHistoryDetail/></ProtectedRoute>}/>
                                <Route path="/owner-history/:historyId"
                                       element={<ProtectedRoute><OwnerHistoryDetail/></ProtectedRoute>}/>
                                <Route path="/vehicle-history/:historyId"
                                       element={<ProtectedRoute><VehicleHistoryDetail/></ProtectedRoute>}/>

                                <Route path="/cancel-subscription"
                                       element={<ProtectedRoute><CancellationForm/></ProtectedRoute>}/>
                                <Route path="/cancel-subscription-list"
                                       element={<ProtectedRoute><CancellationList/></ProtectedRoute>}/>
                                <Route path="/cancellations/:id"
                                       element={<ProtectedRoute><CancellationDetail/></ProtectedRoute>}/>

                                <Route path="/owner/:dni/vehicle-registration" element={
                                    <ProtectedRoute>
                                        <VehicleProvider>
                                            <VehicleRegisteration/>
                                        </VehicleProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/vehicles/" element={
                                    <ProtectedRoute>
                                        <VehicleProvider>
                                            <GetVehiclesProvider>
                                                <VehiclesList/>
                                            </GetVehiclesProvider>
                                        </VehicleProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/vehicle/edit/:lisence_plate" element={
                                    <ProtectedRoute>
                                        <VehicleProvider>
                                            <GetVehiclesProvider>
                                                <VehicleEditForm/>
                                            </GetVehiclesProvider>
                                        </VehicleProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/owner/edit/:dni" element={
                                    <ProtectedRoute>
                                        <OwnerProvider>
                                            <GetOwnersProvider>
                                                <OwnerEditForm/>
                                            </GetOwnersProvider>
                                        </OwnerProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/owners" element={
                                    <ProtectedRoute>
                                        <OwnerProvider>
                                            <GetOwnersProvider>
                                                <OwnerList/>
                                            </GetOwnersProvider>
                                        </OwnerProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/owner-registration" element={
                                    <ProtectedRoute>
                                        <OwnerProvider>
                                            <OwnerRegistration/>
                                        </OwnerProvider>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/parking-lots/add" element={
                                    <ProtectedRoute>
                                        <AddParkingLotForm/>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/parking-lots" element={
                                    <ProtectedRoute>
                                        <ParkingLotList/>
                                    </ProtectedRoute>
                                }/>

                                {/* <Route path="/parking-lot/edit/:id" element={*/}
                                {/*    <ProtectedRoute>*/}
                                {/*        <UpdateParkingLotForm/>*/}
                                {/*    </ProtectedRoute>*/}
                                {/*}/>*/}

                                <Route path="/parking-lot-list" element={
                                    <ProtectedRoute>
                                        <ParkingLotListAndEdit/>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/parking-lot/add" element={
                                    <ProtectedRoute>
                                        <AddParkingLotForm/>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/parking-lot-stats" element={
                                    <ProtectedRoute>
                                        <ParkingLotStats/>
                                    </ProtectedRoute>
                                }/>

                                <Route path="/approved-cancellation-list"
                                       element={<ProtectedRoute><ApproveCancellationList/></ProtectedRoute>}/>

                                <Route
                                    path="/approved-cancellation-detail/:id"
                                    element={<ProtectedRoute><ApprovedCancellationDetail/></ProtectedRoute>}
                                />

                                <Route
                                    path="/owners/reduced-mobility"
                                    element={<ProtectedRoute><ReducedMobilityList/></ProtectedRoute>}
                                />

                                <Route
                                    path="/subscriptions/large-family"
                                    element={<ProtectedRoute><LargeFamilyList/></ProtectedRoute>}
                                />

                                <Route path="*" element={<NotFound/>}/>

                            </Routes>
                        </div>
                    </div>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;