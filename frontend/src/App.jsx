import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import { useStore } from './store/useStore'
import LocationsMap from './pages/LocationsMap'
import Inbound from './pages/Inbound'
import Requests from './pages/Requests'
import Audit from './pages/Audit'
import UsersManagement from './pages/UsersManagement'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import WriteOffs from './pages/WriteOffs'
import Transfers from './pages/Transfers'
import RequireRole from './components/RequireRole'
import PrintLabels from './pages/PrintLabels'

function App() {
  const user = useStore(state => state.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={<Layout />}>
          {/* Globally accessible routes (for logged in users) */}
          <Route index element={<Dashboard />} />
          <Route path="components" element={<Inventory />} />
          
          <Route element={<RequireRole allowedRoles={[]} />}>
            <Route path="users" element={<UsersManagement />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['storekeeper']} />}>
            <Route path="inbound" element={<Inbound />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['storekeeper', 'auditor']} />}>
            <Route path="locations" element={<LocationsMap />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['storekeeper', 'seller', 'director']} />}>
            <Route path="requests" element={<Requests />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['auditor']} />}>
            <Route path="audit" element={<Audit />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['admin', 'storekeeper', 'auditor']} />}>
            <Route path="print-labels" element={<PrintLabels />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['admin', 'storekeeper', 'director']} />}>
            <Route path="write-offs" element={<WriteOffs />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['admin', 'storekeeper']} />}>
            <Route path="transfers" element={<Transfers />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['buyer']} />}>
            <Route path="purchases" element={<Purchases />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['director']} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
