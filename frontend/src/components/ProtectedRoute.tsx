/**
 * Re-exports AuthGate — React Navigation has no route objects like react-router;
 * we guard the whole main stack at the App root.
 */
export { AuthGate as ProtectedRoute } from '../hooks/useAuth';
