import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Suppress known benign third-party warnings (e.g., react-native-chart-kit defaultProps in React 19)
LogBox.ignoreLogs([
  'Support for defaultProps will be removed',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'VirtualizedLists should never be nested',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
