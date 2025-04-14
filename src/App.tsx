import React from 'react';
import './assets/scss/style.scss';
import Routing from './Routes';
import { Provider } from 'react-redux';
import store from './Slices/theme/store';
import AuthProvider from 'hooks/AuthProvider';


function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </Provider>
  );
}

export default App;