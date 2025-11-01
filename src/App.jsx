import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // REQUIRED

import Login from './components/login/login';
import Store from './components/store/Store';
import Procurements from './components/procurements/Procurements';
import Program from './components/program/Program';
import AccountsAndFinance from './components/accounts_and_finance/AccountsAndFinance';
import AdminDashboard from './components/admin/dashboard/doughnut_charts/AdminDashboard';
import CreateUser from './components/admin/user/CreateUser';
import UpdateUser from './components/admin/user/UpdateUser';
import UserList from './components/admin/user/UserList';
import ProtectedRoute, { ProtectedRoutes } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { InKindItemsProvider } from './context/InKindItemsContext';
import Sidebar from './components/common/Sidebar/Sidebar';
import UserView from './components/admin/user/UserView';
import ApplicationReportsList from './components/program/applications_report/application_reports_list';
import CreateApplicationReport from './components/program/applications_report/create_application_report';
import UpdateApplicationReport from './components/program/applications_report/update_application_report';
import ViewApplicationReport from './components/program/applications_report/view_application_report';
import AddRationReport from './components/program/ration_report/add';
import RationReportList from './components/program/ration_report/list';
import ViewRationReport from './components/program/ration_report/view';
import UpdateRationReport from './components/program/ration_report/update';
import AddMarriageGiftsReport from './components/program/marriage_gifts/reports/add';
import MarriageGiftsList from './components/program/marriage_gifts/reports/list';
import UpdateMarriageGiftsReport from './components/program/marriage_gifts/reports/update';
import ViewMarriageGiftsReport from './components/program/marriage_gifts/reports/view';
import AddFinancialAssistanceReport from './components/program/financial_assistance/reports/add';
import FinancialAssistanceList from './components/program/financial_assistance/reports/list';
import UpdateFinancialAssistanceReport from './components/program/financial_assistance/reports/update';
import ViewFinancialAssistanceReport from './components/program/financial_assistance/reports/view';
import AddSewingMachineReport from './components/program/sewing_machine/reports/add';
import SewingMachineList from './components/program/sewing_machine/reports/list';
import UpdateSewingMachineReport from './components/program/sewing_machine/reports/update';
import ViewSewingMachineReport from './components/program/sewing_machine/reports/view';
import AddWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/add';
import WheelChairOrCrutchesList from './components/program/wheel_chair_or_crutches/reports/list';
import UpdateWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/update';
import ViewWheelChairOrCrutchesReport from './components/program/wheel_chair_or_crutches/reports/view';
import AddWaterReport from './components/program/water/reports/add';
import WaterReportsList from './components/program/water/reports/list';
import UpdateWaterReport from './components/program/water/reports/update';
import ViewWaterReport from './components/program/water/reports/view';
import AddKasbReport from './components/program/kasb/reports/add';
import KasbReportsList from './components/program/kasb/reports/list';
import UpdateKasbReport from './components/program/kasb/reports/update';
import ViewKasbReport from './components/program/kasb/reports/view';
import AddKasbTrainingReport from './components/program/kasb_training/reports/add/AddKasbTrainingReport';
import ListKasbTrainingReports from './components/program/kasb_training/reports/list/ListKasbTrainingReports';
import UpdateKasbTrainingReport from './components/program/kasb_training/reports/update/UpdateKasbTrainingReport';
import ViewKasbTrainingReport from './components/program/kasb_training/reports/view/ViewKasbTrainingReport';
import AddEducationReport from './components/program/education/reports/add';
import ListEducationReports from './components/program/education/reports/list';
import UpdateEducationReport from './components/program/education/reports/update';
import ViewEducationReport from './components/program/education/reports/view';
// Tree Plantation Report Components
import AddTreePlantationReport from './components/program/tree_plantation/reports/add';
import TreePlantationReportsList from './components/program/tree_plantation/reports/list';
import UpdateTreePlantationReport from './components/program/tree_plantation/reports/update';
import ViewTreePlantationReport from './components/program/tree_plantation/reports/view';
// Area Ration Report Components
import AddAreaRationReport from './components/program/area_ration/reports/add';
import AreaRationReportsList from './components/program/area_ration/reports/list';
import UpdateAreaRationReport from './components/program/area_ration/reports/update';
import ViewAreaRationReport from './components/program/area_ration/reports/view';
// Store Report Components
import AddStoreReport from './components/store/reports/add';
import StoreReportsList from './components/store/reports/list';
import UpdateStoreReport from './components/store/reports/update';
import ViewStoreReport from './components/store/reports/view';
import AddProcurementReport from './components/procurements/reports/add';
import ProcurementReportsList from './components/procurements/reports/list';
import UpdateProcurementReport from './components/procurements/reports/update';
import ViewProcurementReport from './components/procurements/reports/view';
// Accounts & Finance Report Components
import AddAccountsAndFinanceReport from './components/accounts_and_finance/reports/add';
import AccountsAndFinanceReportsList from './components/accounts_and_finance/reports/list';
import UpdateAccountsAndFinanceReport from './components/accounts_and_finance/reports/update';
import ViewAccountsAndFinanceReport from './components/accounts_and_finance/reports/view';
import './App.css';
import TargetsList from './components/program/targets/reports/list';
import AddTarget from './components/program/targets/reports/add';
import UpdateTarget from './components/program/targets/reports/update';
import ViewTarget from './components/program/targets/reports/view';
import AdminApplicationsList from './components/admin/hr/career/applications/list';
import AdminApplicationView from './components/admin/hr/career/applications/view';
import { OnlineDonationsList, ViewOnlineDonation } from './components/dms/donations/online_donations/index';
import { DonorsList, RegisterDonor, ViewDonor } from './components/dms';
import AddDonation from './components/donations/online_donations/add';
import AddDonationBox from './components/dms/donation_box/add';
import DonationBoxList from './components/dms/donation_box/list';
import ViewDonationBox from './components/dms/donation_box/view';
import AddDonationBoxDonation from './components/dms/donations/donation_box/add';
import DonationBoxDonationsList from './components/dms/donations/donation_box/list';
import ViewDonationBoxDonation from './components/dms/donations/donation_box/view';
import FundRaising from './components/dms/fund_raising';
import AddInKindItem from './components/dms/in_kind/in_kind_items/add';
import InKindItemsList from './components/dms/in_kind/in_kind_items/list';
import EditInKindItem from './components/dms/in_kind/in_kind_items/edit';
import ViewInKindItem from './components/dms/in_kind/in_kind_items/view';

const App = () => {
  return (<React.Fragment>
            <Router> 
              <AuthProvider>
                <InKindItemsProvider>
                <div className="app-container">
                  {/* Sidebar - only show on protected routes */}
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route
                      path="/*"
                      element={
                          <div className="app-layout">
                            <Sidebar />
                            <main className="app-main">
                              <Routes>
                                {/* Main Dashboard Routes */}
                                <Route path="/store" element={<Store />} />
                                <Route path="/procurements" element={<Procurements />} />
                                <Route path="/program" element={<Program />} />
                                <Route path="/accounts_and_finance" element={<AccountsAndFinance />} />
                                <Route path="/admin" element={<AdminDashboard />} />

                                {/* User Management Routes */}
                                <Route path="/admin/users" element={<UserList />} />
                                <Route path="/admin/users/create" element={<CreateUser />} />
                                <Route path="/admin/users/edit/:id" element={<UpdateUser />} />
                                <Route path="/users/:id" element={<UserView />} />
                                
                                {/* Store Report Routes - Nested under /store */}
                                <Route path="/store/reports/add" element={<AddStoreReport />} />
                                <Route path="/store/reports/list" element={<StoreReportsList />} />
                                <Route path="/store/reports/update/:id" element={<UpdateStoreReport />} />
                                <Route path="/store/reports/view/:id" element={<ViewStoreReport />} />
                                
                                {/* Applications Report Routes - Nested under /program */}
                                <Route path="/program/applications_reports" element={<ApplicationReportsList />} />
                                <Route path="/program/applications_reports/add" element={<CreateApplicationReport />} />
                                <Route path="/program/applications_reports/edit_application_report/:id" element={<UpdateApplicationReport />} />
                                <Route path="/program/applications_reports/view_application_report/:id" element={<ViewApplicationReport />} />
                                
                                {/* Ration Report Routes - Nested under /program */}
                                <Route path="/program/ration_report/add" element={<AddRationReport />} />
                                <Route path="/program/ration_report/list" element={<RationReportList />} />
                                <Route path="/program/ration_report/view/:id" element={<ViewRationReport />} />
                                <Route path="/program/ration_report/update/:id" element={<UpdateRationReport />} />
                                
                                {/* Marriage Gifts Report Routes - Nested under /program */}
                                <Route path="/program/marriage_gifts/reports/add" element={<AddMarriageGiftsReport />} />
                                <Route path="/program/marriage_gifts/reports/list" element={<MarriageGiftsList />} />
                                <Route path="/program/marriage_gifts/reports/update/:id" element={<UpdateMarriageGiftsReport />} />
                                <Route path="/program/marriage_gifts/reports/view/:id" element={<ViewMarriageGiftsReport />} />
                                
                                {/* Financial Assistance Reports */}
                                <Route path="/program/financial_assistance/reports/add" element={<AddFinancialAssistanceReport />} />
                                <Route path="/program/financial_assistance/reports/list" element={<FinancialAssistanceList />} />
                                <Route path="/program/financial_assistance/reports/update/:id" element={<UpdateFinancialAssistanceReport />} />
                                <Route path="/program/financial_assistance/reports/view/:id" element={<ViewFinancialAssistanceReport />} />

                                {/* Sewing Machine Reports */}
                                <Route path="/program/sewing_machine/reports/add" element={<AddSewingMachineReport />} />
                                <Route path="/program/sewing_machine/reports/list" element={<SewingMachineList />} />
                                <Route path="/program/sewing_machine/reports/update/:id" element={<UpdateSewingMachineReport />} />
                                <Route path="/program/sewing_machine/reports/view/:id" element={<ViewSewingMachineReport />} />

                                {/* Wheel Chair or Crutches Reports */}
                                <Route path="/program/wheel_chair_or_crutches/reports/add" element={<AddWheelChairOrCrutchesReport />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/list" element={<WheelChairOrCrutchesList />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/update/:id" element={<UpdateWheelChairOrCrutchesReport />} />
                                <Route path="/program/wheel_chair_or_crutches/reports/view/:id" element={<ViewWheelChairOrCrutchesReport />} />

                                {/* Water Reports */}
                                <Route path="/program/water/reports/add" element={<AddWaterReport />} />
                                <Route path="/program/water/reports/list" element={<WaterReportsList />} />
                                <Route path="/program/water/reports/update/:id" element={<UpdateWaterReport />} />
                                <Route path="/program/water/reports/view/:id" element={<ViewWaterReport />} />

                                {/* Kasb Reports */}
                                <Route path="/program/kasb/reports/add" element={<AddKasbReport />} />
                                <Route path="/program/kasb/reports/list" element={<KasbReportsList />} />
                                <Route path="/program/kasb/reports/update/:id" element={<UpdateKasbReport />} />
                                <Route path="/program/kasb/reports/view/:id" element={<ViewKasbReport />} />

                                {/* Kasb Training Reports */}
                                <Route path="/program/kasb-training/reports" element={<ListKasbTrainingReports />} />
                                <Route path="/program/kasb-training/reports/add" element={<AddKasbTrainingReport />} />
                                <Route path="/program/kasb-training/reports/update/:id" element={<UpdateKasbTrainingReport />} />
                                <Route path="/program/kasb-training/reports/view/:id" element={<ViewKasbTrainingReport />} />

                                {/* Education Reports */}
                                <Route path="/program/education/reports/list" element={<ListEducationReports />} />
                                <Route path="/program/education/reports/add" element={<AddEducationReport />} />
                                <Route path="/program/education/reports/update/:id" element={<UpdateEducationReport />} />
                                <Route path="/program/education/reports/view/:id" element={<ViewEducationReport />} />

                                {/* Tree Plantation Reports */}
                                <Route path="/program/tree_plantation/reports/add" element={<AddTreePlantationReport />} />
                                <Route path="/program/tree_plantation/reports/list" element={<TreePlantationReportsList />} />
                                <Route path="/program/tree_plantation/reports/update/:id" element={<UpdateTreePlantationReport />} />
                                <Route path="/program/tree_plantation/reports/view/:id" element={<ViewTreePlantationReport />} />

                                {/* Area Ration Reports */}
                                <Route path="/program/area_ration/reports/add" element={<AddAreaRationReport />} />
                                <Route path="/program/area_ration/reports/list" element={<AreaRationReportsList />} />
                                <Route path="/program/area_ration/reports/update/:id" element={<UpdateAreaRationReport />} />
                                <Route path="/program/area_ration/reports/view/:id" element={<ViewAreaRationReport />} />

                                {/* Procurements Report Routes - Nested under /procurements */}
                                <Route path="/procurements/reports/add" element={<AddProcurementReport />} />
                                <Route path="/procurements/reports/list" element={<ProcurementReportsList />} />
                                <Route path="/procurements/reports/update/:id" element={<UpdateProcurementReport />} />
                                <Route path="/procurements/reports/view/:id" element={<ViewProcurementReport />} />

                                {/* Accounts & Finance Report Routes - Nested under /accounts_and_finance */}
                                <Route path="/accounts_and_finance/reports/add" element={<AddAccountsAndFinanceReport />} />
                                <Route path="/accounts_and_finance/reports/list" element={<AccountsAndFinanceReportsList />} />
                                <Route path="/accounts_and_finance/reports/update/:id" element={<UpdateAccountsAndFinanceReport />} />
                                <Route path="/accounts_and_finance/reports/view/:id" element={<ViewAccountsAndFinanceReport />} />

                                {/* Targets Routes */}
                                <Route path="/program/targets/reports/list" element={<TargetsList />} />
                                <Route path="/program/targets/reports/add" element={<AddTarget />} />
                                <Route path="/program/targets/reports/update/:id" element={<UpdateTarget />} />
                                <Route path="/program/targets/reports/view/:id" element={<ViewTarget />} />   

                                {/* HR */}
                                <Route path="/hr/career/applications/list" element={<AdminApplicationsList />} />
                                <Route path="/hr/career/applications/view/:id" element={<AdminApplicationView />} />
                                
                                {/* Fund Raising Welcome */}
                                <Route path="/fund_raising" element={<FundRaising />} /> 
                                {/* DMS Section Routes */}
                                <Route path="/dms/donation_box/add" element={<AddDonationBox />} />
                                <Route path="/dms/donation_box/list" element={<DonationBoxList />} />
                                <Route path="/dms/donation_box/view/:id" element={<ViewDonationBox />} />
                                <Route path="/dms/donation-box-donations/add" element={<AddDonationBoxDonation />} />
                                <Route path="/dms/donation-box-donations/add/:id" element={<AddDonationBoxDonation />} />
                                <Route path="/dms/donation-box-donations/list" element={<DonationBoxDonationsList />} />
                                <Route path="/dms/donation-box-donations/list/:id" element={<DonationBoxDonationsList />} />
                                <Route path="/dms/donation-box-donations/view/:id" element={<ViewDonationBoxDonation />} />
                            
                                <Route path="/dms/donation_box/view/:id" element={<ViewDonationBox />} />
                                
                                {/* Donations Routes */}
                                <Route path="/donations/online_donations/list" element={<OnlineDonationsList />} />
                                <Route path="/donations/online_donations/view/:id" element={<ViewOnlineDonation />} />
                                <Route path="/donations/online_donations/add" element={<AddDonation />} /> 
                                
                                {/* Donors Routes */}
                                <Route path="/dms/donors/list" element={<DonorsList />} /> 
                                <Route path="/dms/donors/view/:id" element={<ViewDonor />} />
                                <Route path="/dms/donors/add" element={<RegisterDonor />} />
                                {/* <Route path="/donors/update/:id" element={<UpdateDonor />} /> */}
                                {/* In-Kind Items Routes */}
                                <Route path="/dms/in-kind-items/list" element={<InKindItemsList />} />
                                <Route path="/dms/in-kind-items/add" element={<AddInKindItem />} />
                                <Route path="/dms/in-kind-items/edit/:id" element={<EditInKindItem />} />
                                <Route path="/dms/in-kind-items/view/:id" element={<ViewInKindItem />} />
                              </Routes>
                            </main>
                          </div>
                      }
                    />
                  </Routes>
                </div>
              </InKindItemsProvider>
            </AuthProvider>
            </Router>
            <ToastContainer />
          </React.Fragment>
           );
};

export default App;