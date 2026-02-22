import '../styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { InventoryProvider } from '../context/InventoryContext';

export default function App({ Component, pageProps }) {
  return (
    <InventoryProvider>
      <Component {...pageProps} />
      <ToastContainer position="top-right" autoClose={3000} />
    </InventoryProvider>
  );
}