import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import MainLayout from '../components/layout/MainLayout'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Login                    = lazy(() => import('../pages/auth/Login'))
const Dashboard                = lazy(() => import('../pages/dashboard/Dashboard'))
const Shipments                = lazy(() => import('../pages/shipments/Shipments'))
const ShipmentDetail           = lazy(() => import('../pages/shipments/ShipmentDetail'))
const CreateShipment           = lazy(() => import('../pages/shipments/CreateShipment'))
const IntlShipmentList         = lazy(() => import('../pages/shipments/IntlShipmentList'))
const IntlShipmentCreate       = lazy(() => import('../pages/shipments/IntlShipmentCreate'))
const LocalShipmentList        = lazy(() => import('../pages/shipments/LocalShipmentList'))
const LocalShipmentCreate      = lazy(() => import('../pages/shipments/LocalShipmentCreate'))
const Logistics                = lazy(() => import('../pages/logistics/Logistics'))
const Accounts                 = lazy(() => import('../pages/accounts/Accounts'))
const InventoryMaster          = lazy(() => import('../pages/inventory/InventoryMaster'))
const LogisticsDetail          = lazy(() => import('../pages/logistics/LogisticsDetail'))
const LocationMaster           = lazy(() => import('../pages/master/LocationMaster'))
const ShipmentProfile          = lazy(() => import('../pages/shipments/ShipmentProfile'))
const LocalShipmentProfile     = lazy(() => import('../pages/shipments/LocalShipmentProfile'))
const IntlShipmentProfile      = lazy(() => import('../pages/shipments/IntlShipmentProfile'))
const ShipmentTracking         = lazy(() => import('../pages/shipments/ShipmentTracking'))
const ShipmentCalendar         = lazy(() => import('../pages/shipments/ShipmentCalendar'))
const ShipmentSuccess          = lazy(() => import('../pages/shipments/ShipmentSuccess'))
const LocalOperations          = lazy(() => import('../pages/localOps/LocalOperations'))
const InternationalOperations  = lazy(() => import('../pages/internationalOps/InternationalOperations'))
const WorkflowEngine           = lazy(() => import('../pages/workflow/WorkflowEngine'))
const WorkflowBuilder          = lazy(() => import('../pages/workflow/WorkflowBuilder'))
const WorkflowList             = lazy(() => import('../pages/workflow/WorkflowList'))
const WorkflowDesigner         = lazy(() => import('../pages/workflow/WorkflowDesigner'))
const WorkflowRequests         = lazy(() => import('../pages/workflow/WorkflowRequests'))
const ProjectClosure           = lazy(() => import('../pages/workflow/ProjectClosure'))
const FleetManagement          = lazy(() => import('../pages/fleet/FleetManagement'))
const Drivers                  = lazy(() => import('../pages/drivers/Drivers'))
const Maintenance               = lazy(() => import('../pages/maintenance/Maintenance'))
const Warehouse                = lazy(() => import('../pages/warehouse/Warehouse'))
const Incidents                = lazy(() => import('../pages/incidents/Incidents'))
const RoutePlanning            = lazy(() => import('../pages/routes/RoutePlanning'))
const UserList                 = lazy(() => import('../pages/users/UserList'))
const UserCreate               = lazy(() => import('../pages/users/UserCreate'))
const RoleList                 = lazy(() => import('../pages/roles/RoleList'))
const RoleCreate               = lazy(() => import('../pages/roles/RoleCreate'))
const RoleAudit                = lazy(() => import('../pages/roles/RoleAudit'))
const RoleMasterCanvas         = lazy(() => import('../pages/roles/RoleMasterCanvas'))
const Settings                 = lazy(() => import('../pages/settings/Settings'))
const AIAnalytics              = lazy(() => import('../pages/analytics/AIAnalytics'))
const VendorMaster             = lazy(() => import('../pages/vendors/VendorMaster'))
const VendorDetail             = lazy(() => import('../pages/vendors/VendorDetail'))
const VendorMaintenance        = lazy(() => import('../pages/vendors/VendorMaintenance'))
const GlobalPartners           = lazy(() => import('../pages/vendors/GlobalPartners'))
const VendorSLA                = lazy(() => import('../pages/vendors/VendorSLA'))
const VendorSLAHeatmap         = lazy(() => import('../pages/vendors/VendorSLAHeatmap'))
const VendorList               = lazy(() => import('../pages/vendors/VendorList'))
const VendorCreate             = lazy(() => import('../pages/vendors/VendorCreate'))
const VendorProfile            = lazy(() => import('../pages/vendors/VendorProfile'))
const VendorRecommendation     = lazy(() => import('../pages/vendors/VendorExtras').then(m => ({ default: m.VendorRecommendation })))
const ProjectList              = lazy(() => import('../pages/projects/ProjectList'))
const ProjectCreate            = lazy(() => import('../pages/projects/ProjectCreate'))
const ProjectDetail            = lazy(() => import('../pages/projects/ProjectDetail'))
const AuditLogs                = lazy(() => import('../pages/audit/AuditLogs'))
const Reports                  = lazy(() => import('../pages/reports/Reports'))

// ── Fallback spinner while chunks load ───────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
)

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />

          {/* ── Authenticated (wrapped in MainLayout) ─────────────────── */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            {/* Default redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* OPERATIONS */}
            <Route path="dashboard"               element={<Dashboard />} />
            <Route path="shipments"               element={<Shipments />} />
            <Route path="shipments/create"          element={<CreateShipment />} />
            <Route path="shipments/:id"             element={<ShipmentDetail />} />
            {/* Shipment Module v2 — International + Local with multi-stop routes */}
            <Route path="logistics"                    element={<Logistics />} />
            <Route path="accounts"                     element={<Accounts />} />
            <Route path="inventory"                    element={<InventoryMaster />} />
            <Route path="logistics/:id"                element={<LogisticsDetail />} />
            <Route path="locations"                    element={<LocationMaster />} />
            <Route path="shipments/intl"               element={<IntlShipmentList />} />
            <Route path="shipments/intl/create"        element={<IntlShipmentCreate />} />
            <Route path="shipments/intl/:id"           element={<IntlShipmentProfile />} />
            <Route path="shipments/intl/edit/:id"       element={<IntlShipmentCreate />} />
            <Route path="shipments/local"              element={<LocalShipmentList />} />
            <Route path="shipments/local/create"       element={<LocalShipmentCreate />} />
            <Route path="shipments/local/:id"          element={<LocalShipmentProfile />} />
            <Route path="shipments/local/:id/edit"     element={<LocalShipmentCreate />} />
            <Route path="tracking"                     element={<ShipmentTracking />} />
            <Route path="shipment-calendar"            element={<ShipmentCalendar />} />
            <Route path="shipments/:kind/:id/success"  element={<ShipmentSuccess />} />
            <Route path="local-operations"        element={<LocalOperations />} />
            <Route path="international-operations" element={<InternationalOperations />} />

            {/* RESOURCES */}
            <Route path="workflow"              element={<WorkflowEngine />} />
            <Route path="workflow/builder/create" element={<WorkflowBuilder />} />
            <Route path="workflow/builder/:id"    element={<WorkflowBuilder />} />
            {/* Workflow Module v2 */}
            <Route path="workflows"                 element={<WorkflowList />} />
            <Route path="workflows/create"          element={<WorkflowDesigner />} />
            <Route path="workflows/:id"             element={<WorkflowDesigner />} />
            <Route path="workflows/:id/edit"        element={<WorkflowDesigner />} />
            <Route path="workflows/requests"        element={<WorkflowRequests />} />
            <Route path="projects/:id/closure"      element={<ProjectClosure />} />
            <Route path="closure-review/:id"        element={<ProjectClosure />} />
            <Route path="fleet"        element={<FleetManagement />} />
            <Route path="drivers"      element={<Drivers />} />
            <Route path="maintenance"  element={<Maintenance />} />
            <Route path="warehouse"    element={<Warehouse />} />
            <Route path="incidents"   element={<Incidents />} />
            <Route path="routes"      element={<RoutePlanning />} />

            {/* ADMINISTRATION (admin/manager only) */}
            <Route
              path="users"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <UserList />
                </PrivateRoute>
              }
            />
            <Route
              path="users/create"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <UserCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="users/:id/edit"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <UserCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <UserList />
                </PrivateRoute>
              }
            />
            <Route path="roles"            element={<PrivateRoute roles={['admin']}><RoleMasterCanvas /></PrivateRoute>} />
            <Route path="roles/audit"      element={<PrivateRoute roles={['admin']}><RoleAudit /></PrivateRoute>} />
            <Route path="roles/legacy"     element={<PrivateRoute roles={['admin']}><RoleList /></PrivateRoute>} />
            <Route path="roles/create"     element={<PrivateRoute roles={['admin']}><RoleCreate /></PrivateRoute>} />
            <Route path="roles/:id"        element={<PrivateRoute roles={['admin']}><RoleCreate /></PrivateRoute>} />
            <Route path="roles/:id/edit"   element={<PrivateRoute roles={['admin']}><RoleCreate /></PrivateRoute>} />
            <Route path="settings"   element={<Settings />} />
            <Route
              path="audit-logs"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <AuditLogs />
                </PrivateRoute>
              }
            />
            <Route path="reports" element={<Reports />} />
            <Route path="ai-analytics"        element={<AIAnalytics />} />
            <Route path="vendors"              element={<VendorMaster />} />
            <Route path="vendors/:id"          element={<VendorDetail />} />
            <Route path="vendors-v2"           element={<VendorList />} />
            <Route path="vendors-v2/create"    element={<VendorCreate />} />
            <Route path="vendors-v2/:id"       element={<VendorProfile />} />
            <Route path="vendors-v2/:id/edit"  element={<VendorCreate />} />
            <Route path="vendors-recommend"    element={<VendorRecommendation />} />
            <Route path="projects"             element={<ProjectList />} />
            <Route path="projects/create"      element={<ProjectCreate />} />
            <Route path="projects/:id"         element={<ProjectDetail />} />
            <Route path="projects/:id/edit"    element={<ProjectCreate />} />
            <Route path="vendor-maintenance"   element={<VendorMaintenance />} />
            <Route path="vendor-partners"      element={<GlobalPartners />} />
            <Route path="vendor-sla"           element={<VendorSLA />} />
            <Route path="vendor-sla-heatmap"   element={<VendorSLAHeatmap />} />
          </Route>

          {/* ── Fallback ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
